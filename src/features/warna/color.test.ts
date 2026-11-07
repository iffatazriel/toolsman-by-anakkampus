import { describe, expect, it } from 'vitest';
import {
	contrastRatio,
	generateScale,
	hexToRgb,
	mix,
	normalizeHex,
	relativeLuminance,
	rgbToHex,
	wcag,
} from './color';

describe('normalizeHex', () => {
	it('menerima 3 dan 6 digit dengan atau tanpa pagar', () => {
		expect(normalizeHex('abc')).toBe('#aabbcc');
		expect(normalizeHex('#AABBCC')).toBe('#aabbcc');
		expect(normalizeHex('  #fff  ')).toBe('#ffffff');
	});

	it('menolak nilai yang bukan hex', () => {
		expect(normalizeHex('merah')).toBeNull();
		expect(normalizeHex('#12345')).toBeNull();
	});
});

describe('konversi RGB', () => {
	it('bolak-balik hex dan RGB', () => {
		expect(hexToRgb('#e8890c')).toEqual({ r: 232, g: 137, b: 12 });
		expect(rgbToHex({ r: 232, g: 137, b: 12 })).toBe('#e8890c');
	});

	it('membatasi kanal di luar 0 sampai 255', () => {
		expect(rgbToHex({ r: -5, g: 300, b: 127.6 })).toBe('#00ff80');
	});
});

describe('kontras WCAG', () => {
	it('hitam dan putih menghasilkan 21:1', () => {
		expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
	});

	it('warna yang sama menghasilkan 1:1', () => {
		expect(contrastRatio('#e8890c', '#e8890c')).toBeCloseTo(1, 5);
	});

	it('menentukan ambang AA dan AAA', () => {
		expect(wcag(7.1)).toEqual({
			normalAA: true,
			normalAAA: true,
			largeAA: true,
			largeAAA: true,
		});
		expect(wcag(4.5)).toEqual({
			normalAA: true,
			normalAAA: false,
			largeAA: true,
			largeAAA: true,
		});
		expect(wcag(2.9)).toEqual({
			normalAA: false,
			normalAAA: false,
			largeAA: false,
			largeAAA: false,
		});
	});

	it('mengembalikan null untuk warna tidak valid', () => {
		expect(contrastRatio('bukan', '#fff')).toBeNull();
	});

	it('menghitung luminansi relatif', () => {
		expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
		expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5);
	});
});

describe('palet turunan', () => {
	it('menghasilkan 10 langkah dengan warna dasar di tengah', () => {
		const scale = generateScale('#e8890c');
		expect(scale).toHaveLength(10);
		expect(scale[5]).toEqual({ label: 500, hex: '#e8890c' });
	});

	it('langkah awal lebih terang dan langkah akhir lebih gelap', () => {
		const scale = generateScale('#336699');
		const first = hexToRgb(scale[0]!.hex)!;
		const last = hexToRgb(scale[9]!.hex)!;
		const base = hexToRgb('#336699')!;
		expect(relativeLuminance(first)).toBeGreaterThan(relativeLuminance(base));
		expect(relativeLuminance(last)).toBeLessThan(relativeLuminance(base));
	});

	it('mix mengembalikan ujung-ujung saat amount 0 dan 1', () => {
		expect(mix('#000000', '#ffffff', 0)).toBe('#000000');
		expect(mix('#000000', '#ffffff', 1)).toBe('#ffffff');
		expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
	});
});
