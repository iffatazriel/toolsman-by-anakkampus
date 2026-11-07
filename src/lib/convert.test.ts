import { describe, expect, it } from 'vitest';
import { csvToJson, jsonToCsv, jsonToYaml, yamlToJson } from './convert';

const people = `[
  { "nama": "Budi", "umur": 21, "lulus": true },
  { "nama": "Sari", "umur": 22, "lulus": false }
]`;

describe('JSON ke CSV', () => {
	it('membuat header dan baris dengan urutan konsisten', () => {
		const result = jsonToCsv(people);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.text).toBe(
			'nama,umur,lulus\nBudi,21,true\nSari,22,false\n',
		);
	});

	it('mengutip field yang ada koma atau tanda kutip', () => {
		const result = jsonToCsv('[{ "nama": "Budi, Sari", "catatan": "dia bilang \\"halo\\"" }]');
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.text).toContain('"Budi, Sari"');
		expect(result.text).toContain('"dia bilang ""halo"""');
	});

	it('menolak JSON yang bukan array', () => {
		expect(jsonToCsv('{ "a": 1 }').ok).toBe(false);
	});

	it('mengembalikan teks kosong untuk array kosong', () => {
		expect(jsonToCsv('[]')).toEqual({ ok: true, text: '' });
	});
});

describe('CSV ke JSON', () => {
	it('membaca header dan baris menjadi objek', () => {
		const result = csvToJson('nama,umur\nBudi,21\nSari,22');
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(JSON.parse(result.text)).toEqual([
			{ nama: 'Budi', umur: '21' },
			{ nama: 'Sari', umur: '22' },
		]);
	});

	it('menangani kutipan dan koma di dalam field', () => {
		const result = csvToJson('nama,catatan\n"Budi, Sari","dia bilang ""halo"""');
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const parsed = JSON.parse(result.text) as Array<{ nama: string; catatan: string }>;
		expect(parsed[0]?.nama).toBe('Budi, Sari');
		expect(parsed[0]?.catatan).toBe('dia bilang "halo"');
	});

	it('mengembalikan array kosong untuk input kosong', () => {
		const result = csvToJson('');
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.text).toBe('[]');
	});
});

describe('JSON ke YAML dan sebaliknya', () => {
	it('bolak-balik objek', () => {
		const yaml = jsonToYaml(people);
		expect(yaml.ok).toBe(true);
		if (!yaml.ok) return;
		const back = yamlToJson(yaml.text);
		expect(back.ok).toBe(true);
		if (!back.ok) return;
		expect(JSON.parse(back.text)).toEqual(JSON.parse(people));
	});

	it('menolak JSON tidak valid', () => {
		expect(jsonToYaml('{bukan json').ok).toBe(false);
	});

	it('menolak YAML tidak valid', () => {
		expect(yamlToJson('  : : :').ok).toBe(false);
	});

	it('mengubah YAML kosong menjadi null', () => {
		const result = yamlToJson('');
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.text).toBe('null');
	});
});
