import { describe, expect, it } from 'vitest';
import { enhancePixels } from './enhance';

function pixel(r: number, g: number, b: number, a: number): number[] {
	return [r, g, b, a];
}

describe('enhancePixels', () => {
	it('mencerahkan warna dan membatasi di 255', () => {
		const data = new Uint8ClampedArray([...pixel(100, 100, 100, 255), ...pixel(200, 200, 200, 255)]);
		enhancePixels(data, 2, 1, { brightness: 50, feather: 0 });
		expect(data[0]).toBe(150);
		expect(data[4]).toBe(255);
	});

	it('menggelapkan warna tanpa mengubah alpha', () => {
		const data = new Uint8ClampedArray(pixel(100, 100, 100, 255));
		enhancePixels(data, 1, 1, { brightness: -40, feather: 0 });
		expect(data[0]).toBe(60);
		expect(data[3]).toBe(255);
	});

	it('tidak mengubah apa pun kalau kecerahan nol', () => {
		const data = new Uint8ClampedArray(pixel(12, 34, 56, 200));
		enhancePixels(data, 1, 1, { brightness: 0, feather: 0 });
		expect(Array.from(data)).toEqual(pixel(12, 34, 56, 200));
	});

	it('menghaluskan tepi alpha tanpa mengubah warna', () => {
		const width = 9;
		const data = new Uint8ClampedArray(width * 4);
		const alphas = [255, 255, 255, 255, 255, 0, 0, 0, 0];
		for (let index = 0; index < width; index += 1) {
			data[index * 4] = 10;
			data[index * 4 + 1] = 20;
			data[index * 4 + 2] = 30;
			data[index * 4 + 3] = alphas[index]!;
		}

		enhancePixels(data, width, 1, { brightness: 0, feather: 1 });

		expect(data[0 * 4 + 3]).toBe(255);
		expect(data[4 * 4 + 3]).toBeLessThan(255);
		expect(data[5 * 4 + 3]).toBeGreaterThan(0);
		expect(data[0]).toBe(10);
		expect(data[1]).toBe(20);
		expect(data[2]).toBe(30);
	});
});
