import { describe, expect, it } from 'vitest';
import { highlightSegments, runRegex } from './regex';

describe('runRegex', () => {
	it('menemukan semua kecocokan dengan flag i', () => {
		const result = runRegex('budi', 'i', 'Budi dan budi');
		expect(result.matches.map((match) => match.text)).toEqual(['Budi', 'budi']);
		expect(result.matches[0]?.index).toBe(0);
	});

	it('mengembalikan grup tangkapan', () => {
		const result = runRegex('(\\w+)@(\\w+)\\.com', '', 'kirim ke budi@contoh.com');
		expect(result.matches[0]?.groups).toEqual(['budi', 'contoh']);
	});

	it('aman untuk pola yang cocok kosong', () => {
		const result = runRegex('(?=a)', '', 'aaa');
		expect(result.matches).toHaveLength(3);
		expect(result.matches.every((match) => match.length === 0)).toBe(true);
	});

	it('membatasi jumlah hasil', () => {
		const result = runRegex('a', '', 'aaaaa', 2);
		expect(result.matches).toHaveLength(2);
		expect(result.truncated).toBe(true);
	});

	it('mengembalikan kosong untuk pola kosong', () => {
		expect(runRegex('', '', 'apa saja')).toEqual({ matches: [], truncated: false });
	});

	it('melempar error untuk pola tidak valid', () => {
		expect(() => runRegex('(', '', 'teks')).toThrow();
	});
});

describe('highlightSegments', () => {
	it('memecah teks di sekitar kecocokan', () => {
		const matches = runRegex('budi', '', 'hai budi!').matches;
		expect(highlightSegments('hai budi!', matches)).toEqual([
			{ text: 'hai ', match: false },
			{ text: 'budi', match: true },
			{ text: '!', match: false },
		]);
	});

	it('mengembalikan satu segmen kalau tidak ada kecocokan', () => {
		expect(highlightSegments('teks', [])).toEqual([{ text: 'teks', match: false }]);
	});
});
