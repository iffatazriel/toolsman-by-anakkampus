import { expect, it } from 'vitest';
import { pngSize } from './png-size';

it('exports ordinary diagrams at 2x and bounds large or extreme diagrams', () => {
	expect(pngSize(700, 190)).toEqual({ width: 1400, height: 380 });
	for (const [w, h] of [[100000, 100], [20000, 20000], [1, 1000000], [1e100, 1e100]]) {
		const size = pngSize(w, h);
		expect(size.width).toBeGreaterThan(0); expect(size.height).toBeGreaterThan(0);
		expect(Math.max(size.width, size.height)).toBeLessThanOrEqual(16384);
		expect(size.width * size.height).toBeLessThanOrEqual(16_777_216);
	}
});

it('rejects invalid dimensions instead of creating an unusable canvas', () => {
	for (const [w, h] of [[0, 10], [-1, 10], [Infinity, 10], [10, NaN]]) expect(() => pngSize(w, h)).toThrow();
});
