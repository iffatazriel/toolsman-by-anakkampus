import { describe, expect, it } from 'vitest';
import { cmToPixels, cropForFace, outputPixels, photoSizes } from './sizes';

describe('ukuran cetak 300 DPI', () => {
	it('mengubah cm ke piksel', () => {
		expect(cmToPixels(2.54)).toBe(300);
		expect(cmToPixels(3)).toBe(354);
	});

	it('menghasilkan 2x3, 3x4, dan 4x6 cm dengan benar', () => {
		expect(outputPixels(photoSizes[0]!)).toEqual({ width: 236, height: 354 });
		expect(outputPixels(photoSizes[1]!)).toEqual({ width: 354, height: 472 });
		expect(outputPixels(photoSizes[2]!)).toEqual({ width: 472, height: 709 });
	});
});

describe('cropForFace', () => {
	const size = photoSizes[1]!;

	it('menjaga rasio ukuran pas foto', () => {
		const crop = cropForFace({ x: 400, y: 300, width: 200, height: 260 }, size, 1200, 1600);
		expect(crop.width / crop.height).toBeCloseTo(3 / 4, 3);
	});

	it('tetap di dalam gambar', () => {
		const crop = cropForFace({ x: 0, y: 0, width: 300, height: 380 }, size, 800, 1000);
		expect(crop.x).toBeGreaterThanOrEqual(0);
		expect(crop.y).toBeGreaterThanOrEqual(0);
		expect(crop.x + crop.width).toBeLessThanOrEqual(800 + 1e-6);
		expect(crop.y + crop.height).toBeLessThanOrEqual(1000 + 1e-6);
	});

	it('menempatkan wajah di tengah secara horizontal', () => {
		const face = { x: 500, y: 300, width: 200, height: 260 };
		const crop = cropForFace(face, size, 1200, 1600);
		const center = crop.x + crop.width / 2;
		expect(center).toBeCloseTo(face.x + face.width / 2, 0);
	});

	it('memperbesar dengan zoom', () => {
		const face = { x: 400, y: 300, width: 200, height: 260 };
		const normal = cropForFace(face, size, 1200, 1600, 1);
		const zoomed = cropForFace(face, size, 1200, 1600, 2);
		expect(zoomed.height).toBeLessThan(normal.height);
	});
});
