import type { APIRoute } from 'astro';
import { tools } from '../lib/tools';
import { prompts } from '../lib/prompts';
import { absoluteUrl } from '../lib/site';

export const prerender = true;

export const GET: APIRoute = () => {
	const paths = [
		'/',
		'/tentang/',
		'/privasi/',
		'/syarat/',
		'/lisensi/',
		...tools.map((tool) => `/tools/${tool.slug}/`),
		...prompts.map((prompt) => `/tools/prompt/${prompt.id}/`),
	];

	const urls = paths
		.map((path) => `  <url>\n    <loc>${absoluteUrl(path)}</loc>\n  </url>`)
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
