import { describe, expect, it } from 'vitest';
import { loadSavedShares, managePath, removeSavedShare, saveShare, SAVED_SHARES_KEY, type SavedShare } from './saved-shares';

function store(raw = '[]') { const data = new Map([[SAVED_SHARES_KEY, raw]]); return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } }; }
const entry = (overrides: Partial<SavedShare> = {}): SavedShare => ({ id: 'a'.repeat(32), token: 'b'.repeat(43), expiresAt: 10000, fileNames: ['tugas.pdf'], ...overrides });

describe('Kiriman kamu', () => {
	it('menyimpan, membaca, dan memperbarui tanpa duplikasi', () => {
		const storage = store(); expect(saveShare(storage, entry(), 1000)).toBe(true);
		expect(loadSavedShares(storage, 1000)).toEqual([entry()]);
		expect(saveShare(storage, entry({ fileNames: ['baru.pdf'] }), 1000)).toBe(true);
		expect(loadSavedShares(storage, 1000)).toEqual([entry({ fileNames: ['baru.pdf'] })]);
	});
	it('memangkas kedaluwarsa, duplikasi, dan data tidak valid', () => {
		const storage = store(JSON.stringify([entry({ expiresAt: 1000 }), entry(), entry(), { id: '<script>' }, entry({ token: 'x' })]));
		expect(loadSavedShares(storage, 1000)).toEqual([entry()]);
		expect(JSON.parse(storage.getItem(SAVED_SHARES_KEY)!)).toEqual([entry()]);
	});
	it('menghapus hanya dari daftar lokal', () => {
		const storage = store(JSON.stringify([entry()])); expect(removeSavedShare(storage, entry().id, 1000)).toBe(true); expect(loadSavedShares(storage, 1000)).toEqual([]);
	});
	it('menangani data kosong, JSON rusak, dan penyimpanan ditolak', () => {
		for (const raw of ['', 'bad', '{}', 'null']) expect(loadSavedShares(store(raw), 1000)).toEqual([]);
		const denied = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
		expect(loadSavedShares(denied)).toEqual([]); expect(saveShare(denied, entry(), 1000)).toBe(false); expect(removeSavedShare(denied, entry().id)).toBe(false);
		expect(saveShare(null, entry(), 1000)).toBe(false); expect(saveShare(store(), entry({ expiresAt: 1000 }), 1000)).toBe(false);
	});
	it('membatasi daftar 50 item dan menyimpan token hanya di fragmen link', () => {
		const storage = store();
		for (let i = 0; i < 51; i++) saveShare(storage, entry({ id: i.toString(16).padStart(32, '0') }), 1000);
		expect(loadSavedShares(storage, 1000)).toHaveLength(50);
		const url = new URL(managePath(entry().id, entry().token), 'https://toolsman.test');
		expect(url.search).toBe(''); expect(url.hash).toBe(`#t=${entry().token}`); expect(url.pathname).not.toContain(entry().token);
	});
});
