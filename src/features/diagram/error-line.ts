import type {Lang} from '../../lib/i18n';
import dict from './i18n';
export interface SyntaxIssue {
	line: number;
	message: string;
}

const lineMatch = /(?:line|baris)\s+(\d+)/i;

// Sebagian pesan Mermaid datang dalam bahasa Inggris. Terjemahkan yang paling
// sering muncul; sisanya dibiarkan apa adanya supaya tetap bisa dicari.
function translate(raw: string, lang: Lang): string | null {
	if (/No diagram type detected/i.test(raw)) {
		return dict[lang].unknownType;
	}
	return null;
}

export function extractLineFromMermaidError(error: unknown, source: string, lang: Lang = 'id'): SyntaxIssue {
	const raw = error instanceof Error ? error.message : String(error ?? '');
	const hash = (error as { hash?: { line?: number | string } } | null)?.hash;
	const fromHash = hash?.line !== undefined ? Number(hash.line) + 1 : NaN;
	const fromText = Number(lineMatch.exec(raw)?.[1]);

	const totalLines = Math.max(1, source.split('\n').length);
	let line = Number.isFinite(fromHash) ? fromHash : fromText;
	if (!Number.isFinite(line)) line = 1;
	line = Math.min(Math.max(1, Math.trunc(line)), totalLines);

	const message = raw
		.split('\n')
		.map((part) => part.trim())
		.find((part) => part !== '' && !part.startsWith('Parse error') && !part.startsWith('-'));

	const generic = /parse error/i.test(raw)
		? dict[lang].syntax
		: dict[lang].unknownSyntax;

	return {
		line,
		message: translate(raw, lang) ?? message ?? generic,
	};
}
