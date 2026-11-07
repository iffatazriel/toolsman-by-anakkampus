import { describe, expect, it } from 'vitest';
import { categoryText, fill, localizedTool, normalizeLang, toolText, ui } from './i18n';

const slugs = [
	'draw',
	'diagram',
	'pdf',
	'pas-foto',
	'kirim-file',
	'generator',
	'utilitas',
	'qr',
	'kompres-gambar',
	'warna',
	'mock-data',
	'hash',
	'teks',
	'hapus-exif',
	'cron',
	'code-to-image',
	'json-schema',
];

describe('kamus i18n', () => {
	it('punya kunci yang sama untuk Indonesia dan Inggris', () => {
		expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.id).sort());
	});

	it('mengisi placeholder dan kembali ke Indonesia untuk kunci yang hilang', () => {
		expect(fill('{n} alat, {name}', { n: 17, name: 'PDF' })).toBe('17 alat, PDF');
		expect(fill('{x}', {})).toBe('{x}');
		expect(normalizeLang('en')).toBe('en');
		expect(normalizeLang('fr')).toBe('id');
		expect(normalizeLang(null)).toBe('id');
	});

	it('menerjemahkan semua kategori', () => {
		for (const category of ['gambar', 'diagram', 'dokumen', 'foto', 'berbagi', 'generator', 'utilitas'] as const) {
			expect(categoryText.id[category]).toBeTruthy();
			expect(categoryText.en[category]).toBeTruthy();
		}
	});
});

describe('metadata alat', () => {
	it('punya nama, tagline, dan langkah untuk setiap alat di kedua bahasa', () => {
		expect(Object.keys(toolText).sort()).toEqual([...slugs].sort());
		for (const slug of slugs) {
			const id = toolText[slug]?.id;
			const en = toolText[slug]?.en;
			expect(id, slug).toBeTruthy();
			expect(en, slug).toBeTruthy();
			expect(id?.name.length, slug).toBeGreaterThan(0);
			expect(en?.name.length, slug).toBeGreaterThan(0);
			expect(id?.tagline.length, slug).toBeGreaterThan(0);
			expect(en?.tagline.length, slug).toBeGreaterThan(0);
			expect(id?.usage.length, slug).toBeGreaterThan(0);
			expect(en?.usage.length, slug).toBeGreaterThan(0);
		}
	});

	it('mengembalikan teks Inggris untuk slug yang dikenal', () => {
		expect(localizedTool('pdf', 'en')?.name).toBe('PDF Tools');
		expect(localizedTool('pdf', 'id')?.name).toBe('Alat PDF');
		expect(localizedTool('tidak-ada', 'en')).toBeNull();
	});
});
