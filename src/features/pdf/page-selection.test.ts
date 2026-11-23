import { describe, expect, it } from 'vitest';
import { parsePageRange } from '../../lib/page-range';
import { PAGE_WINDOW, selectedPages, selectionToRange, toggleRange } from './page-selection';

describe('range and thumbnail selection sync', () => {
	it('supports ranges, individual pages, duplicates, whitespace and original document order', () => {
		expect(selectedPages('5, 1-3, 2', 5)).toEqual([1, 2, 3, 5]);
		expect(selectionToRange([5, 3, 1, 2, 3])).toBe('1-3,5');
	});
	it('toggles pages in both directions without changing other selections', () => {
		expect(toggleRange('1-3,5', 5, 2)).toBe('1,3,5');
		expect(toggleRange('1,3,5', 5, 2)).toBe('1-3,5');
		expect(toggleRange('', 5, 4)).toBe('4');
		expect(toggleRange('4', 5, 4)).toBe('');
	});
	it('uses an empty selection for invalid ranges and lets a click start a valid selection', () => {
		for (const range of ['', '1,,3', '3-1', '0', '6', 'no']) {
			expect(selectedPages(range, 5)).toEqual([]);
			expect(toggleRange(range, 5, 2)).toBe('2');
		}
		expect(selectionToRange([])).toBe('');
		expect(toggleRange('1', 5, 0)).toBe('1');
		expect(toggleRange('1', 5, 6)).toBe('1');
	});
	it('round-trips every selection of a six-page document', () => {
		for (let mask = 1; mask < 64; mask++) {
			const pages = Array.from({ length: 6 }, (_, i) => i + 1).filter((_, i) => mask & (1 << i));
			expect(parsePageRange(selectionToRange(pages), 6)).toEqual({ ok: true, pages });
			for (let page = 1; page <= 6; page++) expect(toggleRange(toggleRange(selectionToRange(pages), 6, page), 6, page)).toBe(selectionToRange(pages));
		}
	});
	it('caps each rendered window independently of document length', () => {
		expect(PAGE_WINDOW).toBeLessThanOrEqual(24);
	});
});
