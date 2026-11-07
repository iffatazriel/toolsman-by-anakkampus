export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export const hashAlgorithms: { id: HashAlgorithm; label: string }[] = [
	{ id: 'SHA-256', label: 'SHA-256' },
	{ id: 'SHA-512', label: 'SHA-512' },
	{ id: 'SHA-384', label: 'SHA-384' },
	{ id: 'SHA-1', label: 'SHA-1 (lama)' },
];

export async function hashBuffer(
	data: ArrayBuffer,
	algorithm: HashAlgorithm,
): Promise<string> {
	const digest = await crypto.subtle.digest(algorithm, data);
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
		'',
	);
}

export async function hashText(text: string, algorithm: HashAlgorithm): Promise<string> {
	const bytes = new TextEncoder().encode(text);
	return hashBuffer(bytes.buffer.slice(0) as ArrayBuffer, algorithm);
}

export function normalizeHash(value: string): string {
	return value.trim().toLowerCase().replace(/\s+/g, '');
}

export function hashMatches(expected: string, actual: string): boolean {
	const normalized = normalizeHash(expected);
	return normalized !== '' && normalized === normalizeHash(actual);
}
