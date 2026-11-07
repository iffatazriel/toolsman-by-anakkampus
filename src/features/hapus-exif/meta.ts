import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'hapus-exif',
	name: 'Hapus Metadata Foto',
	category: 'foto',
	tagline:
		'Buang EXIF, GPS, XMP, dan komentar dari JPG atau PNG sebelum fotonya dibagikan. Data gambar tidak dikompres ulang.',
	keywords: [
		'hapus exif',
		'metadata foto',
		'gps foto',
		'privasi foto',
		'strip exif',
		'jpg',
		'png',
	],
	privacy: 'lokal',
	status: 'siap',
	icon: 'shield',
	usage: [
		'Pilih JPG atau PNG. Foto asli tidak diunggah ke mana pun.',
		'Metadata yang ditemukan dibuang, lalu ukuran sebelum dan sesudah ditampilkan.',
		'Unduh hasilnya. Data piksel tidak diubah atau dikompres ulang.',
	],
	privacyDetail:
		'Semua proses berjalan di tab ini. Tidak ada foto atau metadata yang dikirim ke server.',
};
