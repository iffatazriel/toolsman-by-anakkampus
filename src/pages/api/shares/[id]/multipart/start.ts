import type { APIRoute } from 'astro';
import { shareEnv } from '../../../../../features/kirim-file/bindings';
import { PART_SIZE, partCount } from '../../../../../features/kirim-file/multipart';
import {
	SHARE_ID_PATTERN,
	json,
	loadUploadFile,
	loadUploadingShare,
} from '../../../../../features/kirim-file/multipart-server';
import { createMultipartUpload, hasR2Config } from '../../../../../features/kirim-file/r2';

export const prerender = false;

export const POST: APIRoute = async ({ request, params }) => {
	const env = shareEnv();
	if (!env) return json({ error: 'Layanan belum dikonfigurasi.' }, 503);
	if (!hasR2Config(env)) {
		return json({ error: 'Penyimpanan berkas belum diatur di server.' }, 503);
	}

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
	if (!share) return json({ error: 'Link tidak bisa diunggah lagi.' }, 404);

	const file = await loadUploadFile(env, id, index);
	if (!file) return json({ error: 'Berkas tidak ditemukan.' }, 404);

	try {
		let uploadId = file.upload_id;
		if (!uploadId) {
			uploadId = await createMultipartUpload(
				env,
				file.object_key,
				file.mime || 'application/octet-stream',
			);
			await env.DB.prepare(
				'UPDATE share_files SET upload_id = ? WHERE share_id = ? AND file_index = ?',
			)
				.bind(uploadId, id, index)
				.run();
		}

		const completed = await env.DB.prepare(
			'SELECT part_number FROM upload_parts WHERE share_id = ? AND file_index = ? ORDER BY part_number',
		)
			.bind(id, index)
			.all<{ part_number: number }>();

		return json({
			chunkSize: PART_SIZE,
			partCount: partCount(file.size),
			completed: completed.results.map((row) => row.part_number),
		});
	} catch (error) {
		console.error('Gagal menyiapkan multipart:', error);
		return json({ error: 'Server gagal menyiapkan unggahan.' }, 500);
	}
};
