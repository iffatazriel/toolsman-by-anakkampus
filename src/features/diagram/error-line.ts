export interface SyntaxIssue {
	line: number;
	message: string;
}

const lineMatch = /(?:line|baris)\s+(\d+)/i;

// Sebagian pesan Mermaid datang dalam bahasa Inggris. Terjemahkan yang paling
// sering muncul; sisanya dibiarkan apa adanya supaya tetap bisa dicari.
function translate(raw: string): string | null {
	if (/No diagram type detected/i.test(raw)) {
		return 'Jenis diagram tidak dikenali. Awali dengan flowchart, sequenceDiagram, classDiagram, erDiagram, gantt, atau stateDiagram-v2.';
	}
	return null;
}

export function extractLineFromMermaidError(error: unknown, source: string): SyntaxIssue {
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
		? 'Ada kesalahan sintaks Mermaid.'
		: 'Sintaks Mermaid tidak dikenali.';

	return {
		line,
		message: translate(raw) ?? message ?? generic,
	};
}
