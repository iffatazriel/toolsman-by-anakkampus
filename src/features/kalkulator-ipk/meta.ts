import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'kalkulator-ipk', name: 'Kalkulator IPK', category: 'kuliah', icon: 'table',
	tagline: 'Hitung IPS per semester, IPK kumulatif, dan rata-rata nilai yang kamu perlukan untuk mengejar target IPK.',
	keywords: ['ipk', 'ips', 'gpa', 'sks', 'semester', 'nilai', 'kuliah', 'target ipk'],
	status: 'siap', privacy: 'lokal',
	usage: ['Pilih skala nilai kampus kamu. Bobot tiap nilai bisa diubah dari 0 sampai 4.', 'Tambahkan semester dan mata kuliah, lalu isi SKS dan nilai huruf.', 'Lihat IPS, IPK, atau target IPK. Ekspor JSON untuk cadangan dan impor untuk memulihkan.'],
	privacyDetail: 'Nama mata kuliah dan nilai disimpan di browser kamu. Data tidak dikirim ke server.',
	faq: [{ q: 'Apakah hasilnya sama dengan perhitungan kampus?', a: 'Hasil memakai rata-rata berbobot SKS untuk semua baris bernilai. Nilai kosong atau SKS 0 tidak dihitung. Mata kuliah mengulang tidak diganti otomatis; hapus baris yang tidak ingin kamu hitung. Periksa kebijakan kampus kamu.' }],
};
