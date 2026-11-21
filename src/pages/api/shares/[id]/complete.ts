import type { APIRoute } from 'astro';
import type { ShareFileRow, ShareRow } from '../../../../features/kirim-file/db';
import { isExpired } from '../../../../features/kirim-file/share-rules';
import { deleteObject, hasR2Config, headObject } from '../../../../features/kirim-file/r2';
import { verifyUploadedFiles } from '../../../../features/kirim-file/complete-share';
import { shareEnv } from '../../../../features/kirim-file/bindings';
import { logEvent } from '../../../../lib/server-log';

export const prerender = false;

const ID_PATTERN = /^[0-9a-f]{32}$/;

export const POST: APIRoute = async ({ params, request }) => {
	const env = shareEnv();
	if (!env) return new Response('Layanan belum dikonfigurasi.', { status: 503 });
	if (!hasR2Config(env)) {
		return new Response('Penyimpanan berkas belum diatur di server.', { status: 503 });
	}

	const id = params.id ?? '';
	if (!ID_PATTERN.test(id)) return new Response('Tidak ditemukan.', { status: 404 });

	let row: ShareRow | null = null;
	try {
		row = await env.DB.prepare('SELECT * FROM shares WHERE id = ?').bind(id).first<ShareRow>();
	} catch (error) {
		logEvent('warn', 'shares.complete_read_failed', { request, shareId: id }, error);
		return new Response('Data link tidak bisa dibaca.', { status: 503 });
	}

	if (!row || row.status === 'deleted' || row.takedown_at) {
		return new Response('Tidak ditemukan.', { status: 404 });
	}
	if (isExpired(row.expires_at, Date.now())) {
		return new Response('Link sudah kedaluwarsa.', { status: 410 });
	}

	let files: ShareFileRow[];
	try {
		const { results } = await env.DB.prepare(
			'SELECT * FROM share_files WHERE share_id = ? ORDER BY rowid',
		)
			.bind(id)
			.all<ShareFileRow>();
		files = results;
	} catch (error) {
		logEvent('warn', 'shares.complete_files_failed', { request, shareId: id }, error);
		return new Response('Daftar berkas tidak bisa dibaca.', { status: 503 });
	}
	if (files.length === 0) {
		return new Response('Tidak ada berkas untuk diselesaikan.', { status: 409 });
	}

	const check = await verifyUploadedFiles(files, {
		head: (key) => headObject(env, key),
		remove: (key) => deleteObject(env, key),
	}, { request, route: '/api/shares/:id/complete', shareId: id });

	if (!check.ok) {
		try {
			await env.DB.prepare("UPDATE shares SET status = 'deleted' WHERE id = ?").bind(id).run();
		} catch (error) {
			logEvent('warn', 'shares.complete_rollback_failed', { request, shareId: id }, error);
		}

		return Response.json(
			{
				error:
					'Unggahan tidak lengkap atau ukurannya tidak cocok. Link dinonaktifkan dan sisa berkas akan dibersihkan otomatis. Silakan unggah ulang.',
			},
			{ status: 409 },
		);
	}

	try {
		const updated = await env.DB.prepare("UPDATE shares SET status = ? WHERE id = ? AND status != 'deleted' AND takedown_at IS NULL RETURNING id").bind('ready', id).first<{ id: string }>();
		if (!updated) {
			return Response.json({ error: 'Kiriman sudah dihapus atau dinonaktifkan. Buat kiriman baru untuk mengunggah ulang.' }, { status: 410 });
		}
	} catch (error) {
		logEvent('error', 'shares.complete_failed', { request, shareId: id }, error);
		return new Response('Gagal menyelesaikan unggahan.', { status: 500 });
	}

	return Response.json({ ok: true });
};
