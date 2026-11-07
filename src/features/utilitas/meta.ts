import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'utilitas',
	name: 'Utilitas Teks',
	category: 'utilitas',
	tagline:
		'Base64, URL encode, JWT, UUID, timestamp, regex tester, dan diff checker dalam satu tempat. Semua diproses di tab ini, teksnya tidak dikirim ke server.',
	keywords: [
		'base64',
		'encode',
		'decode',
		'url encode',
		'jwt',
		'json web token',
		'uuid',
		'timestamp',
		'unix',
		'regex',
		'diff',
		'bandingkan teks',
		'konverter',
		'utilitas',
	],
	privacy: 'lokal',
	status: 'siap',
	icon: 'hash',
	usage: [
		'Base64 dan URL: tempel teks, lalu tekan Encode atau Decode. Hasilnya bisa disalin.',
		'JWT: tempel token, header dan payload langsung dibaca. Tanda tangan tidak diverifikasi.',
		'UUID: tentukan jumlah 1 sampai 50, lalu tekan Buat UUID.',
		'Timestamp: masukkan detik, milidetik, atau tanggal, lalu tekan Ubah.',
		'Regex: tulis pattern dan teks uji. Kecocokan ditandai di teks dan didaftar dengan posisi serta grup.',
		'Diff: isi teks lama dan baru. Baris tambahan dan yang dihapus ditandai, lengkap dengan nomor baris.',
	],
	privacyDetail:
		'Semua olahan berjalan di tab ini. Token JWT yang kamu tempel tidak dikirim ke server.',
};
