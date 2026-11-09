import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasR2Config, headObject, presignUpload, presignDownload } from './r2';
import { qrDataUrl } from './qr';

const env = {
	R2_ACCOUNT_ID: 'akun',
	R2_ACCESS_KEY_ID: 'kunci',
	R2_SECRET_ACCESS_KEY: 'rahasia',
	R2_BUCKET: 'berkas',
};

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('presigned URL', () => {
	it('menunjuk objek di bucket yang benar', async () => {
		const url = new URL(
			await presignUpload(env, 'share/0-laporan.pdf', 'application/pdf', 1_000),
		);
		expect(url.origin).toBe('https://akun.r2.cloudflarestorage.com');
		expect(url.pathname).toBe('/berkas/share/0-laporan.pdf');
	});

	it('memakai masa berlaku 15 menit, bukan 24 jam bawaan', async () => {
		const upload = new URL(await presignUpload(env, 'a/b.pdf', 'application/pdf', 1_000));
		const download = new URL(await presignDownload(env, 'a/b.pdf', 'b.pdf'));
		expect(upload.searchParams.get('X-Amz-Expires')).toBe('900');
		expect(download.searchParams.get('X-Amz-Expires')).toBe('900');
	});

	it('ditandatangani dengan SigV4', async () => {
		const url = new URL(await presignUpload(env, 'a/b.pdf', 'application/pdf', 1_000));
		expect(url.searchParams.get('X-Amz-Algorithm')).toBe('AWS4-HMAC-SHA256');
		expect(url.searchParams.get('X-Amz-Signature')).toMatch(/^[0-9a-f]{64}$/);
	});

	it('tanda tangan berubah kalau berkasnya berbeda', async () => {
		const a = new URL(await presignUpload(env, 'a/satu.pdf', 'application/pdf', 1_000));
		const b = new URL(await presignUpload(env, 'a/dua.pdf', 'application/pdf', 1_000));
		expect(a.searchParams.get('X-Amz-Signature')).not.toBe(b.searchParams.get('X-Amz-Signature'));
	});

	it('mengikat ukuran berkas di tanda tangan unggahan', async () => {
		const url = new URL(await presignUpload(env, 'a/b.pdf', 'application/pdf', 1_234));
		const signed = url.searchParams.get('X-Amz-SignedHeaders') ?? '';
		expect(signed.split(';')).toContain('content-length');
	});

	it('tanda tangan unggahan berubah kalau ukurannya berbeda', async () => {
		const a = new URL(await presignUpload(env, 'a/b.pdf', 'application/pdf', 1_000));
		const b = new URL(await presignUpload(env, 'a/b.pdf', 'application/pdf', 2_000));
		expect(a.searchParams.get('X-Amz-Signature')).not.toBe(b.searchParams.get('X-Amz-Signature'));
	});

	it('memaksa unduhan sebagai lampiran dan bukan berkas yang dirender', async () => {
		const url = new URL(await presignDownload(env, 'a/0-halaman.html', '0-halaman.html'));
		expect(url.searchParams.get('response-content-disposition')).toBe(
			"attachment; filename*=UTF-8''0-halaman.html",
		);
		expect(url.searchParams.get('response-content-type')).toBe('application/octet-stream');
	});

	it('tanda tangan unduhan berubah kalau nama lampirannya berbeda', async () => {
		const a = new URL(await presignDownload(env, 'a/0-halaman.html', 'satu.html'));
		const b = new URL(await presignDownload(env, 'a/0-halaman.html', 'dua.html'));
		expect(a.searchParams.get('X-Amz-Signature')).not.toBe(b.searchParams.get('X-Amz-Signature'));
	});
});

describe('headObject', () => {
	it('mengembalikan ukuran objek dari HEAD', async () => {
		const fetchMock = vi.fn(
			async () => new Response(null, { status: 200, headers: { 'Content-Length': '1234' } }),
		);
		vi.stubGlobal('fetch', fetchMock);

		await expect(headObject(env, 'a/b.pdf')).resolves.toBe(1234);
		const [input, init] = fetchMock.mock.calls[0] as unknown as [
			Request,
			RequestInit | undefined,
		];
		expect(init?.method ?? input.method).toBe('HEAD');
		expect(String(input.url ?? input)).toContain('/berkas/a/b.pdf');
	});

	it('mengembalikan null kalau objek tidak ada', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 404 })));
		await expect(headObject(env, 'a/hilang.pdf')).resolves.toBeNull();
	});

	it('melempar error kalau penyimpanan menolak selain 404', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 403 })));
		await expect(headObject(env, 'a/b.pdf')).rejects.toThrow();
	});
});

describe('hasR2Config', () => {	it('menolak konfigurasi yang belum lengkap', () => {
		expect(hasR2Config(null)).toBe(false);
		expect(hasR2Config({ ...env, R2_BUCKET: '' })).toBe(false);
	});

	it('menerima konfigurasi lengkap', () => {
		expect(hasR2Config(env)).toBe(true);
	});
});

describe('qrDataUrl', () => {
	it('menghasilkan PNG data URL', async () => {
		const data = await qrDataUrl('https://toolsman.test/s/abc');
		expect(data.startsWith('data:image/png;base64,')).toBe(true);
		expect(data.length).toBeGreaterThan(200);
	});
});
