import { describe, expect, it } from 'vitest';
import { canMinify, extensions, formatCode, type FormatOptions } from './formatter';

const defaults: FormatOptions = { language: 'sql', dialect: 'sql', indent: '2', keywordCase: 'upper' };
const format = (source: string, options: Partial<FormatOptions> = {}, minify = false) =>
	formatCode(source, { ...defaults, ...options }, minify);

describe('format kode', () => {
	it('mengabaikan input kosong untuk semua bahasa', async () => {
		for (const language of Object.keys(extensions) as FormatOptions['language'][]) {
			expect(await format(' \n\t', { language })).toBe('');
		}
	});
	it('membatasi input besar', async () => {
		await expect(format('x'.repeat(500_001))).rejects.toThrow('500.000');
	});
	it('merapikan JSON dengan indentasi dan minify tanpa mengubah isi', async () => {
		const source = '{"nama":"kamu","items":[1,true,null],"teks":"a  b"}';
		for (const indent of ['2', '4', 'tab'] as const) {
			const result = await format(source, { language: 'json', indent });
			expect(result).toContain(`\n${indent === 'tab' ? '\t' : ' '.repeat(Number(indent))}"nama"`);
			expect(JSON.parse(result)).toEqual(JSON.parse(source));
		}
		expect(await format(source, { language: 'json' }, true)).toBe(source);
		expect(await format('null', { language: 'json' })).toBe('null');
	});
	it('menjelaskan JSON yang rusak', async () => {
		await expect(format('{oops', { language: 'json' })).rejects.toThrow('Periksa sintaks');
	});
	it('mengatur case SQL tanpa mengubah literal dan komentar', async () => {
		const result = await format("select nama from users where nama = 'select  x'; -- catatan");
		expect(result).toContain('SELECT');
		expect(result).toContain("'select  x'");
		expect(result).toContain('-- catatan');
		expect(await format('SELECT id FROM users', { keywordCase: 'lower' })).toContain('select');
		expect(await format('select id FROM users', { keywordCase: 'preserve' })).toContain('select');
	});
	it('mendukung dialek dan indentasi SQL', async () => {
		for (const dialect of ['sql', 'mysql', 'postgresql', 'sqlite'] as const) {
			expect(await format('select id from users;', { dialect })).toContain('SELECT');
		}
		expect(await format('select `id` from `users`', { dialect: 'mysql' })).toContain('`id`');
		expect(await format('select id::text from users', { dialect: 'postgresql' })).toContain('::');
		expect(await format('select id from users', { indent: '4' })).toContain('\n    id');
		expect(await format('select id from users', { indent: 'tab' })).toContain('\n\tid');
	});
	it('melaporkan SQL yang tidak dapat ditokenisasi', async () => {
		await expect(format("select 'tidak selesai")).rejects.toThrow('Periksa sintaks');
	});
	it('merapikan JavaScript dan TypeScript dengan plugin', async () => {
		expect(await format('const x={a:1}', { language: 'javascript' })).toBe('const x = { a: 1 };\n');
		expect(await format('const x:number=1', { language: 'typescript' })).toBe('const x: number = 1;\n');
		await expect(format('const =', { language: 'javascript' })).rejects.toThrow('Periksa sintaks');
		await expect(format('const x: =', { language: 'typescript' })).rejects.toThrow('Periksa sintaks');
	});
	it('merapikan HTML dan CSS, memperkecil CSS dengan aman', async () => {
		expect(await format('<div  class="contoh"><p>Halo</p></div>', { language: 'html' })).toBe('<div class="contoh"><p>Halo</p></div>\n');
		expect(await format('a{color:red}', { language: 'css', indent: '4' })).toContain('    color: red;');
		expect(await format('a { color: red; }', { language: 'css' }, true)).toBe('a{color:red}');
		expect(await format('a::after { content: "a  b"; }', { language: 'css' }, true)).toContain('a  b');
		await expect(format('a { color:', { language: 'css' })).rejects.toThrow('Periksa sintaks');
		await expect(format('<div></span>', { language: 'html' })).rejects.toThrow('Periksa sintaks');
	});
	it('membatasi minify ke JSON dan CSS', async () => {
		expect(canMinify('json')).toBe(true);
		expect(canMinify('css')).toBe(true);
		for (const language of ['sql', 'javascript', 'typescript', 'html'] as const) {
			expect(canMinify(language)).toBe(false);
			await expect(format('x', { language }, true)).rejects.toThrow('Minify tersedia');
		}
	});
});
