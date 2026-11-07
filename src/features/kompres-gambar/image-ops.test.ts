import { describe, expect, it } from 'vitest';
import {
	extensionFor,
	fitWithin,
	mimeFor,
	outputFileName,
	qualityFor,
} from './image-ops';

describe('fitWithin', () => {
	it('memperkecil gambar besar dengan menjaga rasio', () => {
		expect(fitWithin(4000, 2000, 1920, 1920)).toEqual({
			width: 1920,
			height: 960,
			scaled: true,
		});
	});

	it('tidak memperbesar gambar kecil', () => {
		expect(fitWithin(800, 600, 1920, 1920)).toEqual({
			width: 800,
			height: 600,
			scaled: false,
		});
	});

	it('membatasi sisi tinggi juga', () => {
		expect(fitWithin(1000, 4000, 1920, 1280)).toEqual({
			width: 320,
			height: 1280,
			scaled: true,
		});
	});

	it('menolak ukuran tidak valid dengan hasil minimal 1 piksel', () => {
		expect(fitWithin(0, 100, 100, 100)).toEqual({ width: 1, height: 1, scaled: false });
	});
});

describe('format keluaran', () => {
	it('memberi mime dan ekstensi yang benar', () => {
		expect(mimeFor('jpeg')).toBe('image/jpeg');
		expect(mimeFor('png')).toBe('image/png');
		expect(mimeFor('webp')).toBe('image/webp');
		expect(extensionFor('jpeg')).toBe('jpg');
		expect(extensionFor('webp')).toBe('webp');
	});

	it('membuat nama berkas dari nama asli', () => {
		expect(outputFileName('foto liburan.JPG', 'webp')).toBe('foto liburan-kompres.webp');
		expect(outputFileName('tanpa-ekstensi', 'jpeg')).toBe('tanpa-ekstensi-kompres.jpg');
	});

	it('membatasi kualitas ke 0.1 sampai 1 dan mengabaikannya untuk PNG', () => {
		expect(qualityFor('jpeg', 0.7)).toBe(0.7);
		expect(qualityFor('jpeg', 2)).toBe(1);
		expect(qualityFor('jpeg', 0)).toBe(0.1);
		expect(qualityFor('png', 0.7)).toBeUndefined();
	});
});
