import { describe, expect, it, vi } from 'vitest';
import { allowPasswordAttempt } from './rate-limit';

describe('allowPasswordAttempt', () => {
	it('memeriksa kuota per IP dan per link sekaligus', async () => {
		const limit = vi.fn(async (_options: { key: string }) => ({ success: true }));
		await expect(allowPasswordAttempt({ limit }, '1.2.3.4', 'abc')).resolves.toBe(true);
		expect(limit.mock.calls.map(([options]) => options.key)).toEqual(['ip:1.2.3.4', 'link:abc']);
	});

	it('menolak kalau kuota IP habis', async () => {
		const limit = vi.fn(async ({ key }: { key: string }) => ({ success: !key.startsWith('ip:') }));
		await expect(allowPasswordAttempt({ limit }, '1.2.3.4', 'abc')).resolves.toBe(false);
	});

	it('menolak kalau kuota link habis', async () => {
		const limit = vi.fn(async ({ key }: { key: string }) => ({ success: !key.startsWith('link:') }));
		await expect(allowPasswordAttempt({ limit }, '1.2.3.4', 'abc')).resolves.toBe(false);
	});

	it('mengizinkan semuanya kalau binding tidak tersedia (dev lokal)', async () => {
		await expect(allowPasswordAttempt(undefined, '1.2.3.4', 'abc')).resolves.toBe(true);
	});
});
