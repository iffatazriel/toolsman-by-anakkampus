import { parsePageRange } from '../../lib/page-range';

export const PAGE_WINDOW = 12;

export function selectedPages(range: string, count: number) {
	const parsed = parsePageRange(range, count);
	return parsed.ok ? parsed.pages : [];
}

export function selectionToRange(pages: number[]) {
	const sorted = [...new Set(pages)].sort((a, b) => a - b);
	const parts: string[] = [];
	for (let index = 0; index < sorted.length; index++) {
		const start = sorted[index]!;
		let end = start;
		while (sorted[index + 1] === end + 1) end = sorted[++index]!;
		parts.push(start === end ? String(start) : `${start}-${end}`);
	}
	return parts.join(',');
}

export function toggleRange(range: string, count: number, page: number) {
	if (!Number.isInteger(page) || page < 1 || page > count) return range;
	const pages = new Set(selectedPages(range, count));
	if (pages.has(page)) pages.delete(page);
	else pages.add(page);
	return selectionToRange([...pages]);
}
