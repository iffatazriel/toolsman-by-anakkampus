import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'sitasi', name: 'Generator Sitasi', category: 'utilitas', icon: 'file-text',
	tagline: 'Susun daftar pustaka APA 7 atau IEEE dari buku, jurnal, dan halaman web. Simpan di browser dan ekspor BibTeX.',
	keywords: ['sitasi', 'citation', 'apa', 'ieee', 'daftar pustaka', 'bibtex', 'referensi'],
	status: 'siap', privacy: 'lokal',
	usage: ['Pilih gaya dan jenis sumber. Isi nama depan dan nama belakang tiap penulis secara terpisah.', 'Isi data sumber, lalu tambahkan ke daftar. Periksa pratinjau dan contoh kutipan dalam teks.', 'Salin satu atau semua sitasi, unduh teks, atau ekspor BibTeX. Daftar tersimpan di browser kamu.'],
	privacyDetail: 'Data sumber disimpan di localStorage browser kamu, tidak dikirim ke server. Unduh cadangan sebelum menghapus data browser.',
	faq: [{ q: 'Apakah hasilnya bisa langsung dipakai?', a: 'Periksa lagi sesuai pedoman kampus atau penerbit kamu. Alat tidak mengambil metadata DOI otomatis. Tanggal akses APA dipakai untuk halaman yang isinya berubah; kosongkan jika tidak diperlukan. Nama tunggal bisa diisi pada nama belakang.' }],
};
