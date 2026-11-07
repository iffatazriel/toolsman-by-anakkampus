import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'hash',
	name: 'Hash Teks & Berkas',
	category: 'utilitas',
	tagline:
		'Hitung SHA-256, SHA-512, SHA-384, atau SHA-1 dari teks dan berkas, lalu bandingkan dengan hash yang kamu punya.',
	keywords: [
		'hash',
		'sha256',
		'sha512',
		'sha1',
		'checksum',
		'verifikasi berkas',
		'integritas',
		'utilitas',
	],
	privacy: 'lokal',
	status: 'siap',
	icon: 'shield',
	usage: [
		'Pilih mode Teks atau Berkas, lalu masukkan isinya.',
		'Pilih algoritme. Hash dihitung langsung di tab ini.',
		'Tempel hash pembanding untuk melihat cocok atau tidak, lalu salin hasilnya.',
	],
	privacyDetail:
		'Teks dan berkas diproses di browser memakai Web Crypto. Tidak ada yang dikirim ke server.',
};
