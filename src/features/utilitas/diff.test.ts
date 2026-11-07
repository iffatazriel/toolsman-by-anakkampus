import { describe, expect, it } from 'vitest';
import { MAX_DIFF_LINES, diffLines } from './diff';

describe('diffLines', () => {
	it('menandai semua baris sama kalau teks identik', () => {
		const result = diffLines('satu\ndua', 'satu\ndua');
		expect(result.added).toBe(0);
		expect(result.removed).toBe(0);
		expect(result.rows.every((row) => row.kind === 'same')).toBe(true);
	});

	it('mendeteksi baris yang diubah', () => {
		const result = diffLines('satu\ndua\ntiga', 'satu\nDUA\ntiga');
		expect(result.removed).toBe(1);
		expect(result.added).toBe(1);
		expect(result.rows.find((row) => row.kind === 'removed')?.text).toBe('dua');
		expect(result.rows.find((row) => row.kind === 'added')?.text).toBe('DUA');
	});

	it('mendeteksi baris tambahan tanpa menghapus yang lain', () => {
		const result = diffLines('a\nb', 'a\nbaru\nb');
		expect(result.added).toBe(1);
		expect(result.removed).toBe(0);
		expect(result.rows.map((row) => row.kind)).toEqual(['same', 'added', 'same']);
	});

	it('memberi nomor baris lama dan baru', () => {
		const result = diffLines('lama', 'baru');
		const removed = result.rows.find((row) => row.kind === 'removed');
		const added = result.rows.find((row) => row.kind === 'added');
		expect(removed?.oldLine).toBe(1);
		expect(removed?.newLine).toBeNull();
		expect(added?.newLine).toBe(1);
		expect(added?.oldLine).toBeNull();
	});

	it('menolak input yang terlalu panjang', () => {
		const big = Array.from({ length: MAX_DIFF_LINES + 1 }, () => 'baris').join('\n');
		const result = diffLines(big, big);
		expect(result.truncated).toBe(true);
		expect(result.rows).toEqual([]);
	});
});
