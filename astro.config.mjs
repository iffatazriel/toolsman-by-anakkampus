// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: (process.env.PUBLIC_SITE_URL ?? 'https://toolsman.anakkampus.workers.dev').replace(
		/\/+$/,
		'',
	),
	output: 'static',
	adapter: cloudflare({
		imageService: 'passthrough',
	}),
	integrations: [react()],
	vite: {
		plugins: [tailwindcss()],
		// Proyek ini tidak memakai PostCSS; Tailwind jalan lewat plugin Vite.
		// Config inline menghentikan pencarian postcss.config di luar folder proyek.
		css: {
			postcss: {},
		},
		// Jangan inline script kecil. CSP memblokir script inline, dan script
		// hasil build Astro harus tetap berupa file terpisah.
		build: {
			assetsInlineLimit: 0,
		},
	},
});
