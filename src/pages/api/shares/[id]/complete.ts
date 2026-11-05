import type { APIRoute } from 'astro';
import type { ShareRow } from '../../../../features/kirim-file/db';
import { isExpired } from '../../../../features/kirim-file/share-rules';
import { shareEnv } from '../../../../features/kirim-file/bindings';

export const prerender = false;

const ID_PATTERN = /^[0-9a-f]{32}$/;

export const POST: APIRoute = async ({ params }) => {
	const env = shareEnv();
	if (!env) return new Response('Layanan belum dikonfigurasi.', { status: 503 });

	const id = params.id ?? '';
	if (!ID_PATTERN.test(id)) return new Response('Tidak ditemukan.', { status: 404 });

	let row: ShareRow | null = null;
	try {
		row = await env.DB.prepare('SELECT * FROM shares WHERE id = ?').bind(id).first<ShareRow>();
	} catch {
		return new Response('Data link tidak bisa dibaca.', { status: 503 });
	}

	if (!row || row.status === 'deleted') return new Response('Tidak ditemukan.', { status: 404 });

	try {
		await env.DB.prepare('UPDATE shares SET status = ? WHERE id = ?').bind('ready', id).run();
	} catch {
		return new Response('Gagal menyelesaikan unggahan.', { status: 500 });
	}
	return Response.json({ ok: true, expired: isExpired(row.expires_at, Date.now()) });
};
