import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { purgeExhaustedFiles, removeExpiredShares } from './cleanup';

interface FakeShare {
	id: string;
	status: 'uploading' | 'ready' | 'deleted';
	expires_at: number;
	max_downloads: number | null;
}

interface FakeFile {
	share_id: string;
	object_key: string;
	name: string;
	size: number;
	mime: string;
	downloads: number;
	purged: number;
}

function makeEnv(shares: FakeShare[], files: FakeFile[], reports: { share_id: string }[] = []) {
	const db = {
		prepare(sql: string) {
			let bound: unknown[] = [];
			const statement = {
				bind(...values: unknown[]) {
					bound = values;
					return statement;
				},
				async all() {
					if (sql.includes('FROM share_files f')) {
						const [now, limit] = bound as [number, number];
						const results = files
							.filter((file) => {
								const share = shares.find((item) => item.id === file.share_id);
								return Boolean(
									share &&
										share.status === 'ready' &&
										share.max_downloads !== null &&
										file.purged === 0 &&
										file.downloads >= share.max_downloads &&
										share.expires_at > now,
								);
							})
							.slice(0, limit)
							.map((file) => ({ share_id: file.share_id, object_key: file.object_key }));
						return { results };
					}

					if (sql.includes('SELECT id FROM shares')) {
						const [now, limit] = bound as [number, number];
						return {
							results: shares
								.filter((share) => share.status !== 'deleted' && share.expires_at <= now)
								.slice(0, limit)
								.map((share) => ({ id: share.id })),
						};
					}

					if (sql.includes('SELECT * FROM share_files WHERE share_id')) {
						const [shareId] = bound as [string];
						return { results: files.filter((file) => file.share_id === shareId) };
					}

					throw new Error(`query tidak dikenal: ${sql}`);
				},
				async run() {
					if (sql.startsWith("UPDATE shares SET status = 'deleted'")) {
						const [id] = bound as [string];
						const share = shares.find((item) => item.id === id);
						if (share) share.status = 'deleted';
						return {};
					}

					if (sql.startsWith('DELETE FROM share_files WHERE share_id')) {
						const [id] = bound as [string];
						for (let index = files.length - 1; index >= 0; index -= 1) {
							if (files[index]!.share_id === id) files.splice(index, 1);
						}
						return {};
					}

					if (sql.startsWith('DELETE FROM reports WHERE share_id')) {
						const [id] = bound as [string];
						for (let index = reports.length - 1; index >= 0; index -= 1) {
							if (reports[index]!.share_id === id) reports.splice(index, 1);
						}
						return {};
					}

					if (sql.startsWith('DELETE FROM upload_parts WHERE share_id')) {
						return {};
					}

					if (sql.startsWith('UPDATE share_files SET purged = 1')) {
						const [shareId, objectKey] = bound as [string, string];
						const file = files.find(
							(item) => item.share_id === shareId && item.object_key === objectKey,
						);
						if (file) file.purged = 1;
						return {};
					}

					throw new Error(`query tidak dikenal: ${sql}`);
				},
				async first() {
					return null;
				},
			};
			return statement;
		},
	};

	return {
		DB: db as never,
		R2_ACCOUNT_ID: 'akun',
		R2_ACCESS_KEY_ID: 'kunci',
		R2_SECRET_ACCESS_KEY: 'rahasia',
		R2_BUCKET: 'berkas',
	};
}

const file = (overrides: Partial<FakeFile>): FakeFile => ({
	share_id: 'a',
	object_key: 'a/0-satu.pdf',
	name: 'satu.pdf',
	size: 10,
	mime: 'application/pdf',
	downloads: 0,
	purged: 0,
	...overrides,
});

const share = (overrides: Partial<FakeShare>): FakeShare => ({
	id: 'a',
	status: 'ready',
	expires_at: 10_000,
	max_downloads: null,
	...overrides,
});

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
	vi.stubGlobal('fetch', fetchMock);
	vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

function failFor(fragment: string): void {
	fetchMock.mockImplementation(async (input: Request | string) => {
		const url = String((input as Request).url ?? input);
		return new Response(null, { status: url.includes(fragment) ? 403 : 200 });
	});
}

describe('purgeExhaustedFiles', () => {
	it('menghapus objek berkas yang kuotanya habis dan menandainya purged', async () => {
		const shares = [share({ id: 'a', max_downloads: 1 })];
		const files = [
			file({ object_key: 'a/0-habis.pdf', downloads: 1 }),
			file({ object_key: 'a/1-sisa.pdf', downloads: 0 }),
		];

		const count = await purgeExhaustedFiles(makeEnv(shares, files), 5_000);

		expect(count).toBe(1);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(files[0]!.purged).toBe(1);
		expect(files[1]!.purged).toBe(0);
	});

	it('melewati link yang sudah kedaluwarsa dan link tanpa batas unduhan', async () => {
		const shares = [
			share({ id: 'a', max_downloads: 1, expires_at: 1_000 }),
			share({ id: 'b', max_downloads: null }),
			share({ id: 'c', max_downloads: 2 }),
		];
		const files = [
			file({ share_id: 'a', object_key: 'a/0.pdf', downloads: 1 }),
			file({ share_id: 'b', object_key: 'b/0.pdf', downloads: 9 }),
			file({ share_id: 'c', object_key: 'c/0.pdf', downloads: 1 }),
		];

		const count = await purgeExhaustedFiles(makeEnv(shares, files), 5_000);

		expect(count).toBe(0);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('tidak mengulang berkas yang sudah purged', async () => {
		const shares = [share({ id: 'a', max_downloads: 1 })];
		const files = [file({ object_key: 'a/0.pdf', downloads: 1, purged: 1 })];

		const count = await purgeExhaustedFiles(makeEnv(shares, files), 5_000);

		expect(count).toBe(0);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('memproses antrean sampai habis, bukan hanya satu batch', async () => {
		const files = Array.from({ length: 60 }, (_, index) =>
			file({ object_key: `a/${index}.pdf`, downloads: 1 }),
		);
		const shares = [share({ id: 'a', max_downloads: 1 })];

		const count = await purgeExhaustedFiles(makeEnv(shares, files), 5_000);

		expect(count).toBe(60);
		expect(files.every((item) => item.purged === 1)).toBe(true);
	});

	it('satu kegagalan tidak menghentikan berkas lain dan tidak menandainya purged', async () => {
		failFor('gagal');
		const shares = [share({ id: 'a', max_downloads: 1 })];
		const files = [
			file({ object_key: 'a/gagal.pdf', downloads: 1 }),
			file({ object_key: 'a/ok.pdf', downloads: 1 }),
		];

		const count = await purgeExhaustedFiles(makeEnv(shares, files), 5_000);

		expect(count).toBe(1);
		expect(files[0]!.purged).toBe(0);
		expect(files[1]!.purged).toBe(1);
		expect(console.error).toHaveBeenCalled();
	});

	it('berhenti kalau batas waktu habis', async () => {
		const shares = [share({ id: 'a', max_downloads: 1 })];
		const files = [file({ object_key: 'a/0.pdf', downloads: 1 })];

		const count = await purgeExhaustedFiles(makeEnv(shares, files), 5_000, 0);

		expect(count).toBe(0);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe('removeExpiredShares', () => {
	it('menghapus objek, baris berkas, laporan, dan menandai link terhapus', async () => {
		const shares = [
			share({ id: 'a', expires_at: 1_000 }),
			share({ id: 'b', expires_at: 10_000 }),
		];
		const files = [
			file({ share_id: 'a', object_key: 'a/0.pdf' }),
			file({ share_id: 'a', object_key: 'a/1.pdf' }),
			file({ share_id: 'b', object_key: 'b/0.pdf' }),
		];
		const reports = [{ share_id: 'a' }, { share_id: 'b' }];

		const count = await removeExpiredShares(makeEnv(shares, files, reports), 5_000);

		expect(count).toBe(1);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(shares[0]!.status).toBe('deleted');
		expect(files.map((item) => item.share_id)).toEqual(['b']);
		expect(reports).toEqual([{ share_id: 'b' }]);
	});

	it('memproses antrean sampai habis, bukan hanya satu batch', async () => {
		const shares = Array.from({ length: 51 }, (_, index) =>
			share({ id: `s${index}`, expires_at: 1_000 }),
		);
		const files = shares.map((item) => file({ share_id: item.id, object_key: `${item.id}/0.pdf` }));

		const count = await removeExpiredShares(makeEnv(shares, files), 5_000);

		expect(count).toBe(51);
		expect(shares.every((item) => item.status === 'deleted')).toBe(true);
	});

	it('satu berkas gagal dihapus: link itu dipertahankan, link lain tetap bersih', async () => {
		failFor('gagal');
		const shares = [
			share({ id: 'a', expires_at: 1_000 }),
			share({ id: 'b', expires_at: 1_000 }),
		];
		const files = [
			file({ share_id: 'a', object_key: 'a/gagal.pdf' }),
			file({ share_id: 'b', object_key: 'b/ok.pdf' }),
		];

		const count = await removeExpiredShares(makeEnv(shares, files), 5_000);

		expect(count).toBe(1);
		expect(shares[0]!.status).toBe('ready');
		expect(shares[1]!.status).toBe('deleted');
		expect(files).toEqual([expect.objectContaining({ share_id: 'a' })]);
		expect(console.error).toHaveBeenCalled();
	});
});
