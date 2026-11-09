import { describe, expect, it } from 'vitest';
import { assemblePrompt, missingVariables, promptMarkdown, promptSegments } from './assemble';

const TEMPLATE = 'Jelaskan {{topik}} untuk {{pembaca}}.\n\n{{catatan}}';

describe('assemblePrompt', () => {
	it('mengisi semua placeholder dengan nilai', () => {
		expect(
			assemblePrompt(TEMPLATE, { topik: 'rekursi', pembaca: 'mahasiswa', catatan: 'Singkat.' }),
		).toBe('Jelaskan rekursi untuk mahasiswa.\n\nSingkat.');
	});

	it('menandai variabel kosong sebagai [nama]', () => {
		expect(assemblePrompt(TEMPLATE, { topik: 'rekursi', pembaca: '', catatan: '   ' })).toBe(
			'Jelaskan rekursi untuk [pembaca].\n\n[catatan]',
		);
	});

	it('membiarkan teks lain apa adanya dan mengisi placeholder berulang', () => {
		expect(assemblePrompt('{{a}} dan {{a}}', { a: 'x' })).toBe('x dan x');
	});
});

describe('missingVariables', () => {
	it('mengembalikan nama yang kosong tanpa duplikat, urut kemunculan', () => {
		expect(missingVariables(TEMPLATE, { topik: '', pembaca: 'x', catatan: '' })).toEqual([
			'topik',
			'catatan',
		]);
		expect(missingVariables('{{a}} {{b}} {{a}}', {})).toEqual(['a', 'b']);
	});

	it('menganggap spasi saja sebagai kosong', () => {
		expect(missingVariables('{{a}}', { a: '  \n ' })).toEqual(['a']);
	});
});

describe('promptSegments', () => {
	it('memecah teks dan menandai variabel yang terisi', () => {
		expect(promptSegments('Halo {{nama}}!', { nama: 'Rani' })).toEqual([
			{ text: 'Halo ', variable: null, filled: true },
			{ text: 'Rani', variable: 'nama', filled: true },
			{ text: '!', variable: null, filled: true },
		]);
	});

	it('menandai variabel kosong dengan teks [nama]', () => {
		expect(promptSegments('Halo {{nama}}!', {})).toEqual([
			{ text: 'Halo ', variable: null, filled: true },
			{ text: '[nama]', variable: 'nama', filled: false },
			{ text: '!', variable: null, filled: true },
		]);
	});

	it('tidak kehilangan teks saat placeholder ada di awal atau akhir', () => {
		const segments = promptSegments('{{a}} tengah {{b}}', { a: '1', b: '2' });
		expect(segments.map((segment) => segment.text).join('')).toBe('1 tengah 2');
	});
});

describe('promptMarkdown', () => {
	it('menyusun judul, prompt, catatan, dan atribusi', () => {
		const markdown = promptMarkdown(
			{ judul: 'Contoh', catatan: 'Pakai untuk belajar.', lisensi: 'CC0-1.0', penulis: 'Tim' },
			'Isi prompt.',
		);
		expect(markdown).toBe(
			'# Contoh\n\nIsi prompt.\n\n---\n\nPakai untuk belajar.\n\nLisensi: CC0-1.0 · Tim · Toolsman\n',
		);
	});

	it('melewati bagian catatan kalau kosong', () => {
		const markdown = promptMarkdown(
			{ judul: 'Contoh', catatan: '  ', lisensi: 'CC-BY-4.0', penulis: 'Tim' },
			'Isi.',
		);
		expect(markdown).not.toContain('---');
		expect(markdown).toContain('Lisensi: CC-BY-4.0');
	});
});
