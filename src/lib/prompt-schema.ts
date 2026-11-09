import { isMap, isSeq, parseDocument, type Node, type YAMLMap } from 'yaml';
import {
	promptAiIds,
	promptCategoryIds,
	promptLanguages,
	promptLevelIds,
	promptLicenses,
	promptLimits,
	promptTags,
	promptVariableTypes,
	type PromptLanguage,
	type PromptLevel,
	type PromptVariableType,
} from './prompt-taxonomy.ts';

export interface PromptVariable {
	nama: string;
	label: string;
	tipe: PromptVariableType;
	contoh: string;
	pilihan?: string[];
}

export interface PromptEntry {
	id: string;
	judul: string;
	kategori: string;
	tag: string[];
	ai: string[];
	bahasa: PromptLanguage;
	level: PromptLevel;
	variabel: PromptVariable[];
	prompt: string;
	catatan: string;
	penulis: string;
	lisensi: string;
	dibuat: string;
}

export interface PromptIndexItem {
	id: string;
	judul: string;
	kategori: string;
	tag: string[];
	ai: string[];
	level: PromptLevel;
	cuplikan: string;
}

export interface ValidationError {
	file: string;
	line: number;
	message: string;
}

export interface ValidationResult {
	errors: ValidationError[];
	prompt: PromptEntry | null;
	idLine: number;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VAR_NAME = /^[a-z][a-z0-9_]*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const REQUIRED_KEYS = [
	'id',
	'judul',
	'kategori',
	'tag',
	'ai',
	'bahasa',
	'level',
	'variabel',
	'prompt',
	'catatan',
	'penulis',
	'lisensi',
	'dibuat',
] as const;

const FORBIDDEN: { pattern: RegExp; message: string }[] = [
	{ pattern: /https?:\/\//i, message: 'tautan http tidak diizinkan di dalam prompt.' },
	{ pattern: /\bwww\.[a-z0-9-]+\.[a-z]{2,}/i, message: 'alamat situs tidak diizinkan di dalam prompt.' },
	{
		pattern: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
		message: 'alamat email tidak diizinkan di dalam prompt.',
	},
	{
		pattern: /(?:\+62|62|0)8[0-9][0-9\s-]{6,}/,
		message: 'nomor telepon tidak diizinkan di dalam prompt.',
	},
	{ pattern: /\b\d{10,}\b/, message: 'deretan angka panjang mirip nomor telepon tidak diizinkan.' },
	{ pattern: /\bjailbreak\b/i, message: 'kata kunci jailbreak tidak diizinkan.' },
	{ pattern: /do anything now/i, message: 'pola jailbreak "do anything now" tidak diizinkan.' },
	{
		pattern: /ignore (all )?(the )?(previous|prior) instructions/i,
		message: 'instruksi untuk mengabaikan aturan tidak diizinkan.',
	},
	{
		pattern: /abaikan (semua )?(instruksi|aturan|perintah)/i,
		message: 'instruksi untuk mengabaikan aturan tidak diizinkan.',
	},
	{ pattern: /tanpa (filter|batasan|aturan)/i, message: 'permintaan tanpa filter tidak diizinkan.' },
	{ pattern: /mode pengembang/i, message: 'pola "mode pengembang" tidak diizinkan.' },
	{ pattern: /lolos turnitin/i, message: 'penghindaran pemeriksaan plagiarisme tidak diizinkan.' },
	{ pattern: /bypass turnitin/i, message: 'penghindaran pemeriksaan plagiarisme tidak diizinkan.' },
	{ pattern: /menghindari deteksi/i, message: 'penghindaran deteksi tidak diizinkan.' },
	{ pattern: /agar tidak terdeteksi/i, message: 'penghindaran deteksi tidak diizinkan.' },
	{ pattern: /undetectable/i, message: 'penghindaran deteksi tidak diizinkan.' },
	{ pattern: /ghostwriter/i, message: 'penulisan oleh orang lain tidak diizinkan.' },
];

function lineAt(source: string, offset: number): number {
	let line = 1;
	const end = Math.min(Math.max(offset, 0), source.length);
	for (let index = 0; index < end; index += 1) {
		if (source.charCodeAt(index) === 10) line += 1;
	}
	return line;
}

function offsetOf(node: Node | null | undefined, fallback = 0): number {
	return node?.range?.[0] ?? fallback;
}

function isPlainString(value: unknown): value is string {
	return typeof value === 'string';
}

function validDate(value: string): boolean {
	if (!DATE.test(value)) return false;
	const date = new Date(`${value}T00:00:00Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function collectPlaceholders(source: string): { names: string[]; malformed: number[] } {
	const names: string[] = [];
	const malformed: number[] = [];
	let index = source.indexOf('{{');
	while (index !== -1) {
		const close = source.indexOf('}}', index + 2);
		if (close === -1) {
			malformed.push(index);
			break;
		}
		const raw = source.slice(index + 2, close).trim();
		if (VAR_NAME.test(raw)) names.push(raw);
		else malformed.push(index);
		index = source.indexOf('{{', close + 2);
	}
	return { names, malformed };
}

/** Ringkasan satu baris untuk kartu di indeks. Placeholder diganti labelnya. */
export function promptCuplikan(prompt: PromptEntry, max = 150): string {
	const withLabels = prompt.prompt.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/g, (whole, name: string) => {
		const variable = prompt.variabel.find((item) => item.nama === name);
		return variable ? `[${variable.label}]` : whole;
	});
	const text = withLabels.replace(/\s+/g, ' ').trim();
	if (text.length <= max) return text;
	const cut = text.slice(0, max);
	const space = cut.lastIndexOf(' ');
	return `${(space > 40 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/**
 * Memeriksa satu berkas YAML. Baris pada pesan error dihitung dari posisi
 * node di sumber aslinya, jadi pesannya bisa langsung ditindaklanjuti.
 */
export function validatePrompt(source: string, file: string): ValidationResult {
	const errors: ValidationError[] = [];
	const doc = parseDocument(source, { prettyErrors: false });
	const push = (message: string, offset = 0): void => {
		errors.push({ file, line: lineAt(source, offset), message });
	};

	if (doc.errors.length > 0) {
		for (const error of doc.errors) {
			const line = error.linePos?.[0]?.line ?? 1;
			errors.push({ file, line, message: `YAML tidak valid: ${error.message.split('\n')[0]}` });
		}
		return { errors, prompt: null, idLine: 1 };
	}

	const root = doc.contents;
	if (!isMap(root)) {
		push('Isi berkas harus berupa objek YAML (key: value).', offsetOf(root));
		return { errors, prompt: null, idLine: 1 };
	}

	const map = root as YAMLMap;
	const value = doc.toJS() as Record<string, unknown>;
	const at = (key: string): number => offsetOf(map.get(key, true), offsetOf(map));
	const idLine = lineAt(source, at('id'));

	for (const key of Object.keys(value)) {
		if (!(REQUIRED_KEYS as readonly string[]).includes(key)) {
			push(`key "${key}" tidak dikenal. Hanya: ${REQUIRED_KEYS.join(', ')}.`, at(key));
		}
	}
	for (const key of REQUIRED_KEYS) {
		if (!(key in value)) push(`key "${key}" wajib diisi.`, at(key));
	}

	const expectString = (key: string, min: number, max: number): string | null => {
		if (!(key in value)) return null;
		const raw = value[key];
		if (!isPlainString(raw)) {
			push(`"${key}" harus teks.`, at(key));
			return null;
		}
		const text = raw.trim();
		if (text.length < min) {
			push(`"${key}" minimal ${min} karakter.`, at(key));
			return null;
		}
		if (text.length > max) {
			push(`"${key}" maksimal ${max} karakter (sekarang ${text.length}).`, at(key));
			return null;
		}
		return text;
	};

	const id = expectString('id', 3, 80);
	if (id) {
		if (!SLUG.test(id)) push('"id" hanya boleh huruf kecil, angka, dan tanda hubung.', at('id'));
		const expected = file.replace(/\\/g, '/').split('/').pop()?.replace(/\.ya?ml$/i, '');
		if (expected && id !== expected) {
			push(`"id" harus sama dengan nama berkas: "${expected}".`, at('id'));
		}
	}

	const judul = expectString('judul', 5, promptLimits.judul);
	const prompt = expectString('prompt', 20, promptLimits.prompt);
	const catatan = expectString('catatan', 0, promptLimits.catatan);
	const penulis = expectString('penulis', 2, 60);

	if ('kategori' in value) {
		const kategori = value.kategori;
		if (!isPlainString(kategori) || !promptCategoryIds.includes(kategori as never)) {
			push(`"kategori" harus salah satu: ${promptCategoryIds.join(', ')}.`, at('kategori'));
		}
	}

	if ('bahasa' in value) {
		const bahasa = value.bahasa;
		if (!isPlainString(bahasa) || !(promptLanguages as readonly string[]).includes(bahasa)) {
			push(`"bahasa" harus "id" atau "en".`, at('bahasa'));
		}
	}

	if ('level' in value) {
		const level = value.level;
		if (!isPlainString(level) || !promptLevelIds.includes(level as never)) {
			push(`"level" harus salah satu: ${promptLevelIds.join(', ')}.`, at('level'));
		}
	}

	if ('lisensi' in value) {
		const lisensi = value.lisensi;
		if (!isPlainString(lisensi) || !(promptLicenses as readonly string[]).includes(lisensi)) {
			push(`"lisensi" harus "CC0-1.0" atau "CC-BY-4.0".`, at('lisensi'));
		}
	}

	if ('dibuat' in value) {
		const dibuat = value.dibuat;
		if (!isPlainString(dibuat) || !validDate(dibuat)) {
			push('"dibuat" harus tanggal YYYY-MM-DD yang valid (pakai tanda kutip).', at('dibuat'));
		}
	}

	const list = (key: string, allowed: readonly string[], min: number, max: number): string[] => {
		if (!(key in value)) return [];
		const raw = value[key];
		if (!Array.isArray(raw) || raw.length === 0) {
			push(`"${key}" harus daftar berisi minimal ${min} item.`, at(key));
			return [];
		}
		if (raw.length < min || raw.length > max) {
			push(`"${key}" harus berisi ${min}-${max} item.`, at(key));
		}
		const result: string[] = [];
		for (const item of raw) {
			if (!isPlainString(item) || item.trim() === '') {
				push(`"${key}" hanya boleh berisi teks.`, at(key));
				continue;
			}
			const clean = item.trim();
			if (result.includes(clean)) {
				push(`"${key}" berisi duplikat "${clean}".`, at(key));
				continue;
			}
			if (!allowed.includes(clean)) {
				push(`"${key}" berisi "${clean}" yang tidak ada di daftar izin.`, at(key));
				continue;
			}
			result.push(clean);
		}
		return result;
	};

	const tag = list('tag', promptTags, 1, 6);
	const ai = list('ai', promptAiIds, 1, 5);

	const variabel: PromptVariable[] = [];
	if ('variabel' in value) {
		const seq = map.get('variabel', true);
		if (!isSeq(seq)) {
			push('"variabel" harus berupa daftar.', at('variabel'));
		} else {
			if (seq.items.length > 8) push('"variabel" maksimal 8 item.', at('variabel'));
			seq.items.forEach((item, index) => {
				const offset = offsetOf(item as Node, at('variabel'));
				const prefix = `variabel[${index}]`;
				if (!isMap(item)) {
					push(`${prefix} harus berupa objek.`, offset);
					return;
				}
				const itemMap = item as YAMLMap;
				const field = itemMap.toJSON() as Record<string, unknown>;
				const itemAt = (key: string): number => offsetOf(itemMap.get(key, true), offset);
				for (const key of Object.keys(field)) {
					if (!['nama', 'label', 'tipe', 'contoh', 'pilihan'].includes(key)) {
						push(`${prefix}.${key} tidak dikenal.`, itemAt(key));
					}
				}
				const nama = typeof field.nama === 'string' ? field.nama.trim() : '';
				const label = typeof field.label === 'string' ? field.label.trim() : '';
				const tipe = typeof field.tipe === 'string' ? field.tipe : '';
				const contoh = typeof field.contoh === 'string' ? field.contoh.trim() : '';

				if (!VAR_NAME.test(nama)) {
					push(`${prefix}.nama harus huruf kecil/angka/garis bawah, contoh "topik_utama".`, itemAt('nama'));
				} else if (variabel.some((entry) => entry.nama === nama)) {
					push(`${prefix}.nama "${nama}" dipakai lebih dari sekali.`, itemAt('nama'));
				}
				if (label.length < 2 || label.length > promptLimits.label) {
					push(`${prefix}.label harus 2-${promptLimits.label} karakter.`, itemAt('label'));
				}
				if (!(promptVariableTypes as readonly string[]).includes(tipe)) {
					push(`${prefix}.tipe harus "pendek", "panjang", atau "pilihan".`, itemAt('tipe'));
				}
				if (contoh.length === 0 || contoh.length > promptLimits.contoh) {
					push(`${prefix}.contoh harus 1-${promptLimits.contoh} karakter.`, itemAt('contoh'));
				}

				let pilihan: string[] | undefined;
				if (tipe === 'pilihan') {
					const raw = field.pilihan;
					if (!Array.isArray(raw) || raw.length < 2) {
						push(`${prefix}.pilihan wajib diisi minimal 2 pilihan untuk tipe "pilihan".`, itemAt('pilihan'));
					} else if (raw.length > 8) {
						push(`${prefix}.pilihan maksimal 8 item.`, itemAt('pilihan'));
					} else {
						pilihan = [];
						for (const option of raw) {
							if (!isPlainString(option) || option.trim() === '' || option.length > 40) {
								push(`${prefix}.pilihan harus teks 1-40 karakter.`, itemAt('pilihan'));
								continue;
							}
							if (pilihan.includes(option.trim())) {
								push(`${prefix}.pilihan berisi duplikat "${option.trim()}".`, itemAt('pilihan'));
								continue;
							}
							pilihan.push(option.trim());
						}
					}
				} else if (field.pilihan !== undefined) {
					push(`${prefix}.pilihan hanya untuk tipe "pilihan".`, itemAt('pilihan'));
				}

				variabel.push({
					nama,
					label,
					tipe: tipe as PromptVariableType,
					contoh,
					...(pilihan ? { pilihan } : {}),
				});
			});
		}
	}

	if (prompt) {
		const { names, malformed } = collectPlaceholders(prompt);
		for (const _offset of malformed) {
			push('placeholder tidak valid. Pakai {{nama_variabel}} dengan huruf kecil.', at('prompt'));
		}
		const declared = new Set(variabel.map((item) => item.nama));
		for (const name of new Set(names)) {
			if (!declared.has(name)) {
				push(`placeholder {{${name}}} tidak dideklarasikan di "variabel".`, at('prompt'));
			}
		}
		for (const variable of variabel) {
			if (!names.includes(variable.nama)) {
				push(`variabel "${variable.nama}" tidak dipakai di "prompt" ({{${variable.nama}}}).`, at('variabel'));
			}
		}
	}

	for (const key of ['judul', 'prompt', 'catatan'] as const) {
		const text = value[key];
		if (!isPlainString(text)) continue;
		for (const rule of FORBIDDEN) {
			if (rule.pattern.test(text)) push(rule.message, at(key));
		}
	}

	if (errors.length > 0 || !id || !judul || !prompt || !penulis) {
		return { errors, prompt: null, idLine };
	}

	return {
		errors,
		prompt: {
			id,
			judul,
			kategori: String(value.kategori),
			tag,
			ai,
			bahasa: value.bahasa as PromptLanguage,
			level: value.level as PromptLevel,
			variabel,
			prompt: prompt.trim(),
			catatan: catatan ?? '',
			penulis,
			lisensi: String(value.lisensi),
			dibuat: String(value.dibuat),
		},
		idLine,
	};
}

/** Memeriksa satu kumpulan berkas sekaligus, termasuk id yang bentrok. */
export function validatePromptSources(files: { file: string; source: string }[]): {
	errors: ValidationError[];
	prompts: PromptEntry[];
} {
	const errors: ValidationError[] = [];
	const prompts: PromptEntry[] = [];
	const seen = new Map<string, string>();

	for (const { file, source } of files) {
		const result = validatePrompt(source, file);
		errors.push(...result.errors);
		if (!result.prompt) continue;
		const previous = seen.get(result.prompt.id);
		if (previous) {
			errors.push({
				file,
				line: result.idLine,
				message: `id "${result.prompt.id}" sudah dipakai di ${previous}.`,
			});
			continue;
		}
		seen.set(result.prompt.id, file);
		prompts.push(result.prompt);
	}

	const order = new Map(promptCategoryIds.map((id, index) => [id, index]));
	prompts.sort((a, b) => {
		const byCategory = (order.get(a.kategori as never) ?? 99) - (order.get(b.kategori as never) ?? 99);
		return byCategory !== 0 ? byCategory : a.judul.localeCompare(b.judul, 'id');
	});

	return { errors, prompts };
}
