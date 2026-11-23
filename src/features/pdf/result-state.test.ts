import { describe, it, expect } from 'vitest';
import { currentResult, compareSizes, type WorkspaceResult } from './result-state';
import { classifyPdfError, supportedFile } from './file-errors';

describe('persistent PDF results', () => {
	const result: WorkspaceResult = { signature: 'files-and-options', name: 'result.pdf', pages: 3, files: [{ name: 'result.pdf', bytes: new Uint8Array([1, 2]), mime: 'application/pdf' }] };
	it('retains a result for unchanged inputs and language-only updates', () => {
		expect(currentResult(result, 'files-and-options')).toBe(result);
	});
	it('clears missing results and results from changed files/options', () => {
		expect(currentResult(undefined, 'files')).toBeUndefined();
		expect(currentResult(result, 'new-files-or-options')).toBeUndefined();
	});
	it('compares smaller, equal and larger outputs without rounding away the decision', () => {
		expect(compareSizes(1000, 750)).toEqual({ smaller: true, percent: 25, direction: 'smaller' });
		expect(compareSizes(1000, 1250)).toEqual({ smaller: false, percent: 25, direction: 'larger' });
		expect(compareSizes(1000, 1000)).toEqual({ smaller: false, percent: 0, direction: 'equal' });
		expect(compareSizes(100000, 99999).smaller).toBe(true);
		expect(compareSizes(0, 0).percent).toBe(0);
	});
});

describe('file error classification', () => {
	it.each(['PasswordException', 'EncryptedPDFError'])('classifies %s as locked', (name) => {
		const error = new Error('Cannot open file'); error.name = name;
		expect(classifyPdfError(error)).toBe('password');
	});
	it('distinguishes corrupt files from other failures', () => {
		expect(classifyPdfError(new Error('Invalid PDF structure'))).toBe('corrupt');
		expect(classifyPdfError(new Error('Failed to parse PDF header'))).toBe('corrupt');
		expect(classifyPdfError(new Error('Out of memory'))).toBe('processing');
		expect(classifyPdfError(null)).toBe('processing');
	});
	it('rejects non-PDF and unsupported images before adding', () => {
		expect(supportedFile({ name: 'notes.txt', type: 'text/plain' }, 'pdf')).toBe(false);
		expect(supportedFile({ name: 'fake.pdf', type: 'text/plain' }, 'pdf')).toBe(false);
		expect(supportedFile({ name: 'SCAN.PDF', type: '' }, 'pdf')).toBe(true);
		expect(supportedFile({ name: 'photo.JPG', type: 'image/jpeg' }, 'image')).toBe(true);
		expect(supportedFile({ name: 'photo.png', type: '' }, 'image')).toBe(true);
		expect(supportedFile({ name: 'photo.webp', type: 'image/webp' }, 'image')).toBe(false);
		expect(supportedFile({ name: 'icon.svg', type: 'image/svg+xml' }, 'image')).toBe(false);
	});
});
