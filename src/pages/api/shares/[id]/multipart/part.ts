import type { APIRoute } from 'astro';
import { shareEnv } from '../../../../../features/kirim-file/bindings';
import { partRange, partSize } from '../../../../../features/kirim-file/multipart';
import {
	SHARE_ID_PATTERN,
	json,
	loadUploadFile,
	loadUploadingShare,
} from '../../../../../features/kirim-file/multipart-server';
import { hasR2Config, uploadPart } from '../../../../../features/kirim-file/r2';

export const prerender = false;

export const PUT: APIRoute = async ({ request, params, url }) => {
	const env = shareEnv();
	if (!env) return json({ error: 'Layanan belum dikonfigurasi.' }, 503);
	if (!hasR2Config(env)) {
		return json({ error: 'Penyimpanan berkas belum diatur di server.' }, 503);
	}

	const id = params.id ?? '';
	if (!SHARE_ID_PATTERN.test(id)) return json({ error: 'Tidak ditemukan.' }, 404);

	const index = Number(url.searchParams.get('index'));
	const partNumber = Number(url.searchParams.get('part'));
	if (!Number.isInteger(index) || index < 0 || index > 9 || !Number.isInteger(partNumber)) {
		return json({ error: 'Bagian tidak dikenal.' }, 400);
	}

	const share = await loadUploadingShare(env, id);
	if (!share) return json({ error: 'Link tidak bisa diunggah lagi.' }, 404);

	const file = await loadUploadFile(env, id, index);
	if (!file) return json({ error: 'Berkas tidak ditemukan.' }, 404);
	if (!file.upload_id) return json({ error: 'Unggahan belum dimulai.' }, 409);

	let expected: { start: number; end: number };
	try {
		expected = partRange(file.size, partNumber);
	} catch {
		return json({ error: 'Bagian di luar jangkauan.' }, 400);
	}

	const data = await request.arrayBuffer();
	const wanted = partSize(file.size, partNumber);
	if (data.byteLength !== wanted) {
		return json(
			{
				error: `Ukuran bagian tidak cocok. Diharapkan ${wanted} byte, diterima ${data.byteLength}.`,
			},
			400,
		);
	}

	try {
		const etag = await uploadPart(env, file.object_key, file.upload_id, partNumber, data);
		await env.DB.prepare(
			`INSERT INTO upload_parts (share_id, file_index, part_number, etag, size)
			 VALUES (?, ?, ?, ?, ?)
			 ON CONFLICT(share_id, file_index, part_number)
			 DO UPDATE SET etag = excluded.etag, size = excluded.size`,
		)
			.bind(id, index, partNumber, etag, wanted)
			.run();

		return json({ ok: true, partNumber, size: wanted, start: expected.start });
	} catch (error) {
		console.error('Gagal mengunggah bagian:', error);
		return json({ error: 'Bagian gagal disimpan. Coba lagi.' }, 500);
	}
};
