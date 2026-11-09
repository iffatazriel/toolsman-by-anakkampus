import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

// Sengaja dipisah dari tools.ts dan tidak eager: setiap tool.astro membawa CSS
// dan komponennya sendiri. Kalau glob ini ikut modul yang diimpor beranda,
// semua CSS alat (termasuk Excalidraw) ikut ter-link di beranda.
const toolUIs = import.meta.glob<{ default: AstroComponentFactory }>(
	'../features/*/tool.astro',
);

export async function getToolUI(slug: string): Promise<AstroComponentFactory | null> {
	const load = toolUIs[`../features/${slug}/tool.astro`];
	if (!load) return null;
	const module = await load();
	return module.default ?? null;
}
