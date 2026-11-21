import { describe, expect, it } from 'vitest';
import { createManageToken, hashManageToken, MANAGE_TOKEN_PATTERN, verifyManageToken } from './manage-token';

describe('token kelola', () => {
	it('menghasilkan token base64url acak dari 32 byte', () => {
		const tokens = Array.from({ length: 20 }, createManageToken);
		expect(new Set(tokens).size).toBe(20);
		for (const token of tokens) {
			expect(token).toMatch(MANAGE_TOKEN_PATTERN);
			expect(atob(token.replace(/-/g, '+').replace(/_/g, '/') + '=').length).toBe(32);
		}
	});
	it('memakai SHA-256 dan memverifikasi semua byte hash', async () => {
		expect(await hashManageToken('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
		const token = createManageToken(), hash = await hashManageToken(token);
		expect(await verifyManageToken(token, hash)).toBe(true);
		expect(await verifyManageToken(createManageToken(), hash)).toBe(false);
		for (const index of [0, 31, 63]) expect(await verifyManageToken(token, hash.slice(0, index) + (hash[index] === '0' ? '1' : '0') + hash.slice(index + 1))).toBe(false);
	});
	it('menolak token/hash kosong atau format yang tidak valid', async () => {
		for (const token of ['', 'x', 'a'.repeat(44), '+'.repeat(43)]) expect(await verifyManageToken(token, '0'.repeat(64))).toBe(false);
		for (const hash of ['', 'x'.repeat(64), 'a'.repeat(63)]) expect(await verifyManageToken(createManageToken(), hash)).toBe(false);
	});
});
