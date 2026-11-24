import type { IconName } from './icons';

export type ToolCategory =
	| 'gambar'
	| 'kuliah'
	| 'developer'
	| 'teks'
	| 'utilitas';

export type ToolStatus = 'rencana' | 'siap';
export type PrivacyMode = 'lokal' | 'server';
export type ToolBadge = 'baru' | 'beta';

export interface ToolMeta {
	slug: string;
	name: string;
	category: ToolCategory;
	tagline: string;
	badge?: ToolBadge;
	keywords: string[];
	privacy: PrivacyMode;
	status: ToolStatus;
	icon: IconName;
	plans?: string[];
	usage?: string[];
	privacyDetail?: string;
	faq?: { q: string; a: string }[];
}

export const categories: { id: ToolCategory; label: string; icon: IconName }[] = [
	{ id: 'gambar', label: 'Gambar & Foto', icon: 'image' },
	{ id: 'kuliah', label: 'Kuliah & Dokumen', icon: 'file-text' },
	{ id: 'developer', label: 'Developer', icon: 'code' },
	{ id: 'teks', label: 'Teks & AI', icon: 'sparkles' },
	{ id: 'utilitas', label: 'Utilitas & Berbagi', icon: 'link' },
];

const legacyCategories: Record<string, ToolCategory> = {
	diagram: 'kuliah', dokumen: 'kuliah', foto: 'gambar',
	berbagi: 'utilitas', generator: 'teks', ai: 'teks',
};

export function normalizeCategory(value: string | null): ToolCategory | 'semua' {
	if (categories.some(category => category.id === value)) return value as ToolCategory;
	return value && Object.hasOwn(legacyCategories, value) ? legacyCategories[value] : 'semua';
}

export const privacyLabel: Record<PrivacyMode, string> = {
	lokal: 'Di perangkatmu',
	server: 'Pakai server',
};

export const badgeLabel: Record<ToolBadge, string> = {
	baru: 'Baru',
	beta: 'Beta',
};

export const privacyNote: Record<PrivacyMode, string> = {
	lokal: 'File diproses di browser, tidak diunggah ke server.',
	server:
		'File diunggah ke penyimpanan sementara, lalu dihapus otomatis saat link kedaluwarsa.',
};

export const statusLabel: Record<ToolStatus, string> = {
	rencana: 'Belum jadi',
	siap: 'Siap dipakai',
};

export function categoryLabel(category: ToolCategory): string {
	return categories.find((item) => item.id === category)?.label ?? category;
}
