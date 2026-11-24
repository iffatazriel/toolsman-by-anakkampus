import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'kirim-file',
	name: 'Kirim File',
	category: 'utilitas',
	tagline:
		'Unggah file, dapat link yang hilang sendiri setelah 1 jam, 24 jam, atau 7 hari. Berkas besar diunggah per bagian dan bisa dilanjutkan, plus opsi kata sandi dan sekali unduh.',
	keywords: [
		'kirim',
		'share',
		'link',
		'transfer',
		'unggah',
		'upload',
		'file',
		'berbagi',
		'kirim file besar',
		'kata sandi',
	],
	privacy: 'server',
	status: 'siap',
	icon: 'link',
	plans: [],
	usage: [
		'Pilih berkas, atur masa berlaku, lalu nyalakan kata sandi atau sekali unduh per berkas kalau perlu.',
		'Tekan Unggah dan buat link, lalu salin link atau tunjukkan QR-nya ke penerima.',
		'Berkas dan link dihapus otomatis saat masa berlakunya habis. Untuk sekali unduh, tiap berkas hanya bisa diambil satu kali.',
		'Berkas di atas 8 MB diunggah per bagian. Kalau koneksi putus, tekan Ulangi unggahan dan proses lanjut dari bagian terakhir.',
		'Simpan link kelola untuk melihat unduhan dan menghapus kiriman lebih awal. Buka lagi dari Kiriman kamu di browser ini.',
	],
	privacyDetail:
		'Berkas disimpan sementara di penyimpanan objek Toolsman. Kata sandi dan token kelola disimpan sebagai hash di server. Browser kamu menyimpan link kelola rahasia dan nama berkas di localStorage sampai kedaluwarsa atau kamu hapus dari daftar. Siapa pun yang memegang link kelola bisa melihat status dan menghapus kiriman. Penghapusan menutup akses segera; sisa objek yang gagal dihapus akan dicoba lagi oleh pembersihan otomatis.',
	faq: [
		{
			q: 'Bagaimana cara mengelola atau menghapus kiriman?',
			a: 'Setelah unggahan selesai, simpan Link kelola untuk kamu sendiri. Buka lewat Kiriman kamu di browser yang sama untuk melihat hitungan unduhan, mengaktifkan notifikasi saat halaman terbuka, atau memilih Hapus sekarang. Token hilang tidak bisa dipulihkan, dan kiriman lama sebelum fitur ini tidak bisa dikelola. Hitungan berarti pengambilan dimulai, bukan bukti unduhan selesai. Berkas yang sudah diunduh atau sedang dikirim tidak dapat ditarik kembali.',
		},
		{
			q: 'Berapa lama link berlaku?',
			a: 'Pilih 1 jam, 24 jam, atau 7 hari saat mengunggah. Setelah masa itu habis, berkas dan link dihapus otomatis.',
		},
		{
			q: 'Bisakah berkas hanya diunduh sekali?',
			a: 'Bisa. Nyalakan opsi sekali unduh per berkas saat mengunggah; setelah diambil sekali, berkas itu tidak bisa dibuka lagi.',
		},
	],
};
