import type { ToolMeta } from './tool-types';
import { categories } from './tool-types';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

const modules = import.meta.glob<{ meta: ToolMeta }>('../features/*/meta.ts', {
	eager: true,
});

const toolUIs = import.meta.glob<{ default: AstroComponentFactory }>(
	'../features/*/tool.astro',
	{ eager: true },
);

const categoryOrder = new Map(categories.map((item, index) => [item.id, index]));

export const tools: ToolMeta[] = Object.values(modules)
	.map((module) => module.meta)
	.sort((a, b) => {
		const byCategory =
			(categoryOrder.get(a.category) ?? 99) - (categoryOrder.get(b.category) ?? 99);
		return byCategory !== 0 ? byCategory : a.name.localeCompare(b.name, 'id');
	});

export function getTool(slug: string): ToolMeta | undefined {
	return tools.find((tool) => tool.slug === slug);
}

export function getToolUI(slug: string): AstroComponentFactory | null {
	return toolUIs[`../features/${slug}/tool.astro`]?.default ?? null;
}

export function relatedTools(tool: ToolMeta, count = 3): ToolMeta[] {
	const sameCategory = tools.filter(
		(item) => item.slug !== tool.slug && item.category === tool.category,
	);
	const others = tools.filter(
		(item) => item.slug !== tool.slug && item.category !== tool.category,
	);
	return [...sameCategory, ...others].slice(0, count);
}
