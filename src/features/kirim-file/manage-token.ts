export const MANAGE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function createManageToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
		.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function hashManageToken(token: string): Promise<string> {
	const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
	return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyManageToken(token: string, expected: string): Promise<boolean> {
	if (!MANAGE_TOKEN_PATTERN.test(token) || !/^[0-9a-f]{64}$/.test(expected)) return false;
	const actual = await hashManageToken(token);
	let difference = 0;
	for (let i = 0; i < 64; i++) difference |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
	return difference === 0;
}
