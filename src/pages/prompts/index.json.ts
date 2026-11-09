import type { APIRoute } from 'astro';
import { promptIndex } from '../../lib/prompts';

export const prerender = true;

// Indeks ringan: tanpa badan prompt. Hanya halaman /tools/prompt/ yang
// memintanya, jadi beranda tidak menanggung beratnya.
export const GET: APIRoute = () =>
	new Response(JSON.stringify(promptIndex), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
