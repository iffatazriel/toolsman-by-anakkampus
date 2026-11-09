import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ShareFileRow } from './db';
import { verifyUploadedFiles } from './complete-share';

const file = (overrides: Partial<ShareFileRow> = {}): ShareFileRow => ({
	share_id: 'a',
	object_key: 'a/0-laporan.pdf',
	name: 'laporan.pdf',
	size: 10,
	mime: 'application/pdf',
	downloads: 0,
	purged: 0,
	...overrides,
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('verifyUploadedFiles', () => {
	it('lolos kalau semua objek ada dan ukurannya cocok', async () => {
		const removed: string[] = [];
		const result = await verifyUploadedFiles([file(), file({ object_key: 'a/1.pdf' })], {
			head: async () => 10,
			remove: async (key) => {
				removed.push(key);
			},
		});

		expect(result.ok).toBe(true);
		expect(removed).toEqual([]);
	});

	it('menolak dan menghapus semua objek kalau ada yang hilang', async () => {
		const removed: string[] = [];
		const result = await verifyUploadedFiles(
			[file(), file({ object_key: 'a/1.pdf', name: 'hilang.pdf' })],
			{
				head: async (key) => (key === 'a/1.pdf' ? null : 10),
				remove: async (key) => {
					removed.push(key);
				},
			},
		);

		expect(result.ok).toBe(false);
		expect(result.missing).toEqual(['hilang.pdf']);
		expect(removed).toEqual(['a/0-laporan.pdf', 'a/1.pdf']);
	});

	it('menolak dan menghapus semua objek kalau ukurannya tidak cocok', async () => {
		const removed: string[] = [];
		const result = await verifyUploadedFiles([file({ size: 10 })], {
			head: async () => 99,
			remove: async (key) => {
				removed.push(key);
			},
		});

		expect(result.ok).toBe(false);
		expect(result.mismatched).toEqual(['laporan.pdf']);
		expect(removed).toEqual(['a/0-laporan.pdf']);
	});

	it('tetap menolak kalau penghapusan objek gagal, tanpa melempar error', async () => {
		const result = await verifyUploadedFiles([file()], {
			head: async () => null,
			remove: async () => {
				throw new Error('R2 mati');
			},
		});

		expect(result.ok).toBe(false);
	});
});
