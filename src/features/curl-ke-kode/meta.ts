import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'curl-ke-kode', name: 'cURL ke Kode', category: 'developer', icon: 'code', status: 'siap', privacy: 'lokal',
	tagline: 'Ubah perintah cURL menjadi JavaScript Fetch atau Axios tanpa menjalankan request atau mengirim kredensial kamu.',
	keywords: ['curl', 'fetch', 'axios', 'http', 'api', 'request', 'kode', 'header', 'json'],
	usage: ['Tempel satu perintah curl, termasuk header dan data yang dibutuhkan.', 'Pilih Fetch atau Axios lalu konversi. Baca peringatan flag, file, dan batasan browser.', 'Salin kode dan ganti placeholder file atau variabel sebelum menjalankannya sendiri.'],
	privacyDetail: 'Perintah, URL, cookie, dan token hanya diproses di browser, tidak disimpan dan tidak dikirim ke server. Konverter tidak menjalankan request.',
	faq: [{ q: 'Apakah file dan variabel shell ikut dibaca?', a: 'Tidak. Variabel tidak dievaluasi dan file lokal tidak dibaca. File diwakili placeholder kosong dengan peringatan yang harus kamu ganti. Cookie dan Authorization dapat berisi rahasia: jangan membagikan kode hasil tanpa memeriksanya.' }],
};
