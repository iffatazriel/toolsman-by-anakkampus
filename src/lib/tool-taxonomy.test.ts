import { expect, it } from 'vitest';
import { categories, normalizeCategory, type ToolMeta } from './tool-types';
import { categoryText } from './i18n';
import { toolJsonLd } from './tool-seo';

const metadata = import.meta.glob<{ meta: ToolMeta }>('../features/*/meta.ts', { eager: true });
const expected = {
	gambar: ['draw', 'code-to-image', 'kompres-gambar', 'hapus-exif', 'pas-foto'],
	kuliah: ['pdf', 'diagram', 'tabel-latex', 'sitasi', 'kalkulator-ipk'],
	developer: ['format-kode', 'curl-ke-kode', 'json-schema', 'mock-data', 'cron', 'hash', 'bilangan-subnet'],
	teks: ['teks', 'generator', 'prompt'],
	utilitas: ['kirim-file', 'qr', 'warna', 'utilitas'],
};

it('assigns every tool exactly once to the five bilingual categories', () => {
	expect(categories.map(category => category.id)).toEqual(Object.keys(expected));
	for (const category of categories) {
		const tools = Object.values(metadata).map(module => module.meta).filter(tool => tool.category === category.id);
		expect(tools.map(tool => tool.slug).sort()).toEqual([...expected[category.id]].sort());
		expect(category.icon).toBeTruthy();
		expect(categoryText.id[category.id]).toBe(category.label);
		expect(categoryText.en[category.id]).toBeTruthy();
		for (const tool of tools) expect(toolJsonLd(tool).applicationCategory).toBe({ gambar: 'DesignApplication', kuliah: 'EducationalApplication', developer: 'DeveloperApplication', teks: 'BusinessApplication', utilitas: 'UtilitiesApplication' }[category.id]);
	}
});

it('maps legacy URL/storage filters while retaining current ids', () => {
	for (const category of categories) expect(normalizeCategory(category.id)).toBe(category.id);
	for (const [old, current] of Object.entries({ diagram: 'kuliah', dokumen: 'kuliah', foto: 'gambar', berbagi: 'utilitas', generator: 'teks', ai: 'teks' })) expect(normalizeCategory(old)).toBe(current);
	for (const value of [null, '', 'semua', 'unknown', '__proto__', 'constructor']) expect(normalizeCategory(value)).toBe('semua');
});
