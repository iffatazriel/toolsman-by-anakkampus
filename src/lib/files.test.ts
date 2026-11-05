import { describe, expect, it } from 'vitest';
import { markdownFilename, slugify } from './files';

describe('slugify', () => {
	it('mengubah spasi dan tanda baca jadi tanda hubung', () => {
		expect(slugify('Halo, Dunia!')).toBe('halo-dunia');
	});

	it('membuang aksen', () => {
		expect(slugify('Rangkuman Ékspor')).toBe('rangkuman-ekspor');
	});

	it('memangkas tanda hubung di ujung', () => {
		expect(slugify('  ---Catatan---  ')).toBe('catatan');
	});
});

describe('markdownFilename', () => {
	it('memakai judul pertama', () => {
		expect(markdownFilename('# Catatan Rapat\n\nIsi.')).toBe('catatan-rapat.md');
	});

	it('jatuh ke nama bawaan tanpa judul', () => {
		expect(markdownFilename('tanpa judul')).toBe('catatan.md');
	});

	it('jatuh ke nama bawaan saat judul kosong', () => {
		expect(markdownFilename('#')).toBe('catatan.md');
	});
});
