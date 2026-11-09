import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'prompt',
	name: 'Bank Prompt',
	category: 'ai',
	tagline:
		'Cari prompt AI siap pakai untuk belajar, laporan, kode, dan karier. Isi variabelnya, lihat hasil akhirnya, lalu salin. Semua di browser.',
	badge: 'baru',
	keywords: [
		'prompt',
		'bank prompt',
		'ai',
		'chatgpt',
		'claude',
		'gemini',
		'copilot',
		'template prompt',
		'variabel',
		'salin prompt',
		'belajar',
		'laporan',
		'menulis',
		'kode',
		'riset',
		'karier',
		'cv',
		'debugging',
	],
	privacy: 'lokal',
	status: 'siap',
	icon: 'sparkles',
	usage: [
		'Cari atau saring menurut kategori, AI, dan level. Filter tersimpan di URL, jadi bisa kamu bagikan.',
		'Buka satu prompt, isi variabelnya, dan lihat pratinjau akhirnya berubah saat kamu mengetik.',
		'Salin hasilnya atau unduh sebagai berkas .md. Tidak ada isian yang dikirim ke server.',
	],
	privacyDetail:
		'Isian variabel dan penyusunan prompt terjadi di browser. Halaman ini hanya meminta berkas indeks statis dari Toolsman, bukan dari server lain, dan isianmu tidak ikut terkirim.',
	faq: [
		{
			q: 'Apakah promptnya boleh dipakai untuk tugas kampus?',
			a: 'Pakai untuk belajar, bukan menyalin mentah. Tulis ulang dengan kata-katamu, sebutkan sumber, dan ikuti aturan dosen. Prompt kategori Belajar dan Laporan menampilkan pengingat ini.',
		},
		{
			q: 'Dari mana promptnya berasal?',
			a: 'Semua prompt di sini ditulis ulang khusus untuk Toolsman dan dirilis dengan lisensi CC0 atau CC-BY. Tidak ada yang disalin dari pustaka prompt lain.',
		},
		{
			q: 'Kenapa hasil AI-nya kadang kurang tepat?',
			a: 'Prompt hanya mengatur bentuk jawaban. Model tetap bisa salah, terutama soal angka dan kutipan. Periksa hasilnya sebelum dipakai, dan jangan menambahkan data yang tidak kamu punya.',
		},
	],
};
