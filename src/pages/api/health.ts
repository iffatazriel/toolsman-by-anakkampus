import type { APIRoute } from 'astro';
import { shareEnv } from '../../features/kirim-file/bindings';
import { logEvent } from '../../lib/server-log';

export const prerender = false;

// Pemeriksaan sederhana untuk uptime monitor. Sengaja tidak mengembalikan
// pesan error, versi, atau nama tabel: cukup tahu layanan hidup atau tidak.
function ping(ok: boolean): Response {
	return Response.json(
		{ ok },
		{ status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
	);
}

export const GET: APIRoute = async ({ request }) => {
	const env = shareEnv();
	if (!env) { logEvent('warn', 'health.unconfigured', { request, route: '/api/health' }); return ping(false); }

	try {
		await env.DB.prepare('SELECT 1 AS ok').bind().first();
	} catch (error) {
		logEvent('error', 'health.db_failed', { request, route: '/api/health' }, error);
		return ping(false);
	}

	return ping(true);
};
