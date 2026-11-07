import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'warna',
	name: 'Warna & Kontras',
	category: 'utilitas',
	tagline:
		'Cek kontras teks terhadap latar sesuai WCAG AA/AAA, lalu buat palet turunan dari satu warna dasar. Semua dihitung di browser.',
	keywords: [
		'warna',
		'kontras',
		'wcag',
		'aksesibilitas',
		'color picker',
		'palet',
		'hex',
		'desain',
	],
	privacy: 'lokal',
	status: 'siap',
	icon: 'palette',
	usage: [
		'Pilih warna teks dan latar lewat pemilih warna atau tulis HEX langsung.',
		'Lihat rasio kontras dan status AA/AAA untuk teks biasa dan teks besar.',
		'Klik warna pada palet turunan untuk menyalin HEX-nya.',
	],
	privacyDetail:
		'Semua perhitungan warna berjalan di tab ini. Tidak ada data yang dikirim ke server.',
};
