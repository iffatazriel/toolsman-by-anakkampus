import { WorkspaceError } from '../../lib/i18n';
import dict from './i18n';
import { escapeHtml } from '../../lib/html';

export interface Author { first: string; last: string }
export interface Entry {
	id: string; type: 'book' | 'journal' | 'web'; authors: Author[]; year: string; title: string;
	publisher: string; volume: string; issue: string; pages: string; doi: string; url: string; accessed: string;
}
export type Style = 'apa' | 'ieee';
const initials = (name: string) => name.trim().split(/[\s-]+/).filter(Boolean).map((part) => `${Array.from(part)[0]!.toUpperCase()}.`).join(' ');
const authorName = (a: Author, style: Style) => style === 'apa'
	? [a.last.trim(), initials(a.first)].filter(Boolean).join(', ')
	: [initials(a.first), a.last.trim()].filter(Boolean).join(' ');
const names = (e: Entry, style: Style) => {
	const all = e.authors.filter((a) => a.last.trim()).map((a) => authorName(a, style));
	if (style === 'ieee' && all.length > 6) return `${all[0]} et al.`;
	if (style === 'apa' && all.length > 20) return `${all.slice(0, 19).join(', ')}, … ${all.at(-1)}`;
	if (all.length < 2) return all[0] ?? '';
	return `${all.slice(0, -1).join(', ')}${all.length > 2 ? ',' : ''} ${style === 'apa' ? '&' : 'and'} ${all.at(-1)}`;
};
const period = (s: string) => /[.!?]$/.test(s) ? s : `${s}.`;
const doiUrl = (s: string) => `https://doi.org/${s.trim().replace(/^(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)/i, '')}`;
const dateText = (s: string) => new Date(`${s}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

export function validateEntry(e: Entry): void {
	if (!e.title.trim()) throw new WorkspaceError(dict, 'titleError');
	if (e.year && !/^\d{4}$/.test(e.year)) throw new WorkspaceError(dict, 'yearError');
	if (e.url && !/^https?:\/\/\S+$/i.test(e.url)) throw new WorkspaceError(dict, 'urlError');
	if (e.doi && !/^10\.\d{4,9}\/\S+$/i.test(e.doi.trim().replace(/^(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)/i, ''))) throw new WorkspaceError(dict, 'doiError');
	if (e.accessed && (!/^\d{4}-\d{2}-\d{2}$/.test(e.accessed) || Number.isNaN(Date.parse(e.accessed)) || new Date(e.accessed).toISOString().slice(0, 10) !== e.accessed)) throw new WorkspaceError(dict, 'dateError');
}

export function citation(e: Entry, style: Style, number = 1): { html: string; text: string; inText: string } {
	validateEntry(e);
	const esc = escapeHtml;
	const title = esc(e.title.trim());
	const italic = (s: string) => `<i>${s}</i>`;
	const author = esc(names(e, style));
	const year = e.year || (style === 'apa' ? 'n.d.' : 'n.d.');
	const link = e.doi ? doiUrl(e.doi) : e.url.trim();
	const container = esc(e.publisher.trim());
	let html: string;
	if (style === 'apa') {
		const heading = e.type === 'journal' ? title : italic(title);
		const start = author ? `${period(author)} (${year}). ${period(heading)}` : `${period(heading)} (${year}).`;
		let tail = '';
		if (e.type === 'journal') {
			tail = `${italic(container + (e.volume ? `, ${esc(e.volume)}` : ''))}${e.issue ? `(${esc(e.issue)})` : ''}${e.pages ? `, ${esc(e.pages.replace(/-/g, '–'))}` : ''}`;
		} else tail = container;
		html = `${start}${tail ? ` ${period(tail)}` : ''}${link ? ` ${e.type === 'web' && e.accessed ? `Retrieved ${dateText(e.accessed)}, from ` : ''}${esc(link)}` : ''}`;
	} else {
		const heading = e.type === 'book' ? italic(title) : `“${title},”`;
		let tail = e.type === 'journal' ? italic(container) : container;
		if (e.type === 'journal') tail += `${e.volume ? `, vol. ${esc(e.volume)}` : ''}${e.issue ? `, no. ${esc(e.issue)}` : ''}${e.pages ? `, pp. ${esc(e.pages.replace(/-/g, '–'))}` : ''}`;
		html = `[${number}] ${author ? `${author}, ` : ''}${heading}${tail ? `${e.type === 'book' ? ', ' : ' '}${tail}, ` : e.type === 'book' ? ', ' : ' '}${year}.${link ? ` ${e.type === 'web' || !e.doi ? `[Online]. Available: ${esc(link)}${e.accessed ? `. Accessed: ${dateText(e.accessed)}` : ''}.` : `doi: ${esc(doiUrl(e.doi).replace('https://doi.org/', ''))}.`}` : ''}`;
	}
	const surnames = e.authors.filter((a) => a.last.trim()).map((a) => a.last.trim());
	const inText = style === 'ieee' ? `[${number}]` : `(${surnames.length > 2 ? `${surnames[0]} et al.` : surnames.join(' & ') || `“${e.title}”`}, ${year})`;
	return { html, text: html.replace(/<\/?i>/g, '').replace(/&(#39|amp|lt|gt|quot);/g, (_, entity: string) => ({ '#39': "'", amp: '&', lt: '<', gt: '>', quot: '"' })[entity]!), inText };
}

export function orderedEntries(entries: Entry[], style: Style): Entry[] {
	return style === 'ieee' ? [...entries] : [...entries].sort((a, b) => {
		const key = (e: Entry) => e.authors.filter((a) => a.last.trim()).map((a) => `${a.last.trim()}, ${initials(a.first)}`).join('; ') || e.title.trim();
		return key(a).localeCompare(key(b), 'en', { sensitivity: 'base' }) || a.year.localeCompare(b.year) || a.title.localeCompare(b.title);
	});
}

export function readEntries(raw: string): Entry[] {
	const value: unknown = JSON.parse(raw);
	if (!Array.isArray(value) || value.length > 500) throw new WorkspaceError(dict, 'listError');
	for (const e of value) {
		if (!e || !['book', 'journal', 'web'].includes(e.type) || !Array.isArray(e.authors) || e.authors.length > 200 || !e.authors.every((a: Author) => a && typeof a.first === 'string' && typeof a.last === 'string') || !['id', 'year', 'title', 'publisher', 'volume', 'issue', 'pages', 'doi', 'url', 'accessed'].every((key) => typeof e[key] === 'string')) throw new WorkspaceError(dict, 'listError');
		validateEntry(e);
	}
	return value;
}

export function bibtex(e: Entry, index: number): string {
	validateEntry(e);
	const safe = (s: string) => s.replace(/[\\{}%&#_$~^]/g, (c) => `\\${c}`);
	const fields: Record<string, string> = {
		author: e.authors.filter((a) => a.last.trim()).map((a) => `${a.last.trim()}${a.first.trim() ? `, ${a.first.trim()}` : ''}`).join(' and '),
		title: e.title, year: e.year, [e.type === 'journal' ? 'journal' : 'publisher']: e.publisher,
		volume: e.type === 'journal' ? e.volume : '', number: e.type === 'journal' ? e.issue : '',
		pages: e.type === 'journal' ? e.pages.replace(/[–-]+/g, '--') : '', doi: e.doi ? doiUrl(e.doi).replace('https://doi.org/', '') : '', url: e.url, urldate: e.accessed,
	};
	return `@${e.type === 'journal' ? 'article' : e.type === 'book' ? 'book' : 'misc'}{sumber${index},\n${Object.entries(fields).filter(([, v]) => v).map(([k, v]) => `  ${k} = {${safe(v)}}`).join(',\n')}\n}`;
}
