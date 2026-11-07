import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'json-schema',
	name: 'Validator JSON Schema',
	category: 'utilitas',
	tagline:
		'Validasi JSON terhadap JSON Schema dan baca error per path dalam bahasa Indonesia. Semua diproses di browser.',
	keywords: [
		'json schema',
		'validator',
		'validasi json',
		'schema',
		'draft 2020-12',
		'error json',
		'utilitas developer',
	],
	privacy: 'lokal',
	status: 'siap',
	icon: 'braces',
	usage: [
		'Tempel schema dan data JSON di dua panel.',
		'Pilih draft schema, lalu tekan Validasi. Hasil juga diperbarui saat mengetik.',
		'Perbaiki data sesuai daftar masalah. Tiap masalah menyebut path dan alasannya.',
	],
	privacyDetail:
		'Schema dan data diproses di tab ini memakai validator tanpa code generation. Tidak ada yang dikirim ke server.',
};
