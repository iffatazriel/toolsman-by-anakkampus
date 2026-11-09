import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { notifyAbuse } from './abuse-webhook';

const report = {
	shareId: 'a'.repeat(32),
	fileCount: 3,
	reason: 'berisi malware',
	reportedAt: Date.UTC(2026, 10, 8, 3, 0, 0),
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('notifyAbuse', () => {
	it('tidak melakukan apa pun kalau URL webhook belum diatur', async () => {
		await expect(notifyAbuse(undefined, report)).resolves.toBe(false);
		await expect(notifyAbuse('', report)).resolves.toBe(false);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('mengirim link, jumlah berkas, waktu, dan alasan', async () => {
		await expect(notifyAbuse('https://contoh.test/hook', report)).resolves.toBe(true);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('https://contoh.test/hook');
		expect(init.method).toBe('POST');

		const body = JSON.parse(String(init.body)) as Record<string, unknown>;
		expect(body.shareId).toBe(report.shareId);
		expect(body.fileCount).toBe(3);
		expect(body.reason).toBe('berisi malware');
		expect(body.reportedAt).toBe(report.reportedAt);
	});

	it('tidak pernah mengirim kata sandi, nama berkas, atau isi berkas', async () => {
		await notifyAbuse('https://contoh.test/hook', report);

		const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
		const raw = String(init.body).toLowerCase();
		expect(raw).not.toContain('password');
		expect(raw).not.toContain('kata sandi');
		expect(raw).not.toContain('object_key');
		expect(raw).not.toContain('laporan.pdf');
		expect(Object.keys(JSON.parse(String(init.body))).sort()).toEqual([
			'fileCount',
			'reason',
			'reportedAt',
			'shareId',
		]);
	});

	it('tidak melempar error kalau webhook mati', async () => {
		fetchMock.mockRejectedValueOnce(new Error('jaringan mati'));
		await expect(notifyAbuse('https://contoh.test/hook', report)).resolves.toBe(false);
	});

	it('melaporkan gagal kalau webhook menolak', async () => {
		fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
		await expect(notifyAbuse('https://contoh.test/hook', report)).resolves.toBe(false);
	});
});
