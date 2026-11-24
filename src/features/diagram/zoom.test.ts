import { expect, it } from 'vitest';
import { diagramScale } from './zoom';

it('starts readable, fits explicitly, resets and bounds zoom', () => {
	expect(diagramScale('initial', 1, 280, 700)).toBe(0.75);
	expect(diagramScale('fit', 1, 280, 700)).toBe(0.4);
	expect(diagramScale('initial', 1, 900, 700)).toBe(1);
	expect(diagramScale('reset', 3, 280, 700)).toBe(1);
	expect(diagramScale('in', 4, 280, 700)).toBe(4);
	expect(diagramScale('out', 0.1, 280, 700)).toBe(0.1);
});

it('handles empty or invalid measurements', () => {
	for (const width of [0, -1, NaN]) expect(diagramScale('fit', 1, 280, width)).toBe(1);
	expect(diagramScale('initial', 1, 0, 700)).toBe(1);
});
