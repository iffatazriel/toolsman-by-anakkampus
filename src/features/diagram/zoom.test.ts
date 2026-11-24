import { expect, it } from 'vitest';
import { diagramScale } from './zoom';

it('starts readable, fits explicitly, resets and bounds zoom', () => {
	expect(diagramScale('initial', 1, 280, 700)).toBe(1);
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

it('never zooms out above a fit smaller than ten percent', () => {
	const fit = diagramScale('fit', 1, 280, 10000);
	expect(fit).toBeCloseTo(0.028);
	expect(diagramScale('out', fit, 280, 10000)).toBeLessThanOrEqual(fit);
	expect(diagramScale('in', fit, 280, 10000)).toBeCloseTo(fit * 1.25);
	expect(diagramScale('out', 0.02, 280, 700)).toBe(0.02);
});

it('recomputes fit for changed viewport widths', () => {
	expect(diagramScale('fit', 1, 280, 700)).toBe(0.4);
	expect(diagramScale('fit', 0.4, 560, 700)).toBe(0.8);
});

it('keeps automatic views at readable intrinsic size even for very wide diagrams', () => {
	expect(diagramScale('initial', 1, 280, 10000)).toBe(1);
	expect(diagramScale('fit', 1, 280, 10000)).toBe(0.028);
});
