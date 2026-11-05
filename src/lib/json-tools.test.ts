import { describe, expect, it } from 'vitest';
import {
	formatJson,
	highlightJson,
	lineColumnAt,
	minifyJson,
	parseJson,
	renderJsonTree,
} from './json-tools';

describe('parseJson', () => {
	it('membaca objek bersarang', () => {
		const result = parseJson('{"a":[1,true,null,"x"],"b":{"c":2.5}}');
		expect(result).toEqual({
			ok: true,
			data: { a: [1, true, null, 'x'], b: { c: 2.5 } },
		});
	});

	it('membaca escape dan unicode', () => {
		const result = parseJson('"baris\\n\\u00e9"');
		expect(result).toEqual({ ok: true, data: 'baris\né' });
	});

	it('menolak dokumen kosong', () => {
		const result = parseJson('   \n ');
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe('Dokumen masih kosong.');
			expect(result.error.line).toBe(2);
		}
	});

	it('menunjuk baris dan kolom koma berlebih', () => {
		const result = parseJson('{\n  "a": 1,\n}');
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe('Koma berlebih sebelum }.');
			expect(result.error.line).toBe(3);
			expect(result.error.column).toBe(1);
		}
	});

	it('menunjuk koma berlebih di array', () => {
		const result = parseJson('[1,]');
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe('Koma berlebih sebelum ].');
			expect(result.error.column).toBe(4);
		}
	});

	it('menolak string tanpa penutup', () => {
		const result = parseJson('{"kunci": "nilai}');
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe('Tanda kutip penutup belum ada.');
		}
	});

	it('menolak angka dengan nol di depan', () => {
		const result = parseJson('{"a": 01}');
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe('Koma atau } dibutuhkan, bukan "1".');
		}
	});

	it('menolak teks setelah nilai', () => {
		const result = parseJson('{} {}');
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe('Karakter "{" tidak terduga setelah nilai.');
			expect(result.error.column).toBe(4);
		}
	});

	it('menolak properti tanpa tanda kutip', () => {
		const result = parseJson('{a: 1}');
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe('Nama properti harus diapit tanda kutip.');
			expect(result.error.column).toBe(2);
		}
	});
});

describe('lineColumnAt', () => {
	it('menghitung kolom satu-based', () => {
		expect(lineColumnAt('abc\ndef', 0)).toEqual({ line: 1, column: 1 });
		expect(lineColumnAt('abc\ndef', 5)).toEqual({ line: 2, column: 2 });
		expect(lineColumnAt('abc\ndef', 99)).toEqual({ line: 2, column: 4 });
	});
});

describe('formatJson dan minifyJson', () => {
	it('merapikan dengan indentasi dua spasi', () => {
		const result = formatJson('{"a":1,"b":[2,3]}');
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.text).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
		}
	});

	it('memadatkan tanpa spasi', () => {
		const result = minifyJson('{\n  "a": 1,\n  "b": [2, 3]\n}');
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.text).toBe('{"a":1,"b":[2,3]}');
		}
	});

	it('meneruskan error tanpa mengubah teks', () => {
		const result = formatJson('{"a":}');
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.line).toBe(1);
			expect(result.error.column).toBe(6);
		}
	});
});

describe('highlightJson', () => {
	it('membedakan kunci, string, angka, dan literal', () => {
		const html = highlightJson('{"a": 1, "b": "x<y", "c": true, "d": null}');
		expect(html).toContain('<span class="tok-key">&quot;a&quot;</span>');
		expect(html).toContain('<span class="tok-string">&quot;x&lt;y&quot;</span>');
		expect(html).toContain('<span class="tok-number">1</span>');
		expect(html).toContain('<span class="tok-literal">true</span>');
		expect(html).toContain('<span class="tok-literal">null</span>');
	});

	it('meng-escape tag di dalam string', () => {
		const html = highlightJson('{"x": "<script>alert(1)</script>"}');
		expect(html).not.toContain('<script>');
		expect(html).toContain('&lt;script&gt;');
	});
});

describe('renderJsonTree', () => {
	const data = { a: [1, 'x<'], b: {}, c: null, 'k"unci': true };

	it('membuat details yang bisa dilipat', () => {
		const html = renderJsonTree(data);
		expect(html.startsWith('<ul class="json-tree">')).toBe(true);
		expect(html).toContain('<details open>');
		expect((html.match(/<details open>/g) ?? []).length).toBe(1);
	});

	it('menampilkan jumlah item dan properti', () => {
		const html = renderJsonTree(data);
		expect(html).toContain('2 item');
		expect(html).toContain('4 properti');
	});

	it('meng-escape kunci dan string', () => {
		const html = renderJsonTree(data);
		expect(html).toContain('"k&quot;unci"');
		expect(html).toContain('"x&lt;"');
	});

	it('menulis objek kosong tanpa details', () => {
		const html = renderJsonTree({ kosong: {}, daftar: [] });
		expect(html).toContain('<span class="tok-punct">{}</span>');
		expect(html).toContain('<span class="tok-punct">[]</span>');
	});

	it('membuka node sesuai openDepth', () => {
		const html = renderJsonTree({ a: { b: { c: 1 } } }, { openDepth: 2 });
		expect((html.match(/<details open>/g) ?? []).length).toBe(2);
	});
});
