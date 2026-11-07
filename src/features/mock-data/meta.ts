import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'mock-data',
	name: 'Data Palsu',
	category: 'utilitas',
	tagline:
		'Hasilkan data uji JSON atau CSV dengan seed yang bisa diulang. Nama, email, telepon, kota, tanggal, dan angka dalam satu klik.',
	keywords: [
		'mock data',
		'data palsu',
		'dummy data',
		'json',
		'csv',
		'seed',
		'testing',
		'data uji',
	],
	privacy: 'lokal',
	status: 'siap',
	icon: 'database',
	usage: [
		'Tentukan jumlah baris, seed, dan field yang dibutuhkan.',
		'Tekan Buat data. Seed yang sama selalu menghasilkan data yang sama.',
		'Salin atau unduh hasilnya sebagai JSON atau CSV.',
	],
	privacyDetail:
		'Data dibuat di tab ini dari daftar nama dan kota bawaan. Tidak ada permintaan ke server.',
};
