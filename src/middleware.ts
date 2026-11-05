import { defineMiddleware } from 'astro:middleware';
import { securityHeadersFor } from './lib/security-headers';

// Halaman statis dilayani langsung oleh asset Worker, jadi header untuk halaman
// itu berasal dari public/_headers. Middleware ini menangani rute on-demand
// seperti /s/[id], /api/*, dan halaman Pas Foto yang butuh izin kamera.
export const onRequest = defineMiddleware(async (context, next) => {
	const response = await next();

	if (!import.meta.env.DEV) {
		const headers = securityHeadersFor(context.url.pathname);
		for (const [name, value] of Object.entries(headers)) {
			response.headers.set(name, value);
		}
	}

	return response;
});
