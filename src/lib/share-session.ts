const MAX_JSON_BYTES = 512 * 1024;
const MAX_DECODED_BYTES = 1024 * 1024;
const PREFIX = 'g1.';

export const MAX_URL_LENGTH = 8000;
export const MAX_TOKEN_LENGTH = 7000;

export class SessionTooLargeError extends Error {
	readonly length: number;
	readonly limit: number;

	constructor(length: number, limit: number) {
		super(
			`Sesi terlalu besar untuk dibagikan lewat link (${length.toLocaleString('id-ID')} dari ${limit.toLocaleString('id-ID')} karakter). Kurangi jumlah elemen atau teks, lalu coba lagi. Sebagai cadangan, unduh berkasnya atau salin kodenya.`,
		);
		this.name = 'SessionTooLargeError';
		this.length = length;
		this.limit = limit;
	}
}

export function toBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(value: string): Uint8Array {
	const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
	const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
	const binary = atob(padded);
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function compress(bytes: Uint8Array): Promise<Uint8Array> {
	const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream('gzip'));
	return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decompress(bytes: Uint8Array): Promise<Uint8Array> {
	const stream = new Blob([bytes as BlobPart])
		.stream()
		.pipeThrough(new DecompressionStream('gzip'));
	return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function encodeSession(payload: unknown): Promise<string> {
	const json = JSON.stringify(payload);
	const bytes = new TextEncoder().encode(json);
	if (bytes.byteLength > MAX_JSON_BYTES) {
		throw new Error('Sesi terlalu besar untuk link. Ekspor berkasnya sebagai cadangan.');
	}

	const compressed = await compress(bytes);
	const token = `${PREFIX}${toBase64Url(compressed)}`;
	if (token.length > MAX_TOKEN_LENGTH) {
		throw new SessionTooLargeError(token.length, MAX_TOKEN_LENGTH);
	}
	return token;
}

export async function decodeSession(token: string): Promise<unknown> {
	if (!token.startsWith(PREFIX)) throw new Error('Link sesi tidak dikenali.');
	if (token.length > MAX_TOKEN_LENGTH) throw new Error('Link sesi terlalu panjang atau terpotong.');

	try {
		const compressed = fromBase64Url(token.slice(PREFIX.length));
		const bytes = await decompress(compressed);
		if (bytes.byteLength > MAX_DECODED_BYTES) throw new Error('Sesi terlalu besar.');
		return JSON.parse(new TextDecoder().decode(bytes));
	} catch {
		throw new Error('Link sesi rusak atau tidak lengkap.');
	}
}

export function sessionTokenFromHash(hash: string): string | null {
	const raw = hash.startsWith('#') ? hash.slice(1) : hash;
	if (raw === '') return null;
	const token = new URLSearchParams(raw).get('sesi');
	return token && token !== '' ? token : null;
}

export function sessionHash(token: string): string {
	return `#sesi=${token}`;
}

export function buildSessionUrl(base: string, token: string): string {
	const url = new URL(base);
	url.hash = sessionHash(token);
	const built = url.toString();
	if (built.length > MAX_URL_LENGTH) throw new SessionTooLargeError(built.length, MAX_URL_LENGTH);
	return built;
}
