import { describe, expect, it } from 'vitest';
import {
	EXPIRY_OPTIONS,
	expiresAt,
	isBlockedName,
	isExpired,
	isExpiryId,
	randomToken,
	sanitizeFileName,
	validateFile,
	validatePassword,
} from './share-rules';

describe('masa berlaku', () => {
	it('hanya menerima 1h, 24h, dan 7d', () => {
		expect(isExpiryId('1h')).toBe(true);
		expect(isExpiryId('24h')).toBe(true);
		expect(isExpiryId('7d')).toBe(true);
		expect(isExpiryId('30d')).toBe(false);
	});

	it('menghitung waktu kedaluwarsa dalam ms', () => {
		expect(expiresAt(0, '1h')).toBe(3_600_000);
		expect(expiresAt(0, '7d')).toBe(EXPIRY_OPTIONS['7d'].seconds * 1000);
	});

	it('dianggap kedaluwarsa tepat saat waktunya tiba', () => {
		expect(isExpired(1000, 999)).toBe(false);
		expect(isExpired(1000, 1000)).toBe(true);
	});
});

describe('token acak', () => {
	it('panjang 32 karakter hex untuk 128 bit', () => {
		expect(randomToken(16)).toMatch(/^[0-9a-f]{32}$/);
	});

	it('tidak berulang di sampel kecil', () => {
		const set = new Set(Array.from({ length: 200 }, () => randomToken()));
		expect(set.size).toBe(200);
	});
});

describe('validasi berkas', () => {
	it('menolak tipe berbahaya', () => {
		expect(isBlockedName('setup.EXE')).toBe(true);
		expect(isBlockedName('catatan.pdf')).toBe(false);
		expect(validateFile({ name: 'a.bat', size: 10 })).toContain('tidak diizinkan');
	});

	it('menolak berkas lebih dari 100 MB dan berkas kosong', () => {
		expect(validateFile({ name: 'a.pdf', size: 101 * 1024 * 1024 })).toContain('100 MB');
		expect(validateFile({ name: 'a.pdf', size: 0 })).toContain('kosong');
	});

	it('menerima berkas biasa', () => {
		expect(validateFile({ name: 'laporan.pdf', size: 5_000 })).toBeNull();
	});
});

describe('kata sandi link', () => {
	it('menerima kata sandi dalam batas panjang', () => {
		expect(validatePassword('abcd')).toBeNull();
		expect(validatePassword('kata sandi yang panjang')).toBeNull();
	});

	it('menolak kata sandi terlalu pendek', () => {
		expect(validatePassword('abc')).toContain('minimal 4');
	});

	it('menolak kata sandi lebih dari 64 karakter', () => {
		expect(validatePassword('a'.repeat(65))).toContain('maksimal 64');
	});
});

describe('sanitizeFileName', () => {
	it('membuang jalur direktori', () => {
		expect(sanitizeFileName('..\\..\\rahasia.txt')).toBe('rahasia.txt');
	});

	it('mengganti karakter aneh dan titik di depan', () => {
		expect(sanitizeFileName('.../laporan#1.pdf')).toBe('laporan_1.pdf');
	});

	it('memberi nama bawaan kalau kosong', () => {
		expect(sanitizeFileName('   ')).toBe('berkas');
	});
});
