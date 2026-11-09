import type { APIRoute } from 'astro';
import { prompts } from '../../lib/prompts';

export const prerender = true;

export function getStaticPaths() {
	return prompts.map((prompt) => ({ params: { id: prompt.id } }));
}

export const GET: APIRoute = ({ params }) => {
	const prompt = prompts.find((item) => item.id === params.id);
	if (!prompt) return new Response('Not found', { status: 404 });

	return new Response(
		JSON.stringify({
			...prompt,
			url: `/tools/prompt/${prompt.id}/`,
		}),
		{
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Cache-Control': 'public, max-age=3600',
			},
		},
	);
};
