import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'pas-foto',
	name: 'Pas Foto',
	category: 'foto',
	tagline:
		'Ganti latar pas foto jadi merah, biru, atau putih, atur ukuran 2×3 sampai 4×6, lalu unduh.',
	keywords: [
		'pas foto',
		'foto',
		'background',
		'latar',
		'hapus latar',
		'merah',
		'biru',
		'3x4',
		'2x3',
		'4x6',
		'wisuda',
		'lamaran',
	],
	privacy: 'lokal',
	status: 'siap',
	icon: 'user-round',
	usage: [
		'Pilih foto wajah. Model penghapus latar diunduh sekali, setelah itu tersimpan di browser.',
		'Pilih warna latar dan ukuran cetak. Atur zoom kalau posisi wajah perlu digeser.',
		'Unduh PNG 300 DPI atau JPG, lalu cek ukuran cetaknya sebelum dicetak.',
	],
	privacyDetail:
		'Foto diproses di browser dan tidak diunggah ke server. Yang diambil dari internet hanya model penghapus latar dari CDN imgly saat pertama dipakai.',
};
