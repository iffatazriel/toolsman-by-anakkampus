import type { IconName } from './icons';

export type ToolCategory =
	| 'gambar'
	| 'diagram'
	| 'dokumen'
	| 'foto'
	| 'berbagi'
	| 'generator';

export type ToolStatus = 'rencana' | 'siap';
export type PrivacyMode = 'lokal' | 'server';

export interface ToolMeta {
	slug: string;
	name: string;
	category: ToolCategory;
	tagline: string;
	keywords: string[];
	privacy: PrivacyMode;
	status: ToolStatus;
	icon: IconName;
	plans?: string[];
	usage?: string[];
	privacyDetail?: string;
}

export const categories: { id: ToolCategory; label: string }[] = [
	{ id: 'gambar', label: 'Gambar' },
	{ id: 'diagram', label: 'Diagram' },
	{ id: 'dokumen', label: 'Dokumen' },
	{ id: 'foto', label: 'Foto' },
	{ id: 'berbagi', label: 'Berbagi' },
	{ id: 'generator', label: 'Generator' },
];

export const privacyLabel: Record<PrivacyMode, string> = {
	lokal: 'Di perangkatmu',
	server: 'Pakai server',
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
