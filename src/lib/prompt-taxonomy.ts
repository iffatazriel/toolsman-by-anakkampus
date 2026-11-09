// Daftar nilai yang boleh dipakai berkas prompt di content/prompts/.
// Dipakai tiga tempat sekaligus: skrip `prompts:check`, halaman alat, dan
// validasi saat build. Menambah kategori atau tag berarti menambah di sini.

export const promptCategories = [
	{ id: 'belajar', label: 'Belajar', labelEn: 'Study' },
	{ id: 'laporan', label: 'Laporan', labelEn: 'Reports' },
	{ id: 'menulis', label: 'Menulis', labelEn: 'Writing' },
	{ id: 'kode', label: 'Kode', labelEn: 'Code' },
	{ id: 'riset', label: 'Riset', labelEn: 'Research' },
	{ id: 'karier', label: 'Karier', labelEn: 'Career' },
] as const;

export type PromptCategory = (typeof promptCategories)[number]['id'];

export const promptAi = [
	{ id: 'umum', label: 'Umum', labelEn: 'Any' },
	{ id: 'chatgpt', label: 'ChatGPT', labelEn: 'ChatGPT' },
	{ id: 'claude', label: 'Claude', labelEn: 'Claude' },
	{ id: 'gemini', label: 'Gemini', labelEn: 'Gemini' },
	{ id: 'copilot', label: 'Copilot', labelEn: 'Copilot' },
] as const;

export type PromptAi = (typeof promptAi)[number]['id'];

export const promptLevels = [
	{ id: 'pemula', label: 'Pemula', labelEn: 'Beginner' },
	{ id: 'menengah', label: 'Menengah', labelEn: 'Intermediate' },
	{ id: 'mahir', label: 'Mahir', labelEn: 'Advanced' },
] as const;

export type PromptLevel = (typeof promptLevels)[number]['id'];

export const promptLanguages = ['id', 'en'] as const;
export type PromptLanguage = (typeof promptLanguages)[number];

export const promptLicenses = ['CC0-1.0', 'CC-BY-4.0'] as const;
export type PromptLicense = (typeof promptLicenses)[number];

export const promptVariableTypes = ['pendek', 'panjang', 'pilihan'] as const;
export type PromptVariableType = (typeof promptVariableTypes)[number];

/** Tag harus berasal dari daftar ini supaya filter dan pencarian tetap rapi. */
export const promptTags = [
	'ringkasan',
	'catatan',
	'latihan',
	'kuis',
	'ujian',
	'penjelasan',
	'analogi',
	'jadwal-belajar',
	'laporan',
	'praktikum',
	'abstrak',
	'diskusi',
	'tinjauan-pustaka',
	'parafrase',
	'struktur',
	'esai',
	'argumentasi',
	'penyuntingan',
	'judul',
	'media-sosial',
	'email',
	'debugging',
	'refactor',
	'testing',
	'dokumentasi',
	'code-review',
	'sql',
	'regex',
	'javascript',
	'python',
	'riset',
	'rumusan-masalah',
	'wawancara',
	'data',
	'analisis',
	'proposal',
	'karier',
	'cv',
	'lamaran',
	'portofolio',
	'wawancara-kerja',
	'rencana',
	'presentasi',
	'produktivitas',
	'umpan-balik',
] as const;

export type PromptTag = (typeof promptTags)[number];

export const promptCategoryIds = promptCategories.map((item) => item.id);
export const promptAiIds = promptAi.map((item) => item.id);
export const promptLevelIds = promptLevels.map((item) => item.id);

/** Batas panjang yang dijaga skrip validasi. */
export const promptLimits = {
	judul: 90,
	prompt: 4000,
	catatan: 600,
	label: 60,
	contoh: 240,
} as const;

export function promptCategoryLabel(id: string, lang: 'id' | 'en' = 'id'): string {
	const item = promptCategories.find((entry) => entry.id === id);
	if (!item) return id;
	return lang === 'en' ? item.labelEn : item.label;
}

export function promptLevelLabel(id: string, lang: 'id' | 'en' = 'id'): string {
	const item = promptLevels.find((entry) => entry.id === id);
	if (!item) return id;
	return lang === 'en' ? item.labelEn : item.label;
}

export function promptAiLabel(id: string, lang: 'id' | 'en' = 'id'): string {
	const item = promptAi.find((entry) => entry.id === id);
	if (!item) return id;
	return lang === 'en' ? item.labelEn : item.label;
}
