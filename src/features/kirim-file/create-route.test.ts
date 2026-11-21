import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hashManageToken, MANAGE_TOKEN_PATTERN } from './manage-token';

const state = vi.hoisted(() => ({ env: null as unknown }));
vi.mock('cloudflare:workers', () => ({ get env() { return state.env; } }));
vi.mock('./r2', () => ({ hasR2Config: () => true, presignUpload: async () => 'https://upload.example.test/signed' }));
vi.mock('./turnstile', () => ({ verifyTurnstile: async () => true }));
vi.mock('./quota', () => ({ d1QuotaStore: () => ({}), reserveUploadQuota: async () => ({ ok: true }), releaseUploadQuota: async () => undefined, quotaMessage: () => 'Kuota habis.' }));
import { POST } from '../../pages/api/shares/index';

let writes: { sql: string; values: unknown[] }[];
beforeEach(() => {
	writes = [];
	state.env = { TURNSTILE_SECRET_KEY: 'test', DB: { prepare(sql: string) {
		const statement = { bind(...values: unknown[]) { writes.push({ sql, values }); return statement; }, async run() { return {}; } }; return statement;
	} } };
});

async function call(body: string) { return POST({ request: new Request('https://toolsman.test/api/shares', { method: 'POST', body }) } as never); }

describe('pembuatan kiriman dengan token kelola', () => {
	it('mengembalikan token sekali, hanya menyimpan SHA-256 di DB', async () => {
		const response = await call(JSON.stringify({ expiry: '1h', files: [{ name: 'tugas.pdf', size: 10, type: 'application/pdf' }] }));
		expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toBe('no-store');
		const data = await response.json(); expect(data.manageToken).toMatch(MANAGE_TOKEN_PATTERN);
		const share = writes.find((write) => write.sql.startsWith('INSERT INTO shares'))!;
		expect(share.sql).toContain('manage_token_hash'); expect(share.values[6]).toBe(await hashManageToken(data.manageToken)); expect(JSON.stringify(writes)).not.toContain(data.manageToken);
	});
	it('body JSON rusak dan tipe metadata tidak valid tidak menjadi 500', async () => {
		for (const body of ['{', 'null', '[]', '{}', '{"expiry":"toString","files":[]}', '{"expiry":"1h","files":[{}]}', '{"expiry":"1h","files":[null]}', '{"expiry":"1h","files":[{"name":"a","size":"10","type":"text/plain"}]}', '{"expiry":"1h","oneTime":"true","files":[]}']) expect((await call(body)).status).toBe(400);
		expect(writes).toHaveLength(0);
	});
});
