import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'generator',
	name: 'Generator Teks',
	category: 'generator',
	tagline:
		'Tulis Markdown dengan pratinjau, susun README, rapikan JSON, konversi JSON/CSV/YAML, buat .gitignore, dan hasilkan berkas LICENSE. Semua jalan di browser, teks tidak dikirim ke server.',
	keywords: [
		'json',
		'markdown',
		'readme',
		'generator',
		'formatter',
		'validator',
		'prettify',
		'minify',
		'gitignore',
		'license',
		'lisensi',
		'salin',
		'unduh md',
		'csv',
		'yaml',
		'konversi',
	],
	privacy: 'lokal',
	status: 'siap',
	icon: 'braces',
	usage: [
		'Markdown: tulis di kiri, pratinjau ikut berubah. Toolbar menyisipkan tebal, miring, judul, daftar, kode, tautan, dan tabel.',
		'README: isi form di kiri, pratinjau muncul di kanan. Tombol Salin .md dan Unduh .md ada di atas pratinjau.',
		'JSON: tempel teks, lalu tekan Format atau Minify. Kalau ada yang salah, pesannya menyebut baris dan kolom.',
		'Konversi: bolak-balik JSON ↔ CSV dan JSON ↔ YAML. Baris pertama CSV dianggap judul kolom.',
		'.gitignore: centang tumpukan yang dipakai, lalu salin atau unduh berkasnya.',
		'Lisensi: pilih jenis, isi pemilik hak cipta, lalu salin atau unduh LICENSE.',
	],
	privacyDetail:
		'Teks yang kamu tulis tidak dikirim ke server. Markdown, README, JSON, .gitignore, dan lisensi diproses di tab ini.',
};

