import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyTurnstile } from './turnstile';

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	fetchMock = vi.fn(async () => Response.json({ success: true }));
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('verifyTurnstile', () => {
	it('melewati verifikasi kalau secret belum diatur (dev lokal)', async () => {
		await expect(verifyTurnstile(undefined, '', '1.2.3.4')).resolves.toBe(true);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('menolak token kosong saat secret diatur', async () => {
		await expect(verifyTurnstile('rahasia', '', '1.2.3.4')).resolves.toBe(false);
		await expect(verifyTurnstile('rahasia', null, '1.2.3.4')).resolves.toBe(false);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('menerima token yang disetujui Cloudflare', async () => {
		await expect(verifyTurnstile('rahasia', 'token', '1.2.3.4')).resolves.toBe(true);
		const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		const body = init.body as URLSearchParams;
		expect(body.get('secret')).toBe('rahasia');
		expect(body.get('response')).toBe('token');
		expect(body.get('remoteip')).toBe('1.2.3.4');
	});

	it('menolak token yang ditolak Cloudflare', async () => {
		fetchMock.mockResolvedValueOnce(Response.json({ success: false }));
		await expect(verifyTurnstile('rahasia', 'token', '1.2.3.4')).resolves.toBe(false);
	});

	it('menolak kalau jaringan gagal, bukan meloloskan', async () => {
		fetchMock.mockRejectedValueOnce(new Error('offline'));
		await expect(verifyTurnstile('rahasia', 'token', 'unknown')).resolves.toBe(false);
	});
});
