import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'code-to-image',
	name: 'Kode ke Gambar',
	category: 'gambar',
	tagline:
		'Ubah cuplikan kode jadi PNG dengan highlight, tema terang atau gelap, padding dan sudut yang bisa diatur.',
	keywords: [
		'code to image',
		'kode ke gambar',
		'snippet',
		'highlight',
		'png',
		'screenshot kode',
		'bagikan kode',
	],
	privacy: 'lokal',
	status: 'siap',
	icon: 'code',
	usage: [
		'Tempel kode, lalu pilih bahasanya supaya warnanya sesuai.',
		'Atur tema, padding, dan sudut gambar sampai tampilannya cocok.',
		'Unduh PNG setelah ukuran dan warnanya pas.',
	],
	privacyDetail:
		'Kode diproses di tab ini memakai highlight.js dan canvas. Tidak ada yang dikirim ke server.',
};
