import { afterEach, expect, it } from 'vitest';
import { parsePageRange } from '../../lib/page-range';
import { setCurrentLang, workspaceErrorMessage } from '../../lib/i18n';
import { editPdf } from './pdf-ops';
import { PDFDocument } from 'pdf-lib';

afterEach(() => setCurrentLang('id'));
it('translates empty and invalid ranges without changing valid pages', () => {
	expect(parsePageRange('', 3, 'en')).toMatchObject({ ok: false, message: expect.stringContaining('Enter pages') });
	expect(parsePageRange('0', 3, 'en')).toMatchObject({ ok: false, message: 'Page numbers start at 1.' });
	for (const input of ['1,,2', 'bad', '3-1', '4']) expect(parsePageRange(input, 3, 'en')).not.toEqual(parsePageRange(input, 3));
	expect(parsePageRange('1-3,2', 3, 'en')).toEqual(parsePageRange('1-3,2', 3));
});
it('keeps the remove-all-pages failure translatable', async () => {
	const doc = await PDFDocument.create(); doc.addPage();
	const bytes = await doc.save();
	try { await editPdf(bytes.buffer as ArrayBuffer, { rotations: [0], removed: [0] }); throw new Error('expected rejection'); }
	catch (error) { setCurrentLang('en'); expect(workspaceErrorMessage(error, '')).toBe('Keep at least one page.'); }
});
