import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'generator',
	name: 'Generator Teks',
	category: 'generator',
	tagline:
		'Tulis Markdown dengan pratinjau, susun README siap tempel, dan rapikan JSON. Semua jalan di browser, teks tidak dikirim ke server.',
	keywords: [
		'json',
		'markdown',
		'readme',
		'generator',
		'formatter',
		'validator',
		'prettify',
		'minify',
		'salin',
		'unduh md',
	],
	privacy: 'lokal',
	status: 'siap',
	icon: 'braces',
	usage: [
		'Markdown: tulis di kiri, pratinjau ikut berubah. Toolbar menyisipkan tebal, miring, judul, daftar, kode, tautan, dan tabel.',
		'README: isi form di kiri, pratinjau muncul di kanan. Tombol Salin .md dan Unduh .md ada di atas pratinjau.',
		'JSON: tempel teks, lalu tekan Format atau Minify. Kalau ada yang salah, pesannya menyebut baris dan kolom.',
	],
	privacyDetail:
		'Teks yang kamu tulis tidak dikirim ke server. Markdown, README, dan JSON diproses di tab ini.',
};

