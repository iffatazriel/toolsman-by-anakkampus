import { WorkspaceError } from '../../lib/i18n';
import dict from './i18n';
export type Alignment = 'l' | 'c' | 'r';
export interface ParsedTable { headers: string[]; rows: string[][]; alignments: Alignment[] }
export interface LatexOptions { booktabs: boolean; wrap: boolean; caption: string; label: string; boldHeader: boolean; columns: string }
export const defaultOptions: LatexOptions = { booktabs: true, wrap: false, caption: '', label: '', boldHeader: true, columns: '' };

function sourceText(source: string): string {
	if (!source.trim() || source.length > 200000) throw new WorkspaceError(dict, 'emptyError');
	return source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '');
}

function normalize(headers: string[], rows: string[][], alignments: Alignment[]): ParsedTable {
	if (!headers.length || headers.length > 100) throw new WorkspaceError(dict, 'columnsError');
	if (alignments.length !== headers.length || alignments.some((value) => !['l', 'c', 'r'].includes(value))) throw new WorkspaceError(dict, 'alignError');
	if (rows.length > 2000 || (rows.length + 1) * headers.length > 10000) throw new WorkspaceError(dict, 'sizeError');
	return { headers, alignments, rows: rows.map((row, i) => {
		if (row.length > headers.length) throw new WorkspaceError(dict, 'rowError', { row: i + 1, columns: row.length, headers: headers.length });
		return [...row, ...Array<string>(headers.length - row.length).fill('')];
	}) };
}

export function markdownCells(line: string): string[] {
	const cells: string[] = [];
	const raw = line.trim();
	let cell = '', ticks = 0;
	for (let i = 0; i < raw.length; i++) {
		const char = raw[i]!;
		if (char === '\\' && raw[i + 1] && /[\\`*_{}\[\]()#+.!|~\-]/.test(raw[i + 1]!)) { cell += raw[++i]; continue; }
		if (char === '`') {
			let end = i + 1;
			while (raw[end] === '`') end++;
			const size = end - i;
			if (!ticks) ticks = size; else if (ticks === size) ticks = 0;
			cell += raw.slice(i, end); i = end - 1; continue;
		}
		if (char === '|' && !ticks) { cells.push(cell.trim()); cell = ''; } else cell += char;
	}
	cells.push(cell.trim());
	if (raw.startsWith('|')) cells.shift();
	if (cells.length && cells.at(-1) === '' && raw.endsWith('|') && cell === '') cells.pop();
	return cells;
}

function markdown(source: string): ParsedTable {
	const lines = source.split('\n').filter((line) => line.trim());
	if (lines.length < 2) throw new WorkspaceError(dict, 'markdownError');
	const headers = markdownCells(lines[0]!);
	const separator = markdownCells(lines[1]!);
	if (separator.length !== headers.length || !separator.every((cell) => /^:?-{3,}:?$/.test(cell))) throw new WorkspaceError(dict, 'separatorError');
	const alignments: Alignment[] = separator.map((cell) => cell.endsWith(':') ? cell.startsWith(':') ? 'c' : 'r' : 'l');
	return normalize(headers, lines.slice(2).map(markdownCells), alignments);
}

function delimited(source: string, delimiter: string): ParsedTable {
	const rows: string[][] = [];
	let row: string[] = [], field = '', quoted = false, closed = false;
	const pushField = () => { row.push(field); field = ''; closed = false; if (row.length > 100) throw new WorkspaceError(dict, 'maxColumns'); };
	const pushRow = () => { pushField(); rows.push(row); row = []; if (rows.length > 2001) throw new WorkspaceError(dict, 'maxRows'); };
	for (let i = 0; i < source.length; i++) {
		const char = source[i]!;
		if (quoted) {
			if (char === '"' && source[i + 1] === '"') { field += '"'; i++; }
			else if (char === '"') { quoted = false; closed = true; }
			else field += char;
		} else if (char === delimiter) pushField();
		else if (char === '\n') pushRow();
		else if (closed) { if (!/[ \t]/.test(char)) throw new WorkspaceError(dict, 'afterQuote'); }
		else if (char === '"') { if (field) throw new WorkspaceError(dict, 'quoteStart'); quoted = true; }
		else field += char;
	}
	if (quoted) throw new WorkspaceError(dict, 'quoteEnd');
	pushRow();
	const headers = rows.shift()!;
	return normalize(headers, rows, headers.map(() => 'l'));
}

export function parseTable(source: string, format: 'auto' | 'markdown' | 'csv' | 'tsv' = 'auto'): ParsedTable {
	const raw = sourceText(source);
	if (format === 'auto') {
		const lines = raw.split('\n');
		if (lines[0]!.includes('\t')) format = 'tsv';
		else if (lines[1] && markdownCells(lines[1]).every((cell) => /^:?-{3,}:?$/.test(cell)) && markdownCells(lines[1]).length) format = 'markdown';
		else format = 'csv';
	}
	return format === 'markdown' ? markdown(raw) : delimited(raw, format === 'tsv' ? '\t' : ',');
}

const escaped: Record<string, string> = { '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#', '_': '\\_', '{': '\\{', '}': '\\}', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}', '\\': '\\textbackslash{}' };
export function escapeLatex(value: string): string { return value.replace(/\r?\n/g, ' ').replace(/[&%$#_{}~^\\]/g, (char) => escaped[char]!); }

export function resolveColumns(override: string, inferred: Alignment[]) {
	if (!override.trim()) return { spec: inferred.join(''), alignments: inferred };
	const spec = override.replace(/\s/g, '');
	if (spec.length > 2000) throw new WorkspaceError(dict, 'specSize');
	const alignments: Alignment[] = [];
	for (let i = 0; i < spec.length;) {
		const char = spec[i]!;
		if (char === '|') { i++; continue; }
		if (/[lcr]/.test(char)) { alignments.push(char as Alignment); i++; continue; }
		const width = spec.slice(i).match(/^[pmb]\{((?:\d+(?:\.\d+)?|\.\d+)(?:pt|mm|cm|in|em|ex)|(?:\d+(?:\.\d+)?|\.\d+)?\\(?:textwidth|linewidth))\}/);
		if (!width || (/^[\d.]/.test(width[1]!) && parseFloat(width[1]!) <= 0)) throw new WorkspaceError(dict, 'specSyntax');
		alignments.push('l'); i += width[0].length;
	}
	if (alignments.length !== inferred.length) throw new WorkspaceError(dict, 'specCount', { expected: inferred.length, actual: alignments.length });
	return { spec, alignments };
}

export function toLatex(table: ParsedTable, options: LatexOptions = defaultOptions): string {
	const normalized = normalize(table.headers, table.rows, table.alignments);
	const columns = resolveColumns(options.columns, normalized.alignments).spec;
	if (options.wrap && options.label && !/^[a-zA-Z0-9:._-]+$/.test(options.label)) throw new WorkspaceError(dict, 'labelError');
	if (options.wrap && options.label && !options.caption.trim()) throw new WorkspaceError(dict, 'captionError');
	const row = (values: string[], bold = false) => values.map((value) => bold ? `\\textbf{${escapeLatex(value)}}` : escapeLatex(value)).join(' & ') + ' \\\\';
	const lines = [`\\begin{tabular}{${columns}}`, options.booktabs ? '\\toprule' : '\\hline', row(normalized.headers, options.boldHeader)];
	if (normalized.rows.length) lines.push(options.booktabs ? '\\midrule' : '\\hline', ...normalized.rows.map((values) => row(values)));
	lines.push(options.booktabs ? '\\bottomrule' : '\\hline', '\\end{tabular}');
	const notes: string[] = [];
	if (options.booktabs) notes.push('% Tambahkan \\usepackage{booktabs} di preambel.');
	if (/[mb]\{/.test(columns)) notes.push('% Tambahkan \\usepackage{array} di preambel.');
	if (options.wrap) {
		const wrapped = ['\\begin{table}[htbp]', '\\centering'];
		if (options.caption.trim()) wrapped.push(`\\caption{${escapeLatex(options.caption.trim())}}`);
		if (options.label) wrapped.push(`\\label{${options.label}}`);
		wrapped.push(...lines, '\\end{table}');
		return [...notes, ...wrapped].join('\n');
	}
	return [...notes, ...lines].join('\n');
}

function group(source: string, start: number): { value: string; end: number } {
	if (source[start] !== '{') throw new WorkspaceError(dict, 'groupStart');
	let depth = 1;
	for (let i = start + 1; i < source.length; i++) {
		if (source[i] === '\\') { i++; continue; }
		if (source[i] === '{') depth++;
		if (source[i] === '}' && --depth === 0) return { value: source.slice(start + 1, i), end: i + 1 };
	}
	throw new WorkspaceError(dict, 'groupEnd');
}

function decodeLatex(source: string, depth = 0): string {
	if (depth > 20) throw new WorkspaceError(dict, 'groupDepth');
	let output = '';
	for (let i = 0; i < source.length; i++) {
		if (source[i] === '{') { const inner = group(source, i); output += decodeLatex(inner.value, depth + 1); i = inner.end - 1; }
		else if (source[i] === '\\') {
			const rest = source.slice(i);
			const special = Object.entries(escaped).find(([, value]) => rest.startsWith(value));
			if (special) { output += special[0]; i += special[1].length - 1; continue; }
			const style = rest.match(/^\\(?:textbf|textit|emph)\s*/);
			if (style) { const inner = group(source, i + style[0].length); output += decodeLatex(inner.value, depth + 1); i = inner.end - 1; continue; }
			throw new WorkspaceError(dict, 'reverseCommands');
		} else if (source[i] === '$' || source[i] === '}') throw new WorkspaceError(dict, 'reverseMath');
		else output += source[i];
	}
	return output.trim().replace(/\s+/g, ' ');
}

function withoutComments(source: string): string {
	let output = '';
	for (let i = 0; i < source.length; i++) {
		if (source[i] === '\\' && source[i + 1]) { output += source[i]! + source[++i]; continue; }
		if (source[i] === '%') { while (i < source.length && source[i] !== '\n') i++; output += '\n'; }
		else output += source[i];
	}
	return output;
}

export function latexToTable(source: string): ParsedTable {
	const raw = withoutComments(sourceText(source));
	const begin = /\\begin\{tabular\}(?:\[[^\]]*\])?\s*/.exec(raw);
	if (!begin || raw.indexOf('\\begin{tabular}', begin.index + 1) >= 0) throw new WorkspaceError(dict, 'oneTable');
	const columns = group(raw, begin.index + begin[0].length);
	const end = raw.indexOf('\\end{tabular}', columns.end);
	if (end < 0) throw new WorkspaceError(dict, 'tableEnd');
	const content = raw.slice(columns.end, end).replace(/\\(?:toprule|midrule|bottomrule|hline)\b/g, '');
	const rows: string[][] = [];
	let row: string[] = [], cell = '', depth = 0;
	const finish = (force = false) => { if (force || row.length || cell.trim()) { row.push(decodeLatex(cell)); rows.push(row); } row = []; cell = ''; };
	for (let i = 0; i < content.length; i++) {
		const char = content[i]!;
		if (char === '\\' && content[i + 1]) {
			if (content[i + 1] === '\\' && !depth) { finish(true); i++; }
			else cell += char + content[++i];
		} else if (char === '&' && !depth) { row.push(decodeLatex(cell)); cell = ''; }
		else { if (char === '{') depth++; if (char === '}') depth--; if (depth < 0) throw new WorkspaceError(dict, 'unbalanced'); cell += char; }
	}
	if (depth) throw new WorkspaceError(dict, 'groupEnd');
	finish();
	if (!rows.length) throw new WorkspaceError(dict, 'noHeader');
	const headers = rows.shift()!;
	const alignments = resolveColumns(columns.value, headers.map(() => 'l')).alignments;
	return normalize(headers, rows, alignments);
}

export function toMarkdown(table: ParsedTable): string {
	const safe = (value: string) => value.replace(/\r?\n/g, ' ').replace(/[\\|`*_\[\]]/g, '\\$&');
	const row = (values: string[]) => `| ${values.map(safe).join(' | ')} |`;
	return [row(table.headers), `| ${table.alignments.map((alignment) => alignment === 'c' ? ':---:' : alignment === 'r' ? '---:' : '---').join(' | ')} |`, ...table.rows.map(row)].join('\n');
}
