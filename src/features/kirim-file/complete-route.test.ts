import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ env: null as unknown }));
vi.mock('cloudflare:workers', () => ({ get env() { return state.env; } }));
vi.mock('./r2', () => ({ hasR2Config: () => true, headObject: vi.fn(async () => 10), deleteObject: vi.fn(async () => undefined) }));
import { POST } from '../../pages/api/shares/[id]/complete';
import { deleteObject, headObject } from './r2';

const ID = 'a'.repeat(32);
let status: string, statements: string[];
beforeEach(() => {
	vi.resetAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => undefined);
	vi.mocked(headObject).mockResolvedValue(10); status = 'uploading'; statements = [];
	state.env = { DB: { prepare(sql: string) {
		statements.push(sql);
		const statement = { bind() { return statement; }, async first() { return { status, expires_at: Date.now() + 10000 }; }, async all() { return { results: [{ object_key: 'key', name: 'a', size: 10 }] }; }, async run() {
			if (sql.startsWith('UPDATE shares SET status = ?') && (!sql.includes("status != 'deleted'") || status !== 'deleted')) status = 'ready';
			if (sql.startsWith("UPDATE shares SET status = 'deleted'")) status = 'deleted';
			return {};
		} }; return statement;
	} } };
});
afterEach(() => vi.restoreAllMocks());

describe('complete dan penghapusan pengirim', () => {
	it('tetap menyelesaikan unggahan normal', async () => { expect((await POST({ params: { id: ID } } as never)).status).toBe(200); expect(status).toBe('ready'); });
	it('tidak mengaktifkan kembali kiriman yang dihapus saat pengecekan R2', async () => {
		vi.mocked(headObject).mockImplementation(async () => { status = 'deleted'; return 10; });
		await POST({ params: { id: ID } } as never); expect(status).toBe('deleted');
	});
	it('verifikasi gagal dan R2 gagal hapus tidak membuang tracking', async () => {
		vi.mocked(headObject).mockResolvedValue(null as never); vi.mocked(deleteObject).mockRejectedValue(new Error('R2 unavailable'));
		expect((await POST({ params: { id: ID } } as never)).status).toBe(409); expect(status).toBe('deleted'); expect(statements.some((sql) => sql.startsWith('DELETE FROM'))).toBe(false);
	});
});
