import { describe, expect, it } from 'vitest';
import {
	buildSessionUrl,
	decodeSession,
	encodeSession,
	fromBase64Url,
	MAX_TOKEN_LENGTH,
	MAX_URL_LENGTH,
	sessionTokenFromHash,
	SessionTooLargeError,
	toBase64Url,
} from './share-session';

function randomBase64(bytes: number): string {
	const view = crypto.getRandomValues(new Uint8Array(bytes));
	return toBase64Url(view);
}

describe('Base64 URL-safe', () => {
	it('bolak-balik byte tanpa karakter khusus', () => {
		const bytes = Uint8Array.from([0, 1, 2, 250, 255, 63, 62]);
		const encoded = toBase64Url(bytes);
		expect(encoded).not.toMatch(/[+/=]/);
		expect(Array.from(fromBase64Url(encoded))).toEqual(Array.from(bytes));
	});
});

describe('encodeSession dan decodeSession', () => {
	it('bolak-balik objek dengan unicode', async () => {
		const payload = { v: 1, type: 'diagram', code: 'graph TD\n  A[Halo 👋] --> B' };
		const token = await encodeSession(payload);
		expect(token.startsWith('g1.')).toBe(true);
		expect(await decodeSession(token)).toEqual(payload);
	});

	it('menolak token yang tidak dikenal atau rusak', async () => {
		await expect(decodeSession('abc')).rejects.toThrow('tidak dikenali');
		await expect(decodeSession('g1.bukan-base64')).rejects.toThrow('rusak');
	});

	it('menolak sesi yang terlalu besar sebelum dikompres', async () => {
		const payload = { code: 'x'.repeat(600 * 1024) };
		await expect(encodeSession(payload)).rejects.toThrow('terlalu besar');
	});

	it('menolak token yang melewati batas meski JSON-nya kecil', async () => {
		const payload = { blob: randomBase64(9000) };
		const error = await encodeSession(payload).catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(SessionTooLargeError);
		expect((error as SessionTooLargeError).limit).toBe(MAX_TOKEN_LENGTH);
		expect((error as SessionTooLargeError).length).toBeGreaterThan(MAX_TOKEN_LENGTH);
		expect((error as Error).message).toContain('Kurangi jumlah elemen atau teks');
	});

	it('masih menerima sesi yang berada di bawah batas', async () => {
		const payload = { v: 1, type: 'diagram', code: 'flowchart TD\n  A --> B' };
		const token = await encodeSession(payload);
		expect(token.length).toBeLessThan(MAX_TOKEN_LENGTH);
		expect(await decodeSession(token)).toEqual(payload);
	});

	it('menolak token terlalu panjang saat dibuka', async () => {
		const token = `g1.${'a'.repeat(MAX_TOKEN_LENGTH)}`;
		await expect(decodeSession(token)).rejects.toThrow('terlalu panjang');
	});
});

describe('hash dan URL', () => {
	it('membaca token dari hash', () => {
		expect(sessionTokenFromHash('#sesi=g1.abc')).toBe('g1.abc');
		expect(sessionTokenFromHash('sesi=g1.abc&lain=1')).toBe('g1.abc');
		expect(sessionTokenFromHash('#lain=1')).toBeNull();
		expect(sessionTokenFromHash('')).toBeNull();
	});

	it('membangun URL dengan hash sesi', () => {
		expect(buildSessionUrl('https://toolsman.test/tools/diagram/', 'g1.abc')).toBe(
			'https://toolsman.test/tools/diagram/#sesi=g1.abc',
		);
	});

	it('menolak URL yang melewati 8000 karakter', () => {
		const token = `g1.${'a'.repeat(MAX_URL_LENGTH)}`;
		const error = (() => {
			try {
				buildSessionUrl('https://toolsman.test/tools/draw/', token);
				return null;
			} catch (caught) {
				return caught as SessionTooLargeError;
			}
		})();

		expect(error).toBeInstanceOf(SessionTooLargeError);
		expect(error?.limit).toBe(MAX_URL_LENGTH);
	});
});
