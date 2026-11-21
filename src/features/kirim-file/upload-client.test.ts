import { afterEach, describe, expect, it, vi } from 'vitest';
import { postJson } from './upload-client';

afterEach(() => vi.unstubAllGlobals());

describe('completion response shown by uploader', () => {
	it('reads successful completion JSON', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true })));
		await expect(postJson('/api/shares/id/complete', {})).resolves.toEqual({ ok: true });
	});
	it('preserves the deleted-share message and status for the uploader error display', async () => {
		const error = 'Kiriman sudah dihapus atau dinonaktifkan. Buat kiriman baru untuk mengunggah ulang.';
		vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error }, { status: 410 })));
		await expect(postJson('/api/shares/id/complete', {})).rejects.toMatchObject({ name: 'UploadError', message: error, status: 410 });
	});
	it('uses a readable fallback when the error response is empty or not JSON', async () => {
		for (const body of ['', 'Server unavailable']) {
			vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status: 503 })));
			await expect(postJson('/api/shares/id/complete', {})).rejects.toMatchObject({ name: 'UploadError', message: 'Permintaan gagal (503).', status: 503 });
		}
	});
});
