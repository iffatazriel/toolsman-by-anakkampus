import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'format-kode',
	name: 'Format Kode',
	category: 'utilitas',
	tagline: 'Rapikan SQL, JSON, JavaScript, TypeScript, HTML, dan CSS. Perkecil JSON atau CSS tanpa mengirim kode ke server.',
	keywords: ['formatter', 'format kode', 'sql', 'mysql', 'postgresql', 'sqlite', 'json', 'javascript', 'typescript', 'html', 'css', 'prettier', 'minify'],
	privacy: 'lokal',
	status: 'siap',
	icon: 'code',
	usage: ['Tempel kode kamu, lalu pilih bahasa dan dialek SQL jika diperlukan.', 'Pilih indentasi dan gaya kata kunci SQL, lalu tekan Format atau Minify untuk JSON dan CSS.', 'Salin atau unduh hasilnya sesuai ekstensi bahasa yang kamu pilih.'],
	privacyDetail: 'Kode diolah di browser kamu. Isi kode tidak dikirim ke server.',
	faq: [{ q: 'Apakah Format memeriksa semua kesalahan kode?', a: 'Tidak. Formatter membantu merapikan sintaks, bukan menjalankan kode atau menggantikan validator. SQL tidak divalidasi penuh; pastikan dialeknya cocok. Minify hanya tersedia untuk JSON dan CSS.' }],
};
