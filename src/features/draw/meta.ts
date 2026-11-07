import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'draw',
	name: 'Kanvas Gambar',
	category: 'gambar',
	tagline:
		'Gambar bebas, tulis catatan, dan susun sketsa di kanvas. Hasilnya bisa disalin ke clipboard atau diekspor jadi PNG dan SVG.',
	keywords: [
		'draw',
		'menggambar',
		'gambar',
		'sketsa',
		'coretan',
		'tulis',
		'kanvas',
		'papan tulis',
	],
	privacy: 'lokal',
	status: 'siap',
	icon: 'pencil',
	plans: [],
	usage: [
		'Gambar di kanvas seperti biasa. Perubahan tersimpan otomatis di browser ini.',
		'Ubah nama berkas di atas kanvas, lalu pakai tombol unduh untuk PNG, SVG, atau .excalidraw.',
		'Tombol Salin gambar menyalin PNG ke clipboard, siap ditempel ke dokumen atau chat.',
		'Kanvas memakai tema yang sama dengan situs dan ikut berubah saat tema diganti.',
	],
	privacyDetail:
		'Gambar disimpan di penyimpanan browser ini saja. Tidak dikirim ke server.',
};
