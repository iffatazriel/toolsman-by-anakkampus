import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ShareFileRow, ShareRow } from './db';
import { createManageToken, hashManageToken } from './manage-token';

const state = vi.hoisted(() => ({ env: null as unknown }));
vi.mock('cloudflare:workers', () => ({ get env() { return state.env; } }));
vi.mock('./r2', () => ({ deleteObject: vi.fn(async () => undefined), abortMultipartUpload: vi.fn(async () => undefined), hasR2Config: vi.fn(() => true) }));
import { DELETE, POST } from '../../pages/api/shares/[id]/manage';
import { abortMultipartUpload, deleteObject, hasR2Config } from './r2';
import { removeExpiredShares } from './cleanup';

const ID = 'a'.repeat(32);
type ManagedRow = ShareRow & { manage_token_hash: string | null };
let token: string, share: ManagedRow | null, files: ShareFileRow[], statements: string[];

function installEnv() {
	const env = {
		DB: { prepare(sql: string) {
			statements.push(sql); let bound: unknown[] = [];
			const query = {
				bind(...values: unknown[]) { bound = values; return query; },
				async first() { return bound[0] === ID ? share : null; },
				async all() {
					if (sql.startsWith('SELECT id, expires_at')) {
						const now = bound[0] as number;
						return { results: share && ((share.status !== 'deleted' && share.expires_at <= now) || (share.status === 'deleted' && files.some((file) => !file.purged || file.upload_id || share!.expires_at <= now))) ? [share] : [] };
					}
					return { results: files };
				},
				async run() {
					if (sql.startsWith('UPDATE shares') && share) share.status = 'deleted';
					if (sql.startsWith('UPDATE share_files SET purged = 1')) for (const file of files) { file.purged = 1; file.upload_id = null; }
					if (sql.startsWith('UPDATE share_files SET purged = 0')) for (const file of files) file.purged = 0;
					if (sql.startsWith('DELETE FROM share_files')) files = [];
					return {};
				},
			}; return query;
		} } as never,
		PASSWORD_LIMIT: { limit: vi.fn(async () => ({ success: true })) },
		R2_ACCOUNT_ID: 'test', R2_ACCESS_KEY_ID: 'test', R2_SECRET_ACCESS_KEY: 'test', R2_BUCKET: 'test',
	}; state.env = env; return env;
}

async function call(method: 'POST' | 'DELETE' = 'POST', options: { id?: string; token?: string; body?: string; bearer?: boolean } = {}) {
	const auth = options.token ?? token;
	const headers: Record<string, string> = { 'CF-Connecting-IP': '1.1.1.1' };
	if (options.bearer) headers.Authorization = `Bearer ${auth}`;
	const request = new Request(`https://toolsman.test/api/shares/${ID}/manage`, { method, headers, body: options.body ?? (options.bearer ? undefined : JSON.stringify({ token: auth })) });
	return (method === 'POST' ? POST : DELETE)({ params: { id: options.id ?? ID }, request } as never);
}

beforeEach(async () => {
	vi.resetAllMocks(); vi.mocked(hasR2Config).mockReturnValue(true); vi.spyOn(console, 'error').mockImplementation(() => undefined);
	token = createManageToken(); statements = [];
	share = { id: ID, created_at: Date.now(), expires_at: Date.now() + 60000, status: 'ready', password_hash: 'hash', max_downloads: 1, downloads: 2, reported: 0, manage_token_hash: await hashManageToken(token) };
	files = [{ share_id: ID, object_key: `${ID}/a`, name: 'a.pdf', size: 10, mime: 'application/pdf', downloads: 1, purged: 1 }, { share_id: ID, object_key: `${ID}/b`, name: 'b.pdf', size: 20, mime: 'application/pdf', downloads: 0, purged: 0, upload_id: 'multipart-id' }];
	installEnv();
});
afterEach(() => vi.restoreAllMocks());

describe('manage API', () => {
	it('autorisasikan JSON atau Bearer dan hanya mengembalikan metadata aman', async () => {
		for (const bearer of [false, true]) {
			const response = await call('POST', { bearer }); expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toBe('no-store');
			const data = await response.json(); expect(data).toMatchObject({ status: 'ready', protected: true, oneTime: true, downloads: 2, available: true, files: [{ name: 'a.pdf', size: 10, downloads: 1, purged: true }, { name: 'b.pdf', size: 20, downloads: 0, purged: false }] });
			expect(JSON.stringify(data)).not.toMatch(/manage_token|password_hash|object_key|upload_id/); expect(JSON.stringify(data)).not.toContain(token);
		}
	});
	it('mengembalikan 404 identik untuk token salah, ID asing, dan kiriman lama', async () => {
		const responses = [await call('POST', { token: createManageToken() }), await call('DELETE', { id: 'b'.repeat(32) })];
		share!.manage_token_hash = null; responses.push(await call()); share = null; responses.push(await call());
		for (const response of responses) { expect(response.status).toBe(404); expect(await response.text()).toBe('{"error":"Tidak ditemukan."}'); }
		expect(deleteObject).not.toHaveBeenCalled();
	});
	it('menolak body rusak, null, array, tipe token salah, dan body berlebih', async () => {
		for (const body of ['{', 'null', '[]', '{"token":123}', '{"unknown":true}', 'x'.repeat(2049)]) for (const method of ['POST', 'DELETE'] as const) expect((await call(method, { body })).status).toBe(400);
	});
	it('menolak header salah dan token yang bertentangan', async () => {
		expect((await call('POST', { bearer: true, token: 'bad' })).status).toBe(404);
		expect((await call('POST', { bearer: true, body: JSON.stringify({ token: createManageToken() }) })).status).toBe(400);
	});
	it('membatasi percobaan per IP dan ID sebelum membaca data', async () => {
		const env = installEnv(); env.PASSWORD_LIMIT.limit.mockResolvedValue({ success: false });
		expect((await call()).status).toBe(429); expect(statements).toHaveLength(0); expect(env.PASSWORD_LIMIT.limit).toHaveBeenCalledWith({ key: `manage:1.1.1.1:${ID}` });
	});
	it('melaporkan kedaluwarsa dan takedown sebagai tidak tersedia', async () => {
		share!.expires_at = Date.now() - 1; expect(await (await call()).json()).toMatchObject({ available: false });
		share!.expires_at = Date.now() + 60000; share!.takedown_at = Date.now(); expect(await (await call()).json()).toMatchObject({ available: false });
	});
	it('menghapus/abort semua objek sesudah menutup akses, menyimpan tracking', async () => {
		vi.mocked(deleteObject).mockImplementation(async () => { expect(share!.status).toBe('deleted'); });
		const response = await call('DELETE', { bearer: true }); expect(response.status).toBe(200); expect(await response.json()).toEqual({ ok: true, pendingCleanup: false });
		expect(deleteObject).toHaveBeenCalledTimes(2); expect(abortMultipartUpload).toHaveBeenCalledWith(expect.anything(), `${ID}/b`, 'multipart-id'); expect(files).toHaveLength(2); expect(files.every((file) => file.purged && !file.upload_id)).toBe(true);
		expect(statements.some((sql) => sql.startsWith('DELETE FROM'))).toBe(false);
		expect(await (await call()).json()).toMatchObject({ status: 'deleted', available: false, downloads: 2 });
	});
	it('partial R2 failure tetap retryable dan dipulihkan cron sebelum kedaluwarsa', async () => {
		vi.mocked(deleteObject).mockRejectedValueOnce(new Error('R2 failure'));
		const response = await call('DELETE'); expect(response.status).toBe(202); expect(await response.json()).toEqual({ ok: true, pendingCleanup: true });
		expect(share!.status).toBe('deleted'); expect(files).toHaveLength(2); expect(files[1]!.upload_id).toBe('multipart-id'); expect(files[1]!.purged).toBe(0);
		const env = installEnv(); expect(await removeExpiredShares(env)).toBe(1); expect(files.every((file) => file.purged)).toBe(true); expect(files).toHaveLength(2);
		expect(await removeExpiredShares(env, share!.expires_at + 1)).toBe(1); expect(files).toHaveLength(0);
	});
	it('abort gagal tidak membuang tracking dan penghapusan objek tetap dicoba', async () => {
		vi.mocked(abortMultipartUpload).mockRejectedValueOnce(new Error('abort failure'));
		expect((await call('DELETE')).status).toBe(202); expect(files[1]!.upload_id).toBe('multipart-id'); expect(deleteObject).toHaveBeenCalledTimes(2);
	});
	it('gangguan DB/R2 config menjadi 503, bukan sukses palsu', async () => {
		vi.mocked(hasR2Config).mockReturnValue(false); expect((await call('DELETE')).status).toBe(503); expect(share!.status).toBe('ready');
		state.env = { DB: { prepare() { throw new Error('DB unavailable'); } } }; expect((await call()).status).toBe(503);
	});
});
