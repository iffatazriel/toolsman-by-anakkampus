export function encodeBase64(text: string): string {
	const bytes = new TextEncoder().encode(text);
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}

export function decodeBase64(input: string): string {
	const cleaned = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
	if (cleaned === '') return '';

	const padded = cleaned.padEnd(Math.ceil(cleaned.length / 4) * 4, '=');
	const binary = atob(padded);
	const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
	return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export function encodeUrl(text: string): string {
	return encodeURIComponent(text);
}

export function decodeUrl(text: string): string {
	return decodeURIComponent(text);
}

export interface JwtParts {
	header: unknown;
	payload: unknown;
}

export function decodeJwt(token: string): JwtParts {
	const parts = token.trim().split('.');
	if (parts.length < 3) throw new Error('JWT butuh tiga bagian yang dipisah titik.');
	if (!parts[0] || !parts[1]) throw new Error('Bagian header atau payload kosong.');

	return {
		header: JSON.parse(decodeBase64Url(parts[0])),
		payload: JSON.parse(decodeBase64Url(parts[1])),
	};
}

export interface JwtExpiry {
	expired: boolean;
	at: Date;
}

export function jwtExpiry(payload: unknown, now = Date.now()): JwtExpiry | null {
	if (payload === null || typeof payload !== 'object') return null;
	const exp = Number((payload as Record<string, unknown>).exp);
	if (!Number.isFinite(exp)) return null;
	return { expired: now / 1000 >= exp, at: new Date(exp * 1000) };
}

export function generateUuids(count: number): string[] {
	const safe = Math.min(50, Math.max(1, Math.trunc(count) || 1));
	return Array.from({ length: safe }, () => crypto.randomUUID());
}

export interface TimestampInfo {
	ms: number;
	iso: string;
	local: string;
	unixSeconds: number;
	unixMillis: number;
}

export function parseTimestamp(input: string): TimestampInfo {
	const text = input.trim();
	if (text === '') throw new Error('Isi timestamp atau tanggal dulu.');

	let ms: number;
	if (/^-?\d+$/.test(text)) {
		const value = Number(text);
		ms = Math.abs(value) < 1e12 ? value * 1000 : value;
	} else {
		ms = Date.parse(text);
	}

	if (!Number.isFinite(ms)) throw new Error('Format tanggal tidak dikenali.');

	const date = new Date(ms);
	return {
		ms,
		iso: date.toISOString(),
		local: date.toLocaleString('id-ID'),
		unixSeconds: Math.floor(ms / 1000),
		unixMillis: Math.round(ms),
	};
}

function decodeBase64Url(part: string): string {
	const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
	const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
	const binary = atob(padded);
	const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
	return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
