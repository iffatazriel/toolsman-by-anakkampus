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

function makeEnv(shares: FakeShare[], files: FakeFile[]) {
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

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('purgeExhaustedFiles', () => {
	it('menghapus objek berkas yang kuotanya habis dan menandainya purged', async () => {
		const shares: FakeShare[] = [
			{ id: 'a', status: 'ready', expires_at: 10_000, max_downloads: 1 },
		];
		const files: FakeFile[] = [
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
		const shares: FakeShare[] = [
			{ id: 'a', status: 'ready', expires_at: 1_000, max_downloads: 1 },
			{ id: 'b', status: 'ready', expires_at: 10_000, max_downloads: null },
			{ id: 'c', status: 'ready', expires_at: 10_000, max_downloads: 2 },
		];
		const files: FakeFile[] = [
			file({ share_id: 'a', object_key: 'a/0.pdf', downloads: 1 }),
			file({ share_id: 'b', object_key: 'b/0.pdf', downloads: 9 }),
			file({ share_id: 'c', object_key: 'c/0.pdf', downloads: 1 }),
		];

		const count = await purgeExhaustedFiles(makeEnv(shares, files), 5_000);

		expect(count).toBe(0);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('tidak mengulang berkas yang sudah purged', async () => {
		const shares: FakeShare[] = [
			{ id: 'a', status: 'ready', expires_at: 10_000, max_downloads: 1 },
		];
		const files: FakeFile[] = [
			file({ object_key: 'a/0.pdf', downloads: 1, purged: 1 }),
		];

		const count = await purgeExhaustedFiles(makeEnv(shares, files), 5_000);

		expect(count).toBe(0);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe('removeExpiredShares', () => {
	it('menghapus objek, baris berkas, dan menandai link terhapus', async () => {
		const shares: FakeShare[] = [
			{ id: 'a', status: 'ready', expires_at: 1_000, max_downloads: null },
			{ id: 'b', status: 'ready', expires_at: 10_000, max_downloads: null },
		];
		const files: FakeFile[] = [
			file({ share_id: 'a', object_key: 'a/0.pdf' }),
			file({ share_id: 'a', object_key: 'a/1.pdf' }),
			file({ share_id: 'b', object_key: 'b/0.pdf' }),
		];

		const count = await removeExpiredShares(makeEnv(shares, files), 5_000);

		expect(count).toBe(1);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(shares[0]!.status).toBe('deleted');
		expect(files.map((item) => item.share_id)).toEqual(['b']);
	});
});
