import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	collectPlaceholders,
	promptCuplikan,
	validatePrompt,
	validatePromptSources,
} from './prompt-schema';

const VALID = `id: contoh-prompt
judul: Contoh prompt yang valid
kategori: belajar
tag: [ringkasan, catatan]
ai: [umum]
bahasa: id
level: pemula
variabel:
  - nama: topik
    label: Topik
    tipe: pendek
    contoh: Aljabar
prompt: |
  Jelaskan {{topik}} dengan contoh sederhana.
catatan: |
  Catatan singkat.
penulis: Tim Toolsman
lisensi: CC0-1.0
dibuat: "2026-11-09"
`;

const FILE = 'contoh-prompt.yaml';

function check(source = VALID, file = FILE) {
	return validatePrompt(source, file);
}

function messages(source: string, file = FILE): string[] {
	return check(source, file).errors.map((error) => error.message);
}

describe('validasi prompt', () => {
	it('menerima berkas yang lengkap', () => {
		const result = check();
		expect(result.errors).toEqual([]);
		expect(result.prompt).toMatchObject({
			id: 'contoh-prompt',
			judul: 'Contoh prompt yang valid',
			kategori: 'belajar',
			lisensi: 'CC0-1.0',
		});
		expect(result.prompt?.variabel[0]).toMatchObject({ nama: 'topik', tipe: 'pendek' });
	});

	it('menolak id yang tidak sama dengan nama berkas dan menunjuk barisnya', () => {
		const result = check(VALID.replace('id: contoh-prompt', 'id: nama-lain'));
		expect(result.errors[0]?.message).toContain('harus sama dengan nama berkas');
		expect(result.errors[0]?.line).toBe(1);
	});

	it('menolak kategori dan tag di luar daftar izin', () => {
		const source = VALID.replace('kategori: belajar', 'kategori: hiburan').replace(
			'tag: [ringkasan, catatan]',
			'tag: [ringkasan, tag-asing]',
		);
		const result = check(source);
		expect(result.errors.map((error) => error.message).join(' ')).toContain('kategori');
		expect(result.errors.map((error) => error.message).join(' ')).toContain('tag-asing');
		expect(result.errors.every((error) => error.line > 0)).toBe(true);
	});

	it('menolak placeholder yang tidak dideklarasikan', () => {
		const source = VALID.replace('{{topik}}', '{{topik}} dan {{lain}}');
		expect(messages(source).join(' ')).toContain('{{lain}}');
	});

	it('menolak variabel yang tidak dipakai di prompt', () => {
		const source = VALID.replace(
			'  - nama: topik\n    label: Topik\n    tipe: pendek\n    contoh: Aljabar',
			'  - nama: topik\n    label: Topik\n    tipe: pendek\n    contoh: Aljabar\n  - nama: siapa\n    label: Siapa\n    tipe: pendek\n    contoh: Saya',
		);
		expect(messages(source).join(' ')).toContain('"siapa"');
	});

	it('menolak placeholder dengan huruf besar', () => {
		expect(messages(VALID.replace('{{topik}}', '{{Topik}}')).join(' ')).toContain(
			'placeholder tidak valid',
		);
	});

	it('menolak lisensi di luar CC0 dan CC-BY', () => {
		expect(messages(VALID.replace('lisensi: CC0-1.0', 'lisensi: MIT')).join(' ')).toContain(
			'CC0-1.0',
		);
	});

	it.each([
		['tautan', 'Lihat https://contoh.test halaman ini.'],
		['email', 'Hubungi saya di nama@contoh.test.'],
		['nomor telepon', 'Hubungi 081234567890.'],
		['jailbreak', 'Pakai mode jailbreak untuk ini.'],
		['penghindaran plagiarisme', 'Tulis ulang agar lolos Turnitin.'],
	])('menolak konten terlarang: %s', (_label, prompt) => {
		const source = VALID.replace(
			'  Jelaskan {{topik}} dengan contoh sederhana.',
			`  ${prompt} {{topik}}`,
		);
		const result = check(source);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it('menolak pilihan tanpa daftar opsi', () => {
		const source = VALID.replace('    tipe: pendek', '    tipe: pilihan');
		expect(messages(source).join(' ')).toContain('pilihan');
	});

	it('menolak judul yang terlalu panjang', () => {
		const source = VALID.replace('judul: Contoh prompt yang valid', `judul: ${'a'.repeat(120)}`);
		expect(messages(source).join(' ')).toContain('maksimal 90');
	});

	it('menolak key yang tidak dikenal dan key yang hilang', () => {
		const source = `${VALID}warna: biru\n`.replace('penulis: Tim Toolsman\n', '');
		const text = messages(source).join(' ');
		expect(text).toContain('"warna" tidak dikenal');
		expect(text).toContain('"penulis" wajib diisi');
	});

	it('menolak YAML rusak tanpa melempar', () => {
		const result = check('id: [\n  rusak');
		expect(result.prompt).toBeNull();
		expect(result.errors[0]?.message).toContain('YAML tidak valid');
	});

	it('menolak id ganda di dua berkas', () => {
		const { errors } = validatePromptSources([
			{ file: FILE, source: VALID },
			{ file: 'dua-prompt.yaml', source: VALID.replace('id: contoh-prompt', 'id: dua-prompt') },
		]);
		// id kedua sama dengan nama berkasnya, jadi yang bentrok adalah id pertama.
		expect(errors).toEqual([]);
		const duplicate = validatePromptSources([
			{ file: FILE, source: VALID },
			{ file: 'contoh-prompt.yaml', source: VALID },
		]);
		expect(duplicate.errors.map((error) => error.message).join(' ')).toContain('sudah dipakai');
	});

	it('mengurutkan hasil menurut kategori', () => {
		const other = VALID.replace('id: contoh-prompt', 'id: lain')
			.replace('kategori: belajar', 'kategori: karier')
			.replace('judul: Contoh prompt yang valid', 'judul: Prompt karier');
		const { prompts, errors } = validatePromptSources([
			{ file: 'lain.yaml', source: other },
			{ file: FILE, source: VALID },
		]);
		expect(errors).toEqual([]);
		expect(prompts.map((prompt) => prompt.kategori)).toEqual(['belajar', 'karier']);
	});
});

describe('placeholder dan cuplikan', () => {
	it('mengumpulkan placeholder dan menandai yang rusak', () => {
		const result = collectPlaceholders('a {{satu}} b {{dua}} c {{Tiga}} d {{}}');
		expect(result.names).toEqual(['satu', 'dua']);
		expect(result.malformed).toHaveLength(2);
	});

	it('mengganti placeholder dengan label variabel di cuplikan', () => {
		const prompt = check().prompt;
		if (!prompt) throw new Error('prompt valid tidak terbentuk');
		expect(promptCuplikan(prompt)).toBe('Jelaskan [Topik] dengan contoh sederhana.');
	});

	it('memotong cuplikan di batas kata', () => {
		const prompt = {
			...check().prompt!,
			prompt: 'kata '.repeat(80),
		};
		const result = promptCuplikan(prompt, 40);
		expect(result.length).toBeLessThanOrEqual(41);
		expect(result.endsWith('…')).toBe(true);
	});
});

describe('isi content/prompts', () => {
	const root = fileURLToPath(new URL('../../content/prompts/', import.meta.url));

	function walk(directory: string): string[] {
		const files: string[] = [];
		for (const entry of readdirSync(directory, { withFileTypes: true })) {
			const full = join(directory, entry.name);
			if (entry.isDirectory()) files.push(...walk(full));
			else if (/\.ya?ml$/i.test(entry.name)) files.push(full);
		}
		return files;
	}

	it('berisi 30 prompt dan semuanya lolos validasi', () => {
		const files = walk(root);
		const sources = files.map((path) => ({
			file: relative(root, path).replace(/\\/g, '/'),
			source: readFileSync(path, 'utf8'),
		}));
		const { errors, prompts } = validatePromptSources(sources);
		expect(errors).toEqual([]);
		expect(prompts).toHaveLength(30);
		expect(new Set(prompts.map((prompt) => prompt.kategori)).size).toBe(6);
	});
});
