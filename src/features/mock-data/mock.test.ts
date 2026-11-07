import { describe, expect, it } from 'vitest';
import {
	DEFAULT_MOCK_FIELDS,
	MAX_MOCK_ROWS,
	generateMockData,
	mockFields,
	mockToCsv,
	mockToJson,
} from './mock';

const options = { count: 5, fields: DEFAULT_MOCK_FIELDS, seed: 42 };

describe('generateMockData', () => {
	it('menghasilkan jumlah baris yang diminta', () => {
		expect(generateMockData(options)).toHaveLength(5);
	});

	it('deterministik untuk seed yang sama dan berbeda untuk seed lain', () => {
		expect(generateMockData(options)).toEqual(generateMockData(options));
		expect(generateMockData({ ...options, seed: 7 })).not.toEqual(generateMockData(options));
	});

	it('hanya mengisi field yang dipilih', () => {
		const rows = generateMockData({ count: 2, fields: ['nama', 'email'], seed: 1 });
		expect(Object.keys(rows[0]!)).toEqual(['nama', 'email']);
	});

	it('membuat ID dan email unik', () => {
		const rows = generateMockData({
			count: 20,
			fields: ['id', 'email'],
			seed: 3,
		});
		expect(new Set(rows.map((row) => row.id)).size).toBe(20);
		expect(new Set(rows.map((row) => row.email)).size).toBe(20);
	});

	it('membuat nomor telepon dan tanggal dengan format benar', () => {
		const rows = generateMockData({
			count: 3,
			fields: ['telepon', 'tanggal'],
			seed: 9,
		});
		for (const row of rows) {
			expect(row.telepon).toMatch(/^08\d{10}$/);
			expect(row.tanggal).toMatch(/^202[4-6]-\d{2}-\d{2}$/);
		}
	});

	it('membatasi jumlah baris ke 1 sampai 200', () => {
		expect(generateMockData({ ...options, count: 0 })).toHaveLength(1);
		expect(generateMockData({ ...options, count: 999 })).toHaveLength(MAX_MOCK_ROWS);
	});

	it('mengembalikan objek kosong kalau tidak ada field dipilih', () => {
		expect(generateMockData({ count: 2, fields: [], seed: 1 })).toEqual([{}, {}]);
	});

	it('menyediakan label untuk semua field', () => {
		expect(mockFields.map((field) => field.id)).toContain('aktif');
		expect(mockFields.every((field) => field.label.length > 0)).toBe(true);
	});
});

describe('keluaran', () => {
	it('membuat CSV dengan header dan escape', () => {
		const csv = mockToCsv([
			{ nama: 'Budi, Sari', email: 'budi@contoh.id' },
			{ nama: 'Dewi', email: 'dewi@contoh.id' },
		]);
		expect(csv.startsWith('nama,email\n')).toBe(true);
		expect(csv).toContain('"Budi, Sari"');
		expect(csv.endsWith('\n')).toBe(true);
	});

	it('membuat JSON yang bisa dibaca ulang', () => {
		const rows = generateMockData(options);
		expect(JSON.parse(mockToJson(rows))).toEqual(rows);
	});
});
