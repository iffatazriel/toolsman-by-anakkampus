import { describe, expect, it } from 'vitest';
import { papers, planSheet } from './print-sheet';
import { outputPixels, photoSizes } from './sizes';

const photo = outputPixels(photoSizes[1]!);

describe('planSheet', () => {
	it('menyusun 3×3 pas foto 3×4 pada 4R', () => {
		const paper = papers.find((item) => item.id === '4r')!;
		const plan = planSheet(paper, photo.width, photo.height);
		expect(plan.count).toBe(9);
		expect(plan.columns).toBe(3);
		expect(plan.rows).toBe(3);
		expect(plan.rotated).toBe(false);
		expect(plan.placements).toHaveLength(9);
	});

	it('menjaga semua foto di dalam kertas', () => {
		const paper = papers.find((item) => item.id === '4r')!;
		const plan = planSheet(paper, photo.width, photo.height);
		for (const placement of plan.placements) {
			expect(placement.x).toBeGreaterThanOrEqual(0);
			expect(placement.y).toBeGreaterThanOrEqual(0);
			expect(placement.x + placement.width).toBeLessThanOrEqual(paper.widthPx);
			expect(placement.y + placement.height).toBeLessThanOrEqual(paper.heightPx);
		}
	});

	it('memberi jarak antar foto sesuai gap', () => {
		const paper = papers.find((item) => item.id === '4r')!;
		const plan = planSheet(paper, photo.width, photo.height);
		const first = plan.placements[0]!;
		const second = plan.placements[1]!;
		expect(second.x - (first.x + first.width)).toBe(plan.gap);
	});

	it('memuat lebih banyak foto di A4', () => {
		const paper4r = papers.find((item) => item.id === '4r')!;
		const a4 = papers.find((item) => item.id === 'a4')!;
		const small = planSheet(paper4r, photo.width, photo.height);
		const large = planSheet(a4, photo.width, photo.height);
		expect(large.count).toBeGreaterThan(small.count);
	});

	it('mengembalikan rencana kosong kalau foto lebih besar dari kertas', () => {
		const paper = papers.find((item) => item.id === '4r')!;
		const plan = planSheet(paper, paper.widthPx + 200, paper.heightPx + 200);
		expect(plan.count).toBe(0);
		expect(plan.placements).toHaveLength(0);
	});
});
