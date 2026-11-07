import { describe, expect, it } from 'vitest';
import {
	countText,
	loremIpsum,
	slugify,
	toCamelCase,
	toKebabCase,
	toSentenceCase,
	toSnakeCase,
	toTitleCase,
} from './text-tools';

describe('ubah huruf', () => {
	it('membuat title case', () => {
		expect(toTitleCase('halo dunia, apa kabar?')).toBe('Halo Dunia, Apa Kabar?');
	});

	it('membuat sentence case', () => {
		expect(toSentenceCase('HALO DUNIA. APA KABAR? baik.')).toBe('Halo dunia. Apa kabar? Baik.');
	});
});

describe('nama variabel', () => {
	it('membuat camelCase', () => {
		expect(toCamelCase('Nama Lengkap Pengguna')).toBe('namaLengkapPengguna');
		expect(toCamelCase('nama_lengkap-pengguna')).toBe('namaLengkapPengguna');
	});

	it('membuat snake_case dan kebab-case', () => {
		expect(toSnakeCase('Nama Lengkap Pengguna')).toBe('nama_lengkap_pengguna');
		expect(toKebabCase('Nama Lengkap Pengguna')).toBe('nama-lengkap-pengguna');
	});
});

describe('slugify', () => {
	it('membuat slug dari teks dengan aksen dan tanda baca', () => {
		expect(slugify('Café au lait! Enak?')).toBe('cafe-au-lait-enak');
	});

	it('membuang tanda hubung di ujung', () => {
		expect(slugify('  --Halo Dunia--  ')).toBe('halo-dunia');
	});
});

describe('countText', () => {
	it('menghitung karakter, kata, baris, dan kalimat', () => {
		expect(countText('Halo dunia.\nIni baris kedua!')).toEqual({
			chars: 28,
			charsNoSpaces: 24,
			words: 5,
			lines: 2,
			sentences: 2,
		});
	});

	it('mengembalikan nol untuk teks kosong', () => {
		expect(countText('')).toEqual({
			chars: 0,
			charsNoSpaces: 0,
			words: 0,
			lines: 0,
			sentences: 0,
		});
	});
});

describe('loremIpsum', () => {
	it('menghasilkan jumlah kalimat yang diminta', () => {
		expect(loremIpsum(3).split('.').filter((part) => part.trim() !== '')).toHaveLength(3);
	});

	it('mengembalikan teks kosong untuk nol', () => {
		expect(loremIpsum(0)).toBe('');
	});
});
