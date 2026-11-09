import type { APIRoute } from 'astro';
import { shareEnv } from '../../features/kirim-file/bindings';

export const prerender = false;

// Pemeriksaan sederhana untuk uptime monitor. Sengaja tidak mengembalikan
// pesan error, versi, atau nama tabel: cukup tahu layanan hidup atau tidak.
function ping(ok: boolean): Response {
	return Response.json(
		{ ok },
		{ status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
	);
}

export const GET: APIRoute = async () => {
	const env = shareEnv();
	if (!env) return ping(false);

	try {
		await env.DB.prepare('SELECT 1 AS ok').bind().first();
	} catch (error) {
		console.error('Health check D1 gagal:', error);
		return ping(false);
	}

	return ping(true);
};
