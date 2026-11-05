import type { APIRoute } from 'astro';
import type { ShareFileRow, ShareRow } from '../../../../features/kirim-file/db';
import { presignDownload, hasR2Config } from '../../../../features/kirim-file/r2';
import { isExpired } from '../../../../features/kirim-file/share-rules';
import { shareEnv } from '../../../../features/kirim-file/bindings';

export const prerender = false;

const ID_PATTERN = /^[0-9a-f]{32}$/;

export const GET: APIRoute = async ({ params }) => {
	const env = shareEnv();
	if (!env) return new Response('Layanan belum dikonfigurasi.', { status: 503 });

	const id = params.id ?? '';
	if (!ID_PATTERN.test(id)) return new Response('Tidak ditemukan.', { status: 404 });
	if (!hasR2Config(env)) {
		return Response.json({ error: 'Penyimpanan berkas belum diatur di server.' }, { status: 503 });
	}

	let row: ShareRow | null = null;
	try {
		row = await env.DB.prepare('SELECT * FROM shares WHERE id = ?').bind(id).first<ShareRow>();
	} catch {
		return Response.json({ error: 'Data link tidak bisa dibaca.' }, { status: 503 });
	}

	if (!row || row.status !== 'ready') {
		return Response.json({ error: 'Link tidak ditemukan atau sudah dihapus.' }, { status: 404 });
	}

	const now = Date.now();
	if (isExpired(row.expires_at, now)) {
		return Response.json({ error: 'Link sudah kedaluwarsa.', expired: true }, { status: 410 });
	}

	try {
		const { results } = await env.DB.prepare('SELECT * FROM share_files WHERE share_id = ?')
			.bind(id)
			.all<ShareFileRow>();

		const files = await Promise.all(
			results.map(async (file) => ({
				name: file.name,
				size: file.size,
				downloadUrl: await presignDownload(env, file.object_key),
			})),
		);

		return Response.json({
			id,
			expiresAt: row.expires_at,
			remainingMs: Math.max(0, row.expires_at - now),
			files,
		});
	} catch {
		return Response.json({ error: 'Gagal menyiapkan tautan unduh.' }, { status: 500 });
	}
};
