import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ env: null as unknown }));
vi.mock('cloudflare:workers', () => ({ get env() { return state.env; } }));
vi.mock('./r2', () => ({ hasR2Config: () => true, headObject: vi.fn(async () => 10), deleteObject: vi.fn(async () => undefined) }));
import { POST } from '../../pages/api/shares/[id]/complete';
import { deleteObject, headObject } from './r2';

const ID = 'a'.repeat(32);
let status: string, statements: string[], takedownAt: number | null, failUpdate: boolean, failRollback: boolean;
let files: { object_key: string; name: string; size: number }[];
beforeEach(() => {
	vi.resetAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => undefined);
	vi.mocked(headObject).mockResolvedValue(10); status = 'uploading'; statements = [];
	takedownAt = null; failUpdate = false; failRollback = false; files = [{ object_key: 'key', name: 'a', size: 10 }];
	state.env = { DB: { prepare(sql: string) {
		statements.push(sql);
		const statement = { bind() { return statement; }, async first() {
			if (sql.startsWith('UPDATE shares SET status = ?')) {
				if (failUpdate) throw new Error('D1 unavailable');
				if (status === 'deleted' || takedownAt !== null) return null;
				status = 'ready'; return { id: ID };
			}
			return { status, expires_at: Date.now() + 10000, takedown_at: takedownAt };
		}, async all() { return { results: files }; }, async run() {
			if (failRollback) throw new Error('rollback failed');
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
		const response = await POST({ params: { id: ID } } as never);
		expect(response.status).toBe(410); expect(status).toBe('deleted');
		await expect(response.json()).resolves.toEqual({ error: 'Kiriman sudah dihapus atau dinonaktifkan. Buat kiriman baru untuk mengunggah ulang.' });
		expect(statements.some((sql) => sql.includes("status != 'deleted'") && sql.includes('takedown_at IS NULL RETURNING id'))).toBe(true);
	});
	it('menolak kiriman yang dinonaktifkan saat pengecekan R2', async () => {
		vi.mocked(headObject).mockImplementation(async () => { takedownAt = Date.now(); return 10; });
		expect((await POST({ params: { id: ID } } as never)).status).toBe(410); expect(status).toBe('uploading');
	});
	it('tidak menyelesaikan daftar berkas kosong', async () => {
		files = [];
		expect((await POST({ params: { id: ID } } as never)).status).toBe(409); expect(headObject).not.toHaveBeenCalled(); expect(status).toBe('uploading');
	});
	it('mengembalikan kegagalan server jika update D1 gagal', async () => {
		failUpdate = true;
		const request = new Request(`https://toolsman.test/api/shares/${ID}/complete`, { method: 'POST' });
		expect((await POST({ params: { id: ID }, request } as never)).status).toBe(500); expect(status).toBe('uploading');
		expect(JSON.parse(vi.mocked(console.error).mock.calls[0]![0])).toMatchObject({ event: 'shares.complete_failed', route: '/api/shares/:id/complete', method: 'POST', shareId: ID });
	});
	it('mencatat kegagalan rollback tanpa menghapus tracking', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		failRollback = true; vi.mocked(headObject).mockResolvedValue(null as never);
		const request = new Request(`https://toolsman.test/api/shares/${ID}/complete`, { method: 'POST' });
		expect((await POST({ params: { id: ID }, request } as never)).status).toBe(409);
		expect(statements.some((sql) => sql.startsWith('DELETE FROM'))).toBe(false);
		expect(JSON.parse(vi.mocked(console.warn).mock.calls[0]![0])).toMatchObject({ event: 'shares.complete_rollback_failed', route: '/api/shares/:id/complete', method: 'POST', shareId: ID });
	});
	it('verifikasi gagal dan R2 gagal hapus tidak membuang tracking', async () => {
		vi.mocked(headObject).mockResolvedValue(null as never); vi.mocked(deleteObject).mockRejectedValue(new Error('R2 unavailable'));
		expect((await POST({ params: { id: ID } } as never)).status).toBe(409); expect(status).toBe('deleted'); expect(statements.some((sql) => sql.startsWith('DELETE FROM'))).toBe(false);
	});
});
