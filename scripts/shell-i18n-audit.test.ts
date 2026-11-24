import { expect, it } from 'vitest';
import { auditShell, shellCandidates } from './shell-i18n-audit.mjs';

it('keeps the static shell translated and detects new untranslated paragraphs', () => {
	expect(auditShell()).toEqual([]);
	expect(shellCandidates('<p>Halaman baru untuk kamu</p>')).toEqual(['Halaman baru untuk kamu']);
	expect(shellCandidates('<p>Privacy policy</p>')).toEqual([]);
	expect(shellCandidates('<code>kata dan kode</code><p>Kebijakan Privasi</p>')).toEqual([]);
});
