import {fill,type Lang} from './i18n';
import dict from '../features/pdf/i18n';
export type PageRangeResult =
	| { ok: true; pages: number[] }
	| { ok: false; message: string };

export function parsePageRange(input: string, pageCount: number, lang: Lang = 'id'): PageRangeResult {
	const text = input.replace(/\s+/g, '');
	if (text === '') return { ok: false, message: dict[lang].rangeEmpty };

	const pages = new Set<number>();
	for (const part of text.split(',')) {
		if (part === '') return { ok: false, message: dict[lang].rangeComma };

		const match = /^(\d+)(?:-(\d+))?$/.exec(part);
		if (!match) return { ok: false, message: fill(dict[lang].rangeInvalid,{part}) };

		const from = Number(match[1]);
		const to = match[2] === undefined ? from : Number(match[2]);
		if (from < 1 || to < 1) return { ok: false, message: dict[lang].rangeStart };
		if (to < from) return { ok: false, message: fill(dict[lang].rangeReverse,{part}) };
		if (to > pageCount) {
			return { ok: false, message: fill(dict[lang].rangeCount,{count:pageCount}) };
		}
		for (let page = from; page <= to; page += 1) pages.add(page);
	}

	return { ok: true, pages: [...pages].sort((a, b) => a - b) };
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

export function reductionPercent(before: number, after: number): number {
	if (before <= 0) return 0;
	return Math.round(((before - after) / before) * 100);
}
