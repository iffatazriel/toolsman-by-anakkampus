import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'cron',
	name: 'Cron Builder',
	category: 'utilitas',
	tagline:
		'Susun ekspresi cron 5 field, lihat 5 jadwal berikutnya di zona waktu pilihanmu, dan baca penjelasannya dalam bahasa Indonesia.',
	keywords: [
		'cron',
		'cron builder',
		'crontab',
		'jadwal',
		'scheduler',
		'zona waktu',
		'ekspresi cron',
	],
	privacy: 'lokal',
	status: 'siap',
	icon: 'clock',
	usage: [
		'Isi lima bagian: menit, jam, tanggal, bulan, dan hari. Gunakan * untuk semua nilai.',
		'Pilih zona waktu. Jadwal berikutnya dihitung sesuai zona itu.',
		'Salin ekspresi cron setelah penjelasan dan lima jadwalnya cocok.',
	],
	privacyDetail:
		'Semua perhitungan jadwal berjalan di browser. Tidak ada ekspresi yang dikirim ke server.',
};
