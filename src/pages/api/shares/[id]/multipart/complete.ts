import type { APIRoute } from 'astro';
import { shareEnv } from '../../../../../features/kirim-file/bindings';
import { partCount } from '../../../../../features/kirim-file/multipart';
import {
	SHARE_ID_PATTERN,
	json,
	loadUploadFile,
	loadUploadingShare,
} from '../../../../../features/kirim-file/multipart-server';
import { completeMultipartUpload } from '../../../../../features/kirim-file/r2';

export const prerender = false;

interface PartRow {
	part_number: number;
	etag: string;
	size: number;
}

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
	if (!share) return json({ error: 'Link tidak bisa diunggah lagi.' }, 404);

	const file = await loadUploadFile(env, id, index);
	if (!file) return json({ error: 'Berkas tidak ditemukan.' }, 404);
	if (!file.upload_id) return json({ error: 'Unggahan belum dimulai.' }, 409);

	const rows = await env.DB.prepare(
		'SELECT part_number, etag, size FROM upload_parts WHERE share_id = ? AND file_index = ? ORDER BY part_number',
	)
		.bind(id, index)
		.all<PartRow>();

	const expected = partCount(file.size);
	const parts = rows.results;
	if (parts.length !== expected) {
		return json({ error: 'Bagian unggahan belum lengkap.' }, 409);
	}

	const seen = new Set<number>();
	for (const part of parts) {
		if (!Number.isInteger(part.part_number) || part.part_number < 1 || part.part_number > expected) {
			return json({ error: 'Nomor bagian tidak valid.' }, 409);
		}
		seen.add(part.part_number);
	}
	if (seen.size !== expected) {
		return json({ error: 'Ada bagian yang hilang.' }, 409);
	}

	const total = parts.reduce((sum, part) => sum + part.size, 0);
	if (total !== file.size) {
		return json({ error: 'Ukuran unggahan tidak cocok dengan berkas asli.' }, 409);
	}

	try {
		await completeMultipartUpload(
			env,
			file.object_key,
			file.upload_id,
			parts.map((part) => ({ partNumber: part.part_number, etag: part.etag })),
		);
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
		console.error('Gagal menyelesaikan multipart:', error);
		return json({ error: 'Gagal menyelesaikan unggahan. Coba lagi.' }, 500);
	}
};
