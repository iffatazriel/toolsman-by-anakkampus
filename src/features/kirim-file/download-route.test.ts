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
						if (sql.startsWith('UPDATE shares')) share.downloads += 1;
						if (sql.startsWith('UPDATE share_files SET downloads')) {
							const file = files.find((item) => item.object_key === bound[1]);
							if (file) file.downloads += 1;
						}
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

function postRequest(password?: string, lang?: string): Request {
	const init: RequestInit = {
		method: 'POST',
		headers: { 'CF-Connecting-IP': '1.1.1.1' },
	};
	if (password !== undefined || lang !== undefined) {
		const body = new FormData();
		if (password !== undefined) body.set('password', password);
		if (lang !== undefined) body.set('lang', lang);
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
	it('mencatat unduhan tiap berkas untuk kiriman tanpa batas unduhan', async () => {
		const file = makeFile(); const share = makeShare(); installEnv(share, [file]);
		expect((await callRoute(postRequest())).status).toBe(200); expect(file.downloads).toBe(1); expect(share.downloads).toBe(1);
	});
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
	it('streams a protected download without reading or buffering its body', async () => {
		const file = makeFile(), share = makeShare({ password_hash: await hashPassword('rahasia') });
		installEnv(share, [file]);
		let controller!: ReadableStreamDefaultController<Uint8Array>;
		const stream = new ReadableStream<Uint8Array>({ start(value) { controller = value; value.enqueue(new TextEncoder().encode('first chunk')); } });
		const upstream = new Response(stream);
		fetchMock.mockResolvedValueOnce(upstream);
		const request = postRequest('rahasia', 'en');
		const parse = vi.spyOn(request, 'formData');
		const response = await callRoute(request);
		expect(response.status).toBe(200);
		expect(response.body).toBe(upstream.body);
		expect(upstream.bodyUsed).toBe(false);
		expect(parse).toHaveBeenCalledTimes(1);
		expect(file.downloads).toBe(1);
		expect(share.downloads).toBe(1);
		const reader = response.body!.getReader();
		expect(new TextDecoder().decode((await reader.read()).value)).toBe('first chunk');
		controller.close();
		expect((await reader.read()).done).toBe(true);
	});
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

describe('native download error languages', () => {
	it.each([undefined, '', 'fr', 'EN'])('defaults to Indonesian for lang=%s', async (lang) => {
		state.env = null;
		const response = await callRoute(postRequest(undefined, lang));
		expect(response.status).toBe(503);
		expect(response.headers.get('Content-Language')).toBe('id');
		expect(await response.text()).toBe('Layanan belum dikonfigurasi.');
	});
	it('translates early configuration errors from a native URL-encoded form', async () => {
		state.env = null;
		const request = new Request(`https://toolsman.test/api/shares/${ID}/download/0`, { method: 'POST', body: new URLSearchParams({ lang: 'en' }) });
		const response = await callRoute(request);
		expect(response.status).toBe(503);
		expect(response.headers.get('Content-Language')).toBe('en');
		expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
		expect(response.headers.get('Cache-Control')).toBe('no-store');
		expect(await response.text()).toBe('The service is not configured yet.');
	});
	it('falls back to Indonesian for a malformed form without a 500', async () => {
		state.env = null;
		const response = await callRoute(new Request(`https://toolsman.test/api/shares/${ID}/download/0`, { method: 'POST', headers: { 'Content-Type': 'multipart/form-data' }, body: 'invalid' }));
		expect(response.status).toBe(503);
		expect(await response.text()).toBe('Layanan belum dikonfigurasi.');
	});
	it.each([
		[{ expires_at: 1 }, {}, 410, 'This link has expired.'],
		[{ takedown_at: 1 }, {}, 410, 'This link has been disabled.'],
		[{ status: 'uploading' }, {}, 404, 'Not found.'],
		[{ max_downloads: 1 }, { downloads: 1 }, 410, 'This file has reached its download limit.'],
	] as const)('translates unavailable shares: %j', async (share, file, status, message) => {
		installEnv(makeShare(share), [makeFile(file)]);
		const response = await callRoute(postRequest(undefined, 'en'));
		expect(response.status).toBe(status);
		expect(await response.text()).toBe(message);
		expect(fetchMock).not.toHaveBeenCalled();
	});
	it('translates incorrect-password and rate-limit errors without consuming the form twice', async () => {
		const env = installEnv(makeShare({ password_hash: await hashPassword('rahasia') }), [makeFile()]);
		const request = postRequest('wrong', 'en');
		const parse = vi.spyOn(request, 'formData');
		const wrong = await callRoute(request);
		expect(wrong.status).toBe(401);
		expect(await wrong.text()).toBe('Incorrect password.');
		expect(parse).toHaveBeenCalledTimes(1);
		state.env = { ...env, PASSWORD_LIMIT: { limit: async () => ({ success: false }) } };
		const rate = await callRoute(postRequest('wrong', 'en'));
		expect(rate.status).toBe(429);
		expect(await rate.text()).toBe('Too many password attempts. Try again shortly.');
	});
	it.each(['throw', 'reject', 'empty'])('translates storage failures: %s', async (mode) => {
		installEnv(makeShare(), [makeFile()]);
		if (mode === 'throw') fetchMock.mockRejectedValueOnce(new Error('storage failure'));
		else fetchMock.mockResolvedValueOnce(new Response(null, { status: mode === 'reject' ? 503 : 200 }));
		const response = await callRoute(postRequest(undefined, 'en'));
		expect(response.status).toBe(502);
		expect(await response.text()).toBe('Could not retrieve the file from storage.');
	});
	it.each([
		['SELECT * FROM shares', 'The share could not be read.'],
		['SELECT * FROM share_files', 'The file list could not be read.'],
		['UPDATE share_files', 'Could not record the download.'],
	])('translates database failures: %s', async (prefix, message) => {
		const env = installEnv(makeShare(), [makeFile()]);
		const prepare = env.DB.prepare;
		env.DB.prepare = (sql) => { if (sql.startsWith(prefix)) throw new Error('database failure'); return prepare(sql); };
		const response = await callRoute(postRequest(undefined, 'en'));
		expect(response.status).toBe(503);
		expect(await response.text()).toBe(message);
	});
});
