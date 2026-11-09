export const MAX_FILE_BYTES = 100 * 1024 * 1024;

export const EXPIRY_OPTIONS = {
	'1h': { label: '1 jam', seconds: 60 * 60 },
	'24h': { label: '24 jam', seconds: 24 * 60 * 60 },
	'7d': { label: '7 hari', seconds: 7 * 24 * 60 * 60 },
} as const;

export type ExpiryId = keyof typeof EXPIRY_OPTIONS;

export const BLOCKED_EXTENSIONS = [
	'exe',
	'msi',
	'bat',
	'cmd',
	'com',
	'scr',
	'pif',
	'ps1',
	'vbs',
	'js',
	'jar',
	'apk',
	'dmg',
	'sh',
];

// Karakter kontrol dan penanda arah teks (RTL override) dipakai untuk menyamarkan
// ekstensi, misalnya "laporan\u202Egnp.exe" yang tampil seperti "laporane xe.pdf".
const UNSAFE_NAME_CHARS = /[\u0000-\u001F\u007F\u202A-\u202E\u2066-\u2069]/;

export function hasUnsafeNameChars(name: string): boolean {
	return UNSAFE_NAME_CHARS.test(name);
}

export const PASSWORD_MIN = 4;
export const PASSWORD_MAX = 64;

export function validatePassword(value: string): string | null {
	if (value.length < PASSWORD_MIN) return `Kata sandi minimal ${PASSWORD_MIN} karakter.`;
	if (value.length > PASSWORD_MAX) return `Kata sandi maksimal ${PASSWORD_MAX} karakter.`;
	return null;
}

export function isExpiryId(value: unknown): value is ExpiryId {
	return typeof value === 'string' && value in EXPIRY_OPTIONS;
}

export function isBlockedName(name: string): boolean {
	// Periksa semua bagian, bukan hanya ekstensi terakhir. "laporan.exe.pdf"
	// tetap membawa berkas yang bisa dijalankan kalau dibuka sembarangan.
	return name
		.split('.')
		.slice(1)
		.some((part) => BLOCKED_EXTENSIONS.includes(part.toLowerCase()));
}

export function validateFile(file: { name: string; size: number }): string | null {
	if (file.name.trim() === '') return 'Nama berkas kosong.';
	if (hasUnsafeNameChars(file.name)) {
		return `Nama berkas ${JSON.stringify(file.name)} tidak valid. Ganti namanya, lalu coba lagi.`;
	}
	if (isBlockedName(file.name)) {
		return `Jenis berkas ${file.name} tidak diizinkan. Kompres dulu sebagai .zip.`;
	}
	if (file.size <= 0) return `${file.name} kosong.`;
	if (file.size > MAX_FILE_BYTES) return `${file.name} lebih dari 100 MB.`;
	return null;
}

export function sanitizeFileName(name: string): string {
	const base = (name.split(/[\\/]/).pop() ?? '').trim();
	const cleaned = base.replace(/[^\w.\- ()]+/g, '_').replace(/^\.+/, '').slice(0, 120);
	return cleaned === '' ? 'berkas' : cleaned;
}

export function randomToken(bytes = 16): string {
	const buffer = new Uint8Array(bytes);
	crypto.getRandomValues(buffer);
	return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function expiresAt(now: number, expiry: ExpiryId): number {
	return now + EXPIRY_OPTIONS[expiry].seconds * 1000;
}

export function isExpired(expiresAtMs: number, now: number): boolean {
	return now >= expiresAtMs;
}
