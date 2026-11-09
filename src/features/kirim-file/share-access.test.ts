import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { shareAccess } from './share-access';

const share = {
	status: 'ready' as const,
	expires_at: 10_000,
	password_hash: null as string | null,
	max_downloads: null as number | null,
};

const file = (overrides: Partial<{ downloads: number; purged: number }> = {}) => ({
	downloads: 0,
	purged: 0,
	...overrides,
});

describe('shareAccess', () => {
	it('mengunci share yang punya kata sandi sebelum sandinya benar', () => {
		expect(shareAccess({ ...share, password_hash: 'pbkdf2$...' }, [file()], 5_000)).toBe('locked');
		expect(
			shareAccess({ ...share, password_hash: 'pbkdf2$...' }, [file()], 5_000, true),
		).toBe('ok');
	});

	it('menandai habis kalau kuota sekali unduh sudah terpakai', () => {
		expect(shareAccess({ ...share, max_downloads: 1 }, [file({ downloads: 1 })], 5_000)).toBe(
			'exhausted',
		);
		expect(shareAccess({ ...share, max_downloads: 1 }, [file({ purged: 1 })], 5_000)).toBe(
			'exhausted',
		);
	});

	it('menandai link kedaluwarsa tepat saat waktunya tiba', () => {
		expect(shareAccess({ ...share, expires_at: 5_000 }, [file()], 5_000)).toBe('expired');
	});

	it('hanya membuka share yang siap, hidup, dan masih bersisa', () => {
		expect(shareAccess(share, [file()], 5_000)).toBe('ok');
		expect(shareAccess({ ...share, status: 'deleted' }, [], 5_000)).toBe('missing');
		expect(shareAccess(null, [], 5_000)).toBe('missing');
	});

	it('menandai link yang dinonaktifkan manual, bahkan sebelum cek kata sandi', () => {
		const takenDown = {
			...share,
			status: 'deleted' as const,
			password_hash: 'pbkdf2$...',
			takedown_at: 4_000,
		};
		expect(shareAccess(takenDown, [file()], 5_000)).toBe('taken-down');
		expect(shareAccess(takenDown, [file()], 5_000, true)).toBe('taken-down');
	});
});

describe('rute GET /api/shares/:id', () => {
	it('sudah tidak ada, jadi tidak ada jalur yang membocorkan URL unduh', () => {
		expect(existsSync(resolve(process.cwd(), 'src/pages/api/shares/[id]/index.ts'))).toBe(false);
	});
});
