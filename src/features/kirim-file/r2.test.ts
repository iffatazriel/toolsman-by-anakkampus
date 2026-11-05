import { describe, expect, it } from 'vitest';
import { hasR2Config, presignUpload, presignDownload } from './r2';
import { qrDataUrl } from './qr';

const env = {
	R2_ACCOUNT_ID: 'akun',
	R2_ACCESS_KEY_ID: 'kunci',
	R2_SECRET_ACCESS_KEY: 'rahasia',
	R2_BUCKET: 'berkas',
};

describe('presigned URL', () => {
	it('menunjuk objek di bucket yang benar', async () => {
		const url = new URL(await presignUpload(env, 'share/0-laporan.pdf', 'application/pdf'));
		expect(url.origin).toBe('https://akun.r2.cloudflarestorage.com');
		expect(url.pathname).toBe('/berkas/share/0-laporan.pdf');
	});

	it('memakai masa berlaku 15 menit, bukan 24 jam bawaan', async () => {
		const upload = new URL(await presignUpload(env, 'a/b.pdf', 'application/pdf'));
		const download = new URL(await presignDownload(env, 'a/b.pdf'));
		expect(upload.searchParams.get('X-Amz-Expires')).toBe('900');
		expect(download.searchParams.get('X-Amz-Expires')).toBe('900');
	});

	it('ditandatangani dengan SigV4', async () => {
		const url = new URL(await presignUpload(env, 'a/b.pdf', 'application/pdf'));
		expect(url.searchParams.get('X-Amz-Algorithm')).toBe('AWS4-HMAC-SHA256');
		expect(url.searchParams.get('X-Amz-Signature')).toMatch(/^[0-9a-f]{64}$/);
	});

	it('tanda tangan berubah kalau berkasnya berbeda', async () => {
		const a = new URL(await presignUpload(env, 'a/satu.pdf', 'application/pdf'));
		const b = new URL(await presignUpload(env, 'a/dua.pdf', 'application/pdf'));
		expect(a.searchParams.get('X-Amz-Signature')).not.toBe(b.searchParams.get('X-Amz-Signature'));
	});
});

describe('hasR2Config', () => {
	it('menolak konfigurasi yang belum lengkap', () => {
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
