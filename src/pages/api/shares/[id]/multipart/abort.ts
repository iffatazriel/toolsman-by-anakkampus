import type { APIRoute } from 'astro';
import { shareEnv } from '../../../../../features/kirim-file/bindings';
import {
	SHARE_ID_PATTERN,
	json,
	loadUploadFile,
	loadUploadingShare,
} from '../../../../../features/kirim-file/multipart-server';
import { abortMultipartUpload } from '../../../../../features/kirim-file/r2';

export const prerender = false;

export const POST: APIRoute = async ({ request, params }) => {
	const env = shareEnv();
	if (!env) return json({ error: 'Layanan belum dikonfigurasi.' }, 503);

	const id = params.id ?? '';
	if (!SHARE_ID_PATTERN.test(id)) return json({ error: 'Tidak ditemukan.' }, 404);

	let index = Number.NaN;
	try {
		const body = (await request.json()) as { index?: unknown };
		index = Number(body.index);
	} catch {
		return json({ error: 'Permintaan tidak valid.' }, 400);
	}
	if (!Number.isInteger(index) || index < 0 || index > 9) {
		return json({ error: 'Berkas tidak dikenal.' }, 400);
	}

	const share = await loadUploadingShare(env, id);
	if (!share) return json({ error: 'Link tidak bisa diubah lagi.' }, 404);

	const file = await loadUploadFile(env, id, index);
	if (!file) return json({ error: 'Berkas tidak ditemukan.' }, 404);

	try {
		if (file.upload_id) {
			await abortMultipartUpload(env, file.object_key, file.upload_id);
		}
		await env.DB.prepare(
			'DELETE FROM upload_parts WHERE share_id = ? AND file_index = ?',
		)
			.bind(id, index)
			.run();
		await env.DB.prepare(
			'UPDATE share_files SET upload_id = NULL WHERE share_id = ? AND file_index = ?',
		)
			.bind(id, index)
			.run();

		return json({ ok: true });
	} catch (error) {
		console.error('Gagal membatalkan multipart:', error);
		return json({ error: 'Gagal membatalkan unggahan.' }, 500);
	}
};
