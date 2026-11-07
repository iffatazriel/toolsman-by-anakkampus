import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'pdf',
	name: 'Alat PDF',
	category: 'dokumen',
	tagline:
		'Gabung, pisah, dan kompres PDF langsung di browser. File tidak dikirim ke server.',
	keywords: [
		'pdf',
		'gabung',
		'gabungkan',
		'merge',
		'pisah',
		'split',
		'kompres',
		'compress',
		'kecilkan',
		'jpg ke pdf',
		'gambar ke pdf',
	],
	privacy: 'lokal',
	status: 'siap',
	icon: 'file-text',
	plans: [
		'Gabung beberapa PDF, urutannya bisa diatur',
		'Pisah atau ambil halaman tertentu',
		'Kompres tiga tingkat dengan ukuran sebelum dan sesudah',
		'Ubah gambar JPG atau PNG menjadi PDF',
	],
	usage: [
		'Gabung: pilih dua PDF atau lebih, atur urutannya dengan ▲ ▼, lalu unduh.',
		'Pisah: pilih satu PDF, tulis halaman seperti 1-3,5, lalu unduh.',
		'Kompres: pilih PDF dan tingkatnya. Ukuran sebelum dan sesudah ditampilkan.',
		'Gambar → PDF: pilih JPG atau PNG, atur orientasi dan margin, lalu unduh.',
		'PDF → Gambar: pilih format PNG atau JPG dan resolusinya, lalu unduh tiap halaman.',
		'Putar & hapus: putar halaman 90°, buang halaman yang tidak perlu, lalu simpan.',
	],
	privacyDetail:
		'Berkasmu tidak dikirim ke server. Semua proses berjalan di worker browser.',
};
