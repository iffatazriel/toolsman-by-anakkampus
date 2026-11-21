import { afterEach, expect, it } from 'vitest';
import { setCurrentLang, tr } from '../../lib/i18n';
import { assemblePrompt, missingVariables } from './assemble';
import dict from './i18n';

afterEach(() => setCurrentLang('id'));

it('localizes normal, empty and failure feedback without translating prompt content', () => {
	const template = 'Ringkas {{laporan}} dengan kata-katamu.';
	const values = { laporan: 'Data pengguna' };
	const assembled = assemblePrompt(template, values);
	setCurrentLang('en');
	expect(tr(dict, 'detail.complete')).toBe('All variables are filled.');
	expect(tr(dict, 'detail.missing', { n: missingVariables(template, {}).length })).toBe('Variables still empty: 1.');
	expect(tr(dict, 'loadError')).toMatch(/reload/i);
	expect(assemblePrompt(template, values)).toBe(assembled);
	setCurrentLang('id');
	expect(tr(dict, 'detail.missing', { n: 1 })).toBe('1 variabel masih kosong.');
	expect(assemblePrompt(template, values)).toBe('Ringkas Data pengguna dengan kata-katamu.');
});
