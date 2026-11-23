import { describe, expect, it } from 'vitest';
import { describeAction, type ActionState, type PdfMode } from './workspace-state';

const ready: ActionState = {
	files: 3, pages: 8, selected: 2, hasFile: true, pending: false,
	failed: false, busy: false, changed: true, rangeValid: true,
};
const modes: PdfMode[] = ['gabung', 'pisah', 'kompres', 'gambar', 'ke-gambar', 'halaman'];

describe('PDF action summaries', () => {
	it('describes the selected files/pages independently of the action label', () => {
		expect(describeAction('gabung', ready, 'id')).toEqual({ summary: 'Gabung 3 file · 8 halaman', reason: null });
		expect(describeAction('gabung', ready, 'en')).toEqual({ summary: 'Merge 3 files · 8 pages', reason: null });
		expect(describeAction('pisah', { ...ready, pages: 5 }, 'id')).toEqual({ summary: 'Pisah: 2 dari 5 halaman', reason: null });
		expect(describeAction('pisah', { ...ready, pages: 5 }, 'en').summary).toBe('Split: 2 of 5 pages');
	});
	it.each(modes)('has translated ready, empty, reading, error and busy states for %s', (mode) => {
		const empty = { ...ready, files: 0, pages: 0, selected: 0, hasFile: false, changed: false, rangeValid: false };
		for (const lang of ['id', 'en'] as const) {
			expect(describeAction(mode, ready, lang).reason).toBeNull();
			for (const state of [empty, { ...ready, pending: true }, { ...ready, failed: true }, { ...ready, busy: true }]) {
				const result = describeAction(mode, state, lang);
				expect(result.reason).toBeTruthy();
				expect(result.reason).not.toBe(describeAction(mode, state, lang === 'id' ? 'en' : 'id').reason);
			}
		}
	});
	it('keeps a one-file merge disabled and prioritizes unreadable files', () => {
		expect(describeAction('gabung', { ...ready, files: 1 }, 'en').reason).toBe('Add at least 2 PDFs');
		expect(describeAction('gabung', { ...ready, failed: true }, 'en').reason).toContain('Remove or replace');
	});
	it('explains incomplete ranges and unchanged or fully removed pages', () => {
		expect(describeAction('pisah', { ...ready, rangeValid: false }, 'en').reason).toContain('Enter pages');
		expect(describeAction('halaman', { ...ready, changed: false }, 'en').reason).toContain('Rotate or remove');
		expect(describeAction('halaman', { ...ready, selected: 0 }, 'en').reason).toBe('Keep at least one page.');
	});
});
