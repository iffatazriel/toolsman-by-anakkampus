import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'kirim-file',
	name: 'Kirim File',
	category: 'berbagi',
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
	],
	privacyDetail:
		'Berkas disimpan sementara di penyimpanan objek milik Toolsman, bukan di peramban. Kata sandi disimpan sebagai hash, dan link bisa dilaporkan. Berkas dihapus lebih cepat dari masa berlakunya setelah kedaluwarsa atau setelah kuota unduhannya habis.',
	faq: [
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
