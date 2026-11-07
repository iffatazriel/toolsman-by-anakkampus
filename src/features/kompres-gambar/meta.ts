import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'kompres-gambar',
	name: 'Kompres Gambar',
	category: 'gambar',
	tagline:
		'Perkecil ukuran foto, atur dimensi, dan ubah ke JPG, PNG, atau WebP. Gambar diproses di browser, tidak diunggah.',
	keywords: [
		'kompres gambar',
		'kecilkan foto',
		'resize gambar',
		'konversi gambar',
		'webp',
		'jpg',
		'png',
		'optimasi gambar',
	],
	privacy: 'lokal',
	status: 'siap',
	icon: 'image',
	usage: [
		'Pilih JPG, PNG, atau WebP. Pratinjau dan ukuran aslinya muncul langsung.',
		'Atur format hasil, kualitas, dan batas dimensi. Hasilnya diperbarui otomatis.',
		'Unduh hasil setelah ukuran dan dimensinya cocok.',
	],
	privacyDetail:
		'Gambar dibaca dan dikompres di tab ini. Tidak ada berkas yang dikirim ke server.',
};
