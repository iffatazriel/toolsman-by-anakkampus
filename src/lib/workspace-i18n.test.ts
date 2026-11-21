import { afterEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { currentLang, defineWorkspaceDictionary, registerWorkspaceDictionary, setCurrentLang, t, tr, type WorkspaceDictionary } from './i18n';
import { explainCron, previewCron } from '../features/cron/cron';
import { stripJpegMetadata, stripPngMetadata, stripMetadata } from '../features/hapus-exif/strip';

const dictionaries = import.meta.glob<{ default: WorkspaceDictionary }>('../features/*/i18n.ts', { eager: true });
afterEach(() => { vi.unstubAllGlobals(); setCurrentLang('id'); });

describe('workspace dictionaries', () => {
	it('reads saved English before the client initializes and supports a storage-blocked live toggle', () => {
		vi.stubGlobal('localStorage', { getItem: () => 'en', setItem: () => { throw new Error('blocked'); } });
		expect(currentLang()).toBe('en');
		const dict = defineWorkspaceDictionary({ value: 'Hasil {n}' }, { value: 'Result {n}' });
		expect(tr(dict, 'value', { n: 2 })).toBe('Result 2');
		setCurrentLang('id'); expect(tr(dict, 'value', { n: 2 })).toBe('Hasil 2');
	});
	it('localizes cron explanations and errors while keeping Indonesian as the pure helper default', () => {
		expect(explainCron('0 9 * * 1-5', 'en')).toBe('Runs every weekday at 09:00.');
		expect(explainCron('0 9 * * 0', 'en')).toBe('Runs every Sunday at 09:00.');
		expect(explainCron('0 0 1 1 *', 'en')).toBe('Runs on day 1 of January at 00:00.');
		expect(explainCron('0 9 * * *')).toBe('Jadwal berjalan setiap hari pukul 09.00.');
		expect(previewCron('', 'UTC', 5, new Date('2026-01-01'), 'en')).toEqual({ ok: false, error: 'A cron expression must have 5 fields.' });
		expect(previewCron('wrong * * * *', 'UTC', 5, new Date('2026-01-01'), 'en')).toEqual({ ok: false, error: 'Invalid expression or time zone. Check each field.' });
	});
	it('exposes stable translation keys for invalid and empty image inputs', () => {
		const bytes = new Uint8Array();
		expect(stripJpegMetadata(bytes).errorKey).toBe('notJpeg');
		expect(stripPngMetadata(bytes).errorKey).toBe('notPng');
		expect(stripMetadata(bytes).errorKey).toBe('unsupported');
	});
	it('requires identical ID/EN keys, nonempty values and matching interpolation variables for every dictionary', () => {
		expect(Object.keys(dictionaries).length).toBeGreaterThanOrEqual(2);
		for (const [path, { default: dict }] of Object.entries(dictionaries)) {
			expect(Object.keys(dict.en).sort(), path).toEqual(Object.keys(dict.id).sort());
			for (const key of Object.keys(dict.id)) {
				for (const lang of ['id', 'en'] as const) expect(dict[lang][key]?.trim(), `${path}:${lang}.${key}`).toBeTruthy();
				expect(dict.en[key]!.match(/\{\w+\}/g)?.sort() ?? []).toEqual(dict.id[key]!.match(/\{\w+\}/g)?.sort() ?? []);
			}
		}
	});
	it('uses the existing t namespace, preserves unknown keys and substitutes only provided variables', () => {
		const dict = defineWorkspaceDictionary({ value: 'Hasil {n}, {missing}' }, { value: 'Result {n}, {missing}' });
		registerWorkspaceDictionary('test', dict); setCurrentLang('en');
		expect(t('en', 'workspace.test.value')).toBe('Result {n}, {missing}');
		expect(tr(dict, 'value', { n: '<b>2</b>' })).toBe('Result <b>2</b>, {missing}');
		expect(t('en', 'workspace.unknown.value')).toBe('workspace.unknown.value');
	});
	it('type-checks key parity and dynamic translation keys', () => {
		// @ts-expect-error EN must include every ID key.
		defineWorkspaceDictionary({ one: 'Satu' }, {});
		// @ts-expect-error EN cannot introduce an extra key.
		defineWorkspaceDictionary({ one: 'Satu' }, { one: 'One', two: 'Two' });
		const dict = defineWorkspaceDictionary({ one: 'Satu' }, { one: 'One' });
		// @ts-expect-error Dynamic messages must use a known dictionary key.
		tr(dict, 'missing');
	});
	it('finds no remaining Indonesian copy candidates in migrated workspaces', () => {
		const slugs = Object.keys(dictionaries).map((path) => path.split('/').at(-2)!);
		const output = execFileSync(process.execPath, ['scripts/workspace-i18n-audit.mjs', '--check', ...slugs], { encoding: 'utf8' });
		for (const slug of slugs) expect(output).toContain(`${slug}: 0`);
	});
});
