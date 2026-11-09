import type { APIRoute } from 'astro';
import { allowRequest, clientIp } from '../../../../features/kirim-file/rate-limit';
import { shareEnv } from '../../../../features/kirim-file/bindings';
import { notifyAbuse } from '../../../../features/kirim-file/abuse-webhook';

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

	let fileCount = 0;
	try {
		const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM share_files WHERE share_id = ?')
			.bind(id)
			.first<{ n: number }>();
		fileCount = Number(row?.n ?? 0);
	} catch {
		fileCount = 0;
	}

	const now = Date.now();
	try {
		await env.DB.prepare('UPDATE shares SET reported = reported + 1 WHERE id = ?').bind(id).run();
		await env.DB.prepare('INSERT INTO reports (share_id, reason, created_at) VALUES (?, ?, ?)')
			.bind(id, reason, now)
			.run();
	} catch {
		return Response.json({ error: 'Laporan gagal disimpan.' }, { status: 503 });
	}

	// Kegagalan webhook tidak boleh menggagalkan laporan yang sudah tersimpan.
	await notifyAbuse(env.ABUSE_WEBHOOK_URL, {
		shareId: id,
		fileCount,
		reason,
		reportedAt: now,
	});

	return Response.json({ ok: true });
};
