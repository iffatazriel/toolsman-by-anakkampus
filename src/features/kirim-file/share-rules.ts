export const MAX_FILE_BYTES = 100 * 1024 * 1024;

export const EXPIRY_OPTIONS = {
	'1h': { label: '1 jam', seconds: 60 * 60 },
	'24h': { label: '24 jam', seconds: 24 * 60 * 60 },
	'7d': { label: '7 hari', seconds: 7 * 24 * 60 * 60 },
} as const;

export type ExpiryId = keyof typeof EXPIRY_OPTIONS;

export const BLOCKED_EXTENSIONS = ['exe', 'bat', 'cmd', 'scr', 'msi', 'com', 'pif', 'vbs', 'js', 'jar', 'ps1', 'sh', 'apk'];

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
	const dot = name.lastIndexOf('.');
	if (dot === -1) return false;
	return BLOCKED_EXTENSIONS.includes(name.slice(dot + 1).toLowerCase());
}

export function validateFile(file: { name: string; size: number }): string | null {
	if (file.name.trim() === '') return 'Nama berkas kosong.';
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
