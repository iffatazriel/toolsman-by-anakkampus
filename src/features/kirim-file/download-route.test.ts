import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ShareFileRow, ShareRow } from './db';
import { hashPassword } from './password';

const state = vi.hoisted(() => ({ env: null as unknown }));

vi.mock('cloudflare:workers', () => ({
	get env() {
		return state.env;
	},
}));

import { POST } from '../../pages/api/shares/[id]/download/[index]';

const ID = 'a'.repeat(32);

function makeShare(overrides: Partial<ShareRow> = {}): ShareRow {
	return {
		id: ID,
		expires_at: Date.now() + 60_000,
		created_at: Date.now(),
		status: 'ready',
		max_downloads: null,
		downloads: 0,
		reported: 0,
		password_hash: null,
		...overrides,
	};
}

function makeFile(overrides: Partial<ShareFileRow> = {}): ShareFileRow {
	return {
		share_id: ID,
		file_index: 0,
		object_key: `${ID}/0-halaman.html`,
		name: 'halaman.html',
		size: 24,
		mime: 'text/html',
		downloads: 0,
		purged: 0,
		upload_id: null,
		...overrides,
	};
}

function installEnv(share: ShareRow, files: ShareFileRow[]) {
	const env = {
		DB: {
			prepare(sql: string) {
				let bound: unknown[] = [];
				const statement = {
					bind(...values: unknown[]) {
						bound = values;
						return statement;
					},
					async first() {
						if (sql.startsWith('SELECT * FROM shares')) return share;

						if (sql.includes('RETURNING downloads')) {
							const [max] = bound.slice(2) as [number];
							const key = bound[1] as string;
							const file = files.find((item) => item.object_key === key);
							if (!file || file.downloads >= max) return null;
							file.downloads += 1;
							return { downloads: file.downloads };
						}

						return null;
					},
					async all() {
						if (sql.startsWith('SELECT * FROM share_files')) return { results: files };
						return { results: [] };
					},
					async run() {
						return {};
					},
				};
				return statement;
			},
		},
		R2_ACCOUNT_ID: 'akun',
		R2_ACCESS_KEY_ID: 'kunci',
		R2_SECRET_ACCESS_KEY: 'rahasia',
		R2_BUCKET: 'berkas',
	};

	state.env = env;
	return env;
}

function postRequest(password?: string): Request {
	const init: RequestInit = {
		method: 'POST',
		headers: { 'CF-Connecting-IP': '1.1.1.1' },
	};
	if (password !== undefined) {
		const body = new FormData();
		body.set('password', password);
		init.body = body;
	}
	return new Request(`https://toolsman.test/api/shares/${ID}/download/0`, init);
}

async function callRoute(request: Request): Promise<Response> {
	return POST({ params: { id: ID, index: '0' }, request } as never);
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	fetchMock = vi.fn(async (input: Request | string) => {
		const url = String((input as Request).url ?? input);
		const html = url.includes('.html');
		return new Response(html ? '<script>alert(1)</script>' : '<svg/>', {
			status: 200,
			headers: { 'Content-Type': html ? 'text/html' : 'image/svg+xml' },
		});
	});
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('rute unduh tidak membocorkan URL', () => {
	it('menolak share berkata sandi tanpa kata sandi yang benar', async () => {
		installEnv(makeShare({ password_hash: await hashPassword('rahasia') }), [makeFile()]);

		const response = await callRoute(postRequest());

		expect(response.status).toBe(401);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('menolak kata sandi yang salah', async () => {
		installEnv(makeShare({ password_hash: await hashPassword('rahasia') }), [makeFile()]);

		const response = await callRoute(postRequest('salah'));

		expect(response.status).toBe(401);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('menolak share sekali unduh yang kuotanya sudah habis', async () => {
		installEnv(makeShare({ max_downloads: 1 }), [makeFile({ downloads: 1 })]);

		const response = await callRoute(postRequest());

		expect(response.status).toBe(410);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('menolak share yang sudah kedaluwarsa', async () => {
		installEnv(makeShare({ expires_at: Date.now() - 1 }), [makeFile()]);

		const response = await callRoute(postRequest());

		expect(response.status).toBe(410);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('menolak share yang dinonaktifkan manual, walau tanpa kata sandi', async () => {
		installEnv(makeShare({ status: 'deleted', takedown_at: Date.now() }), [makeFile()]);

		const response = await callRoute(postRequest());

		expect(response.status).toBe(410);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe('header unduhan', () => {
	it('memaksa .html menjadi lampiran octet-stream dan menandatangani URL R2', async () => {
		installEnv(makeShare(), [makeFile()]);

		const response = await callRoute(postRequest());

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('application/octet-stream');
		expect(response.headers.get('Content-Disposition')).toBe(
			"attachment; filename*=UTF-8''halaman.html",
		);
		expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');

		const [input] = fetchMock.mock.calls[0] as [string | Request];
		const signed = new URL(typeof input === 'string' ? input : input.url);
		expect(signed.searchParams.get('response-content-disposition')).toBe(
			"attachment; filename*=UTF-8''halaman.html",
		);
		expect(signed.searchParams.get('response-content-type')).toBe('application/octet-stream');
	});

	it('memperlakukan .svg dengan cara yang sama', async () => {
		installEnv(makeShare(), [
			makeFile({ object_key: `${ID}/0-gambar.svg`, name: 'gambar.svg', mime: 'image/svg+xml' }),
		]);

		const response = await callRoute(postRequest());

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('application/octet-stream');
		expect(response.headers.get('Content-Disposition')).toBe(
			"attachment; filename*=UTF-8''gambar.svg",
		);
	});

	it('mengizinkan unduhan biasa yang masih bersisa', async () => {
		installEnv(makeShare({ max_downloads: 1 }), [makeFile()]);

		const response = await callRoute(postRequest());

		expect(response.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});
