import type { APIRoute } from 'astro';
import { allowRequest, clientIp } from '../../../../features/kirim-file/rate-limit';
import { shareEnv } from '../../../../features/kirim-file/bindings';

export const prerender = false;

const ID_PATTERN = /^[0-9a-f]{32}$/;

export const POST: APIRoute = async ({ params, request }) => {
	const env = shareEnv();
	if (!env) return new Response('Layanan belum dikonfigurasi.', { status: 503 });

	if (!(await allowRequest(env.REPORT_LIMIT, clientIp(request)))) {
		return Response.json({ error: 'Terlalu sering melapor. Coba lagi nanti.' }, { status: 429 });
	}

	const id = params.id ?? '';
	if (!ID_PATTERN.test(id)) return new Response('Tidak ditemukan.', { status: 404 });

	let reason = '';
	try {
		const body = (await request.json()) as { reason?: unknown };
		reason = typeof body.reason === 'string' ? body.reason.slice(0, 500) : '';
	} catch {
		reason = '';
	}

	try {
		await env.DB.prepare('UPDATE shares SET reported = reported + 1 WHERE id = ?').bind(id).run();
		await env.DB.prepare('INSERT INTO reports (share_id, reason, created_at) VALUES (?, ?, ?)')
			.bind(id, reason, Date.now())
			.run();
	} catch {
		return Response.json({ error: 'Laporan gagal disimpan.' }, { status: 503 });
	}

	return Response.json({ ok: true });
};
