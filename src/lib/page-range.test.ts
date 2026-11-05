import { describe, expect, it } from 'vitest';
import { formatBytes, parsePageRange, reductionPercent } from './page-range';

describe('parsePageRange', () => {
	it('membaca rentang dan halaman tunggal', () => {
		expect(parsePageRange('1-3,5', 10)).toEqual({ ok: true, pages: [1, 2, 3, 5] });
	});

	it('membuang duplikat dan mengurutkan', () => {
		expect(parsePageRange('5, 2-3, 3', 10)).toEqual({ ok: true, pages: [2, 3, 5] });
	});

	it('menolak kosong', () => {
		expect(parsePageRange('  ', 10).ok).toBe(false);
	});

	it('menolak rentang terbalik', () => {
		const result = parsePageRange('5-2', 10);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.message).toContain('terbalik');
	});

	it('menolak halaman di atas jumlah halaman', () => {
		const result = parsePageRange('1-12', 10);
		expect(result).toEqual({ ok: false, message: 'PDF ini hanya punya 10 halaman.' });
	});

	it('menolak nol dan teks', () => {
		expect(parsePageRange('0', 3).ok).toBe(false);
		expect(parsePageRange('satu', 3).ok).toBe(false);
	});
});

describe('formatBytes', () => {
	it('memakai satuan yang sesuai', () => {
		expect(formatBytes(512)).toBe('512 B');
		expect(formatBytes(2048)).toBe('2 KB');
		expect(formatBytes(2.4 * 1024 * 1024)).toBe('2,4 MB');
	});
});

describe('reductionPercent', () => {
	it('menghitung persen pengurangan', () => {
		expect(reductionPercent(2_400_000, 900_000)).toBe(63);
	});

	it('bisa negatif saat hasil lebih besar', () => {
		expect(reductionPercent(100, 120)).toBe(-20);
	});
});
