// Dipanggil dari `prebuild`. Build produksi tidak boleh lolos tanpa kunci
// situs Turnstile: kalau kosong, widget tidak pernah dimuat dan Kirim File
// berjalan tanpa verifikasi. Lebih baik build gagal sekarang daripada situs
// live diam-diam tanpa bot protection.
import { readFileSync } from 'node:fs';

const NAME = 'PUBLIC_TURNSTILE_SITE_KEY';

function readEnvFile(path) {
	try {
		return readFileSync(path, 'utf8');
	} catch {
		return '';
	}
}

const fromProcess = (process.env[NAME] ?? '').trim();
const envFile = readEnvFile('.env');
const fromFile =
	/(?:^|\n)\s*PUBLIC_TURNSTILE_SITE_KEY\s*=\s*(.*)/.exec(envFile)?.[1]?.trim().replace(/^["']|["']$/g, '') ??
	'';

if (fromProcess !== '' || fromFile !== '') {
	process.exit(0);
}

process.stderr.write(
	[
		'',
		'Build dihentikan: PUBLIC_TURNSTILE_SITE_KEY kosong.',
		'',
		'Tanpa kunci ini, widget Turnstile tidak dimuat dan rute unggah akan',
		'menolak semua permintaan karena server tidak bisa memverifikasi token.',
		'',
		'Perbaikan:',
		`  1. Buat berkas .env di akar proyek (bukan hanya variabel terminal).`,
		`  2. Isi ${NAME}=<site key Turnstile kamu>.`,
		'  3. Jalankan ulang `npm run build`.',
		'',
		'Lihat SETUP.md bagian "Turnstile" untuk langkah lengkapnya.',
		'',
	].join('\n'),
);

process.exit(1);
