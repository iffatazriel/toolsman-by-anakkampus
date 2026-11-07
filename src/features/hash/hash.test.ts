import { describe, expect, it } from 'vitest';
import { hashMatches, hashText, normalizeHash } from './hash';

describe('hashText', () => {
	it('menghasilkan SHA-256 yang benar untuk "abc"', async () => {
		expect(await hashText('abc', 'SHA-256')).toBe(
			'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
		);
	});

	it('menghasilkan SHA-1 yang benar untuk "abc"', async () => {
		expect(await hashText('abc', 'SHA-1')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
	});

	it('menghasilkan panjang hex sesuai algoritme', async () => {
		expect(await hashText('toolsman', 'SHA-384')).toHaveLength(96);
		expect(await hashText('toolsman', 'SHA-512')).toHaveLength(128);
	});

	it('teks berbeda menghasilkan hash berbeda', async () => {
		expect(await hashText('a', 'SHA-256')).not.toBe(await hashText('b', 'SHA-256'));
	});
});

describe('normalizeHash', () => {
	it('membuang spasi dan menyamakan huruf', () => {
		expect(normalizeHash('  BA78 16BF ')).toBe('ba7816bf');
	});
});

describe('hashMatches', () => {
	it('mencocokkan tanpa peduli besar-kecil dan spasi', () => {
		expect(hashMatches(' BA7816BF ', 'ba7816bf')).toBe(true);
	});

	it('menolak input kosong dan hash berbeda', () => {
		expect(hashMatches('', '')).toBe(false);
		expect(hashMatches('abc', 'def')).toBe(false);
	});
});
