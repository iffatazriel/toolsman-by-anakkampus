import { defineMiddleware } from 'astro:middleware';
import { securityHeadersFor } from './lib/security-headers';
import { logEvent } from './lib/server-log';

// Halaman statis dilayani langsung oleh asset Worker, jadi header untuk halaman
// itu berasal dari public/_headers. Middleware ini menangani rute on-demand
// seperti /s/[id], /api/*, dan halaman Pas Foto yang butuh izin kamera.
export const onRequest = defineMiddleware(async (context, next) => {
	let response: Response;
	try {
		response = await next();
	} catch (error) {
		if (context.url.pathname !== '/api' && !context.url.pathname.startsWith('/api/')) throw error;
		logEvent('error', 'api.unhandled', { request: context.request, shareId: context.params.id }, error);
		response = Response.json({ error: 'Server mengalami kendala. Coba lagi sebentar.' }, {
			status: 500, headers: { 'Cache-Control': 'no-store' },
		});
	}

	if (!import.meta.env.DEV) {
		const headers = securityHeadersFor(context.url.pathname);
		for (const [name, value] of Object.entries(headers)) {
			response.headers.set(name, value);
		}
	}

	return response;
});
