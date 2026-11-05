const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

function toBase64(bytes: Uint8Array): string {
	let binary = '';
	bytes.forEach((byte) => {
		binary += String.fromCharCode(byte);
	});
	return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
	const binary = atob(value);
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		'PBKDF2',
		false,
		['deriveBits'],
	);
	const bits = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', salt: new Uint8Array(salt), iterations, hash: 'SHA-256' },
		key,
		KEY_BITS,
	);
	return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
	const hash = await derive(password, salt, ITERATIONS);
	return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let index = 0; index < a.length; index += 1) {
		diff |= a[index]! ^ b[index]!;
	}
	return diff === 0;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const parts = stored.split('$');
	if (parts.length !== 4) return false;
	const [scheme, iterationsRaw, saltRaw, hashRaw] = parts;
	if (scheme !== 'pbkdf2' || !iterationsRaw || !saltRaw || !hashRaw) return false;

	const iterations = Number(iterationsRaw);
	if (!Number.isInteger(iterations) || iterations < 1) return false;

	let salt: Uint8Array;
	let expected: Uint8Array;
	try {
		salt = fromBase64(saltRaw);
		expected = fromBase64(hashRaw);
	} catch {
		return false;
	}

	const actual = await derive(password, salt, iterations);
	return sameBytes(actual, expected);
}
