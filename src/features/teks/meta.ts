import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'teks',
	name: 'Toolkit Teks',
	category: 'utilitas',
	tagline:
		'Ubah huruf besar-kecil, buat slug dan nama variabel, hasilkan lorem ipsum, serta hitung kata dan karakter.',
	keywords: [
		'case converter',
		'ubah huruf',
		'slug',
		'camelcase',
		'snake case',
		'lorem ipsum',
		'hitung kata',
		'utilitas teks',
	],
	privacy: 'lokal',
	status: 'siap',
	icon: 'file-text',
	usage: [
		'Tempel teks di kiri. Statistik karakter, kata, baris, dan kalimat langsung diperbarui.',
		'Pilih salah satu tombol ubah untuk mengisi hasil di kanan.',
		'Gunakan Isi lorem untuk menaruh teks contoh sekaligus mengisi hasil, lalu salin atau unduh.',
	],
	privacyDetail:
		'Semua olahan teks berjalan di tab ini. Teks tidak dikirim ke server.',
};
