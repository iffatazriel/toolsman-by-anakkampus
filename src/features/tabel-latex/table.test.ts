import { describe, expect, it } from 'vitest';
import { defaultOptions, escapeLatex, latexToTable, markdownCells, parseTable, resolveColumns, toLatex, toMarkdown } from './table';

describe('parser tabel', () => {
	it('mendeteksi Markdown dan perataan separator', () => {
		const table = parseTable('| Nama | Tengah | Nilai |\n| :--- | :---: | ---: |\n| Kamu | Ya | 90 |');
		expect(table.headers).toEqual(['Nama', 'Tengah', 'Nilai']); expect(table.alignments).toEqual(['l', 'c', 'r']); expect(table.rows).toEqual([['Kamu', 'Ya', '90']]);
	});
	it('mendukung tanpa pipe luar, escape pipe, dan code span', () => {
		expect(markdownCells('a \\| b | `c|d` | ``e`|f``')).toEqual(['a | b', '`c|d`', '``e`|f``']);
		expect(parseTable('a | b\n--- | ---:\nx | y').alignments).toEqual(['l', 'r']);
		expect(markdownCells('| a | b \\|')).toEqual(['a', 'b |']);
	});
	it('mendeteksi CSV dan mempertahankan koma serta kutip di dalam sel', () => {
		expect(parseTable('Nama,Catatan\r\n"Kamu, saya","Kata ""halo"""')).toEqual({ headers: ['Nama', 'Catatan'], rows: [['Kamu, saya', 'Kata "halo"']], alignments: ['l', 'l'] });
	});
	it('mendukung CSV multiline, nilai kosong, dan BOM', () => {
		const table = parseTable('\uFEFFNama,Catatan\nKamu,"baris 1\nbaris 2"\nSaya,');
		expect(table.rows).toEqual([['Kamu', 'baris 1\nbaris 2'], ['Saya', '']]);
	});
	it('mendeteksi TSV dari spreadsheet termasuk kutip delimiter', () => {
		expect(parseTable('Nama\tCatatan\nKamu\t"a\tb"').rows).toEqual([['Kamu', 'a\tb']]);
		expect(parseTable('Nama\tSKS\nA\t3', 'tsv').headers).toEqual(['Nama', 'SKS']);
	});
	it('mengisi sel pendek dengan kosong dan menerima tabel hanya header', () => {
		expect(parseTable('A,B,C\nx,y').rows).toEqual([['x', 'y', '']]);
		expect(parseTable('A,B').rows).toEqual([]);
		expect(parseTable('| A |\n| --- |', 'markdown').rows).toEqual([]);
	});
	it('menolak data kosong dan tabel yang melebihi batas', () => {
		for (const input of ['', ' ', '\n']) expect(() => parseTable(input)).toThrow('Tempel');
		expect(() => parseTable('a'.repeat(200001))).toThrow('200.000');
		expect(() => parseTable(Array(101).fill('a').join(','))).toThrow('100 kolom');
		expect(() => parseTable(Array(2002).fill('a').join('\n'))).toThrow('2.000 baris');
		expect(() => parseTable(Array(102).fill(Array(100).fill('a').join(',')).join('\n'))).toThrow('10.000 sel');
	});
	it('menolak Markdown tidak lengkap dan kolom berlebih', () => {
		expect(() => parseTable('| A |', 'markdown')).toThrow('pemisah');
		expect(() => parseTable('| A | B |\n| --- | oops |', 'markdown')).toThrow('Baris kedua');
		expect(() => parseTable('A,B\nx,y,z')).toThrow('melebihi 2');
		expect(() => parseTable('| A |\n| --- |\n| x | y |', 'markdown')).toThrow('melebihi 1');
	});
	it('menolak CSV dengan kutip tidak tertutup atau teks setelah kutip', () => {
		for (const input of ['A,B\nx,"oops', 'A\n"x"oops', 'A\nx"oops']) expect(() => parseTable(input, 'csv')).toThrow(/[Kk]utip/);
	});
});

describe('LaTeX', () => {
	it('meng-escape semua karakter spesial tanpa double escape', () => {
		expect(escapeLatex('&%$#_{}~^\\')).toBe('\\&\\%\\$\\#\\_\\{\\}\\textasciitilde{}\\textasciicircum{}\\textbackslash{}');
		expect(escapeLatex('a\nb')).toBe('a b');
	});
	it('membuat tabular booktabs dan header tebal dengan perataan', () => {
		const latex = toLatex(parseTable('A | B\n--- | ---:\nx | 2'));
		expect(latex).toContain('\\begin{tabular}{lr}'); expect(latex).toContain('\\toprule'); expect(latex).toContain('\\textbf{A} & \\textbf{B} \\\\'); expect(latex).toContain('\\midrule'); expect(latex).toContain('x & 2 \\\\'); expect(latex).toContain('\\bottomrule');
	});
	it('mendukung hline dan menonaktifkan header tebal', () => {
		const latex = toLatex(parseTable('A,B\nx,y'), { ...defaultOptions, booktabs: false, boldHeader: false });
		expect(latex).toContain('\\hline'); expect(latex).not.toContain('booktabs'); expect(latex).not.toContain('textbf');
	});
	it('membungkus table dengan caption escaped dan label', () => {
		const latex = toLatex(parseTable('A,B'), { ...defaultOptions, wrap: true, caption: 'Hasil 50% & data', label: 'tab:hasil_1' });
		expect(latex).toContain('\\begin{table}[htbp]'); expect(latex).toContain('\\caption{Hasil 50\\% \\& data}'); expect(latex).toContain('\\label{tab:hasil_1}'); expect(latex).toContain('\\end{table}');
	});
	it('menolak label injeksi dan label tanpa caption', () => {
		expect(() => toLatex(parseTable('A'), { ...defaultOptions, wrap: true, caption: 'ok', label: '}\\input{secret}' })).toThrow('Label');
		expect(() => toLatex(parseTable('A'), { ...defaultOptions, wrap: true, label: 'tab:a' })).toThrow('caption');
	});
	it('mendukung override kolom dengan lebar aman dan menghitung jumlahnya', () => {
		expect(resolveColumns('| c | p{3cm} |', ['l', 'l'])).toEqual({ spec: '|c|p{3cm}|', alignments: ['c', 'l'] });
		expect(resolveColumns('p{0.4\\textwidth}m{2cm}b{\\linewidth}', ['l', 'l', 'l']).alignments).toEqual(['l', 'l', 'l']);
		expect(toLatex(parseTable('A'), { ...defaultOptions, columns: 'm{2cm}' })).toContain('usepackage{array}');
	});
	it('menolak override kolom tidak cocok atau berbahaya', () => {
		for (const spec of ['ll', '\\input{x}', 'p{0cm}', 'p{.0cm}', 'p{-1cm}', 'p{var}', 'x']) expect(() => resolveColumns(spec, ['l'])).toThrow();
		expect(() => toLatex({ headers: [], rows: [], alignments: [] })).toThrow('kolom');
	});
	it('hanya header tetap menghasilkan tabular valid tanpa midrule', () => {
		const latex = toLatex(parseTable('A,B'));
		expect(latex).toContain('\\bottomrule'); expect(latex).not.toContain('\\midrule');
	});
	it('mempertahankan HTML sebagai teks dan meng-escape macro dari sel', () => {
		const latex = toLatex(parseTable('Header\n<script>alert(1)</script>\n\\input{secret}'));
		expect(latex).toContain('<script>alert(1)</script>'); expect(latex).toContain('\\textbackslash{}input\\{secret\\}');
	});
});

describe('reverse tabular sederhana', () => {
	it('round-trip booktabs, hline, perataan, serta semua karakter escaped', () => {
		const table = parseTable('Nama,Isi\nKamu,&%$#_{}~^\\');
		for (const booktabs of [true, false]) expect(latexToTable(toLatex(table, { ...defaultOptions, booktabs }))).toEqual(table);
	});
	it('mendukung table wrapper, caption, dan kolom p', () => {
		const latex = toLatex(parseTable('A,B\nx,y'), { ...defaultOptions, wrap: true, caption: 'Data', label: 'tab:data', columns: '|l|p{3cm}|' });
		expect(latexToTable(latex).rows).toEqual([['x', 'y']]);
	});
	it('mengabaikan komentar tetapi mempertahankan persen escaped dan ampersand', () => {
		const latex = String.raw`\begin{tabular}{lr}
\hline
A & B \\ % header
x\&y & 50\% \\
\hline
\end{tabular}`;
		expect(latexToTable(latex)).toEqual({ headers: ['A', 'B'], rows: [['x&y', '50%']], alignments: ['l', 'r'] });
	});
	it('mengambil teks dari formatting bersarang', () => {
		expect(latexToTable(String.raw`\begin{tabular}{l}\textbf{A} \\ \emph{a \textit{b}} \\ \end{tabular}`).rows).toEqual([['a b']]);
	});
	it('membuat Markdown yang bisa dibaca kembali dengan pipe dan backslash', () => {
		const table = parseTable('Nama,Isi\nKamu,a|b\\c_*[]');
		expect(parseTable(toMarkdown(table), 'markdown')).toEqual(table);
	});
	it('menangani sel kosong satu kolom tanpa menghilangkan baris', () => {
		const table = { headers: ['A'], rows: [['']], alignments: ['l' as const] };
		expect(latexToTable(toLatex(table))).toEqual(table);
	});
	it('menolak kosong, end hilang, macro kompleks, dan tabel berganda', () => {
		for (const latex of ['', 'hello', String.raw`\begin{tabular}{l} A \\`, String.raw`\begin{tabular}{l}\multicolumn{2}{c}{A} \\ \end{tabular}`, String.raw`\begin{tabular}{l}$x$ \\ \end{tabular}`, String.raw`\begin{tabular}{l}{A \\ \end{tabular}`]) expect(() => latexToTable(latex)).toThrow();
		const latex = String.raw`\begin{tabular}{l}A \\ \end{tabular}`;
		expect(() => latexToTable(latex + latex)).toThrow('tepat satu');
	});
});
