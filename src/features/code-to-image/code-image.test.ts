import { describe, expect, it } from 'vitest';
import {
	clampPadding,
	clampRadius,
	codeFileName,
	groupRunsByLine,
	parseHighlightHtml,
	themePalette,
	tokenColor,
} from './code-image';

describe('parseHighlightHtml', () => {
	it('membaca span highlight dan teks biasa', () => {
		const runs = parseHighlightHtml(
			'<span class="hljs-keyword">const</span> x = <span class="hljs-number">1</span>;',
		);
		expect(runs).toEqual([
			{ text: 'const', className: 'hljs-keyword' },
			{ text: ' x = ', className: null },
			{ text: '1', className: 'hljs-number' },
			{ text: ';', className: null },
		]);
	});

	it('mendekode entitas HTML', () => {
		const runs = parseHighlightHtml('a &lt; b &amp;&amp; c &quot;x&quot; &#39;y&#39;');
		expect(runs.map((run) => run.text).join('')).toBe('a < b && c "x" \'y\'');
	});

	it('menggabungkan teks di dalam span bersarang', () => {
		const runs = parseHighlightHtml(
			'<span class="hljs-title"><span class="hljs-keyword">if</span>(x)</span>',
		);
		expect(runs).toEqual([
			{ text: 'if', className: 'hljs-keyword' },
			{ text: '(x)', className: 'hljs-title' },
		]);
	});
});

describe('groupRunsByLine', () => {
	it('memecah run menjadi baris', () => {
		const lines = groupRunsByLine([
			{ text: 'satu\ndua', className: 'hljs-string' },
			{ text: '\ntiga', className: null },
		]);
		expect(lines.map((line) => line.map((run) => run.text))).toEqual([
			['satu'],
			['dua'],
			['tiga'],
		]);
	});
});

describe('tema', () => {
	it('memberi warna token yang berbeda untuk terang dan gelap', () => {
		expect(tokenColor('hljs-keyword', 'light')).not.toBe(tokenColor('hljs-keyword', 'dark'));
		expect(tokenColor(null, 'light')).toBe(themePalette('light').foreground);
	});

	it('memakai warna teks dasar untuk kelas yang tidak dikenal', () => {
		expect(tokenColor('hljs-unknown', 'dark')).toBe(themePalette('dark').foreground);
	});
});

describe('batas dan nama berkas', () => {
	it('membatasi padding dan radius', () => {
		expect(clampPadding(4)).toBe(16);
		expect(clampPadding(200)).toBe(64);
		expect(clampRadius(-2)).toBe(0);
		expect(clampRadius(90)).toBe(28);
	});

	it('membuat nama berkas dari bahasa', () => {
		expect(codeFileName('typescript')).toBe('kode-typescript.png');
		expect(codeFileName('C++')).toBe('kode-c-.png');
	});
});
