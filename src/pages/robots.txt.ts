import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/site';

export const prerender = true;

export const GET: APIRoute = () => {
	const body = [
		'User-agent: *',
		'Allow: /',
		'Disallow: /s/',
		'Disallow: /api/',
		'',
		`Sitemap: ${absoluteUrl('/sitemap.xml')}`,
		'',
	].join('\n');

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
