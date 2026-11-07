import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'qr',
	name: 'QR Code',
	category: 'generator',
	tagline:
		'Ubah teks atau tautan jadi QR code, lalu unduh sebagai PNG atau SVG. Tidak ada isi yang dikirim ke server.',
	keywords: [
		'qr',
		'qr code',
		'barcode',
		'tautan',
		'url',
		'png',
		'svg',
		'unduh',
		'pemindai',
	],
	privacy: 'lokal',
	status: 'siap',
	icon: 'qr',
	usage: [
		'Tulis teks atau tempel URL di kolom masukan. Pratinjau langsung muncul.',
		'Atur ukuran, koreksi error, dan margin sesuai kebutuhan cetak atau layar.',
		'Unduh PNG untuk gambar, atau SVG kalau perlu diperbesar tanpa pecah.',
	],
	privacyDetail:
		'Teks dan tautanmu diproses di tab ini. Tidak ada permintaan ke server untuk membuat QR.',
};
