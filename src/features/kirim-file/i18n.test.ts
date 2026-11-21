import { afterEach, describe, expect, it, vi } from 'vitest';
import { setCurrentLang, tr, workspaceErrorMessage } from '../../lib/i18n';
import { apiErrorKey } from './client-errors';
import { formatRemaining } from './format';
import dict from './i18n';
import { managementChanges, type ManageSnapshot } from './manage-view';
import { validateFile, validatePassword } from './share-rules';
import { postJson, UploadError } from './upload-client';

afterEach(() => { setCurrentLang('id'); vi.unstubAllGlobals(); });

describe('file sharing translations', () => {
	it('localizes countdown boundaries without changing the Indonesian helper default', () => {
		expect(formatRemaining(0, 'en')).toBe('0m remaining');
		expect(formatRemaining(-1, 'en')).toBe('0m remaining');
		expect(formatRemaining(3_600_000, 'en')).toBe('1h 0m remaining');
		expect(formatRemaining(86_400_000, 'en')).toBe('1d 0h remaining');
		expect(formatRemaining(0)).toBe('0 menit lagi');
	});
	it('localizes file and password validation while keeping user names unchanged', () => {
		expect(validateFile({ name: 'laporan.pdf', size: 1 }, 'en')).toBeNull();
		expect(validateFile({ name: '', size: 1 }, 'en')).toBe('The file name is empty.');
		expect(validateFile({ name: 'laporan.pdf', size: 0 }, 'en')).toBe('laporan.pdf is empty.');
		expect(validateFile({ name: 'laporan.exe', size: 1 }, 'en')).toContain('laporan.exe');
		expect(validateFile({ name: 'laporan.pdf', size: 101 * 1024 * 1024 }, 'en')).toContain('100 MB');
		expect(validateFile({ name: 'bad\u202efile.pdf', size: 1 }, 'en')).toContain('invalid');
		expect(validatePassword('', 'en')).toContain('at least 4');
		expect(validatePassword('a'.repeat(65), 'en')).toContain('64');
		expect(validatePassword('valid', 'en')).toBeNull();
	});
	it('maps HTTP statuses, ignores server-language payloads and retranslates retained errors live', async () => {
		for (const status of [400, 401, 403, 404, 409, 410, 413, 422, 429, 500, 503, 418]) {
			vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: 'Pesan server yang tidak ditampilkan.' }, { status })));
			let caught: unknown;
			try { await postJson('/api/shares/id/complete', {}); } catch (error) { caught = error; }
			expect(caught).toBeInstanceOf(UploadError);
			setCurrentLang('en');
			expect(workspaceErrorMessage(caught, '')).toBe(tr(dict, apiErrorKey(status), { status }));
			expect(workspaceErrorMessage(caught, '')).not.toContain('Pesan server');
			setCurrentLang('id');
			expect(workspaceErrorMessage(caught, '')).toBe(tr(dict, apiErrorKey(status), { status }));
		}
		expect(apiErrorKey(410, 'download')).toBe('downloadGone');
	});
	it('localizes notification changes and keeps empty/unchanged snapshots quiet', () => {
		const snapshot: ManageSnapshot = { status: 'ready', available: true, createdAt: 1, expiresAt: 10_000, protected: false, oneTime: false, downloads: 0, pendingCleanup: false, files: [] };
		const next = { ...snapshot, downloads: 2, available: false };
		expect(managementChanges(null, snapshot, 'en')).toEqual([]);
		expect(managementChanges(snapshot, snapshot, 'en')).toEqual([]);
		expect(managementChanges(snapshot, next, 'en')).toEqual(['New downloads for your share: 2.', 'Your share is now unavailable to recipients.']);
		expect(managementChanges(snapshot, next)[0]).toContain('2 unduhan baru');
	});
});
