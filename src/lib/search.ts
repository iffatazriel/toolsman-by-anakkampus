import type { ToolMeta } from './tool-types';

export function normalize(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim();
}

export function matches(haystack: string[], query: string): boolean {
	const words = normalize(query).split(/\s+/).filter(Boolean);
	if (words.length === 0) return true;
	const fields = haystack.map(normalize);
	return words.every((word) => fields.some((field) => field.includes(word)));
}

export function searchableFields(tool: ToolMeta): string[] {
	return [tool.name, tool.category, tool.tagline, ...tool.keywords];
}
