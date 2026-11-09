import { afterEach, describe, expect, it, vi } from 'vitest';
import { takedownShare } from './takedown';

const ID = 'c'.repeat(32);

function makeStore(keys: string[], failing: string[] = []) {
	const deleted: string[] = [];
	const marked: number[] = [];
	const cleared: string[] = [];
	const store = {
		async listKeys(shareId: string) {
			expect(shareId).toBe(ID);
			return keys;
		},
		async markTakenDown(shareId: string, at: number) {
			expect(shareId).toBe(ID);
			marked.push(at);
		},
		async removeObject(key: string) {
			if (failing.includes(key)) throw new Error('R2 menolak');
			deleted.push(key);
		},
		async clearRows(shareId: string) {
			expect(shareId).toBe(ID);
			cleared.push(shareId);
		},
	};
	return { store, deleted, marked, cleared };
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('takedownShare', () => {
	it('menonaktifkan link lebih dulu, lalu menghapus semua objek', async () => {
		const { store, deleted, marked, cleared } = makeStore(['a/0-satu.pdf', 'a/1-dua.pdf']);

		const result = await takedownShare(store, ID, 1_000);

		expect(result).toEqual({ ok: true, deleted: 2, failed: [] });
		expect(marked).toEqual([1_000]);
		expect(deleted).toEqual(['a/0-satu.pdf', 'a/1-dua.pdf']);
		expect(cleared).toEqual([ID]);
	});

	it('tetap menonaktifkan link walau belum ada berkas', async () => {
		const { store, marked, cleared } = makeStore([]);

		const result = await takedownShare(store, ID, 1_000);

		expect(result.ok).toBe(true);
		expect(marked).toEqual([1_000]);
		expect(cleared).toEqual([ID]);
	});

	it('melaporkan objek yang gagal dihapus dan tidak menghapus barisnya', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const { store, deleted, marked, cleared } = makeStore(
			['a/0-ok.pdf', 'a/1-gagal.pdf'],
			['a/1-gagal.pdf'],
		);

		const result = await takedownShare(store, ID, 1_000);

		expect(result.ok).toBe(false);
		expect(result.deleted).toBe(1);
		expect(result.failed).toEqual(['a/1-gagal.pdf']);
		expect(marked).toEqual([1_000]);
		expect(deleted).toEqual(['a/0-ok.pdf']);
		expect(cleared).toEqual([]);
		expect(console.error).toHaveBeenCalled();
	});
});
