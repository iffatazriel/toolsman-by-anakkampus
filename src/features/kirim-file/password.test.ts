import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('kata sandi link', () => {
	it('menerima kata sandi yang benar', async () => {
		const stored = await hashPassword('rahasia123');
		await expect(verifyPassword('rahasia123', stored)).resolves.toBe(true);
	});

	it('menolak kata sandi yang salah', async () => {
		const stored = await hashPassword('rahasia123');
		await expect(verifyPassword('rahasia124', stored)).resolves.toBe(false);
	});

	it('menyimpan format yang memuat iterasi dan salt', async () => {
		const stored = await hashPassword('apa saja');
		expect(stored).toMatch(/^pbkdf2\$100000\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
	});

	it('memberi hasil berbeda untuk kata sandi sama (salt acak)', async () => {
		const a = await hashPassword('sama');
		const b = await hashPassword('sama');
		expect(a).not.toBe(b);
	});

	it('menolak data tersimpan yang rusak', async () => {
		await expect(verifyPassword('x', 'bukan-format')).resolves.toBe(false);
		await expect(verifyPassword('x', 'pbkdf2$abc$zz$zz')).resolves.toBe(false);
	});
});
