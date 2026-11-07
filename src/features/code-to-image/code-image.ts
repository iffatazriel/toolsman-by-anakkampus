export type CodeTheme = 'light' | 'dark';

export interface CodeRun {
	text: string;
	className: string | null;
}

export interface ThemePalette {
	background: string;
	foreground: string;
	border: string;
	tokens: Record<string, string>;
}

const lightTokens: Record<string, string> = {
	'hljs-keyword': '#b35c00',
	'hljs-string': '#1e8e5a',
	'hljs-number': '#b7791f',
	'hljs-comment': '#6b665d',
	'hljs-title': '#2b6cb0',
	'hljs-attr': '#2b6cb0',
	'hljs-built_in': '#2b6cb0',
	'hljs-literal': '#b7791f',
	'hljs-type': '#2b6cb0',
	'hljs-meta': '#6b665d',
};

const darkTokens: Record<string, string> = {
	'hljs-keyword': '#f5a524',
	'hljs-string': '#3dbe86',
	'hljs-number': '#e0a940',
	'hljs-comment': '#a29c90',
	'hljs-title': '#63a4e8',
	'hljs-attr': '#63a4e8',
	'hljs-built_in': '#63a4e8',
	'hljs-literal': '#e0a940',
	'hljs-type': '#63a4e8',
	'hljs-meta': '#a29c90',
};

export function themePalette(theme: CodeTheme): ThemePalette {
	return theme === 'dark'
		? {
				background: '#141311',
				foreground: '#f2efe9',
				border: '#34312c',
				tokens: darkTokens,
			}
		: {
				background: '#faf8f5',
				foreground: '#1f1d1a',
				border: '#e4dfd6',
				tokens: lightTokens,
			};
}

export function tokenColor(className: string | null, theme: CodeTheme): string {
	const palette = themePalette(theme);
	if (!className) return palette.foreground;

	for (const name of className.split(/\s+/)) {
		const color = palette.tokens[name];
		if (color) return color;
	}

	return palette.foreground;
}

function decodeEntities(text: string): string {
	return text
		.replace(/&#x([0-9a-f]+);/gi, (_, value: string) =>
			String.fromCodePoint(Number.parseInt(value, 16)),
		)
		.replace(/&#(\d+);/g, (_, value: string) => String.fromCodePoint(Number(value)))
		.replace(/&quot;/g, '"')
		.replace(/&#x27;|&#39;|&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&');
}

export function parseHighlightHtml(html: string): CodeRun[] {
	const runs: CodeRun[] = [];
	const stack: string[] = [];
	let buffer = '';

	const flush = () => {
		if (buffer === '') return;
		runs.push({ text: decodeEntities(buffer), className: stack.at(-1) ?? null });
		buffer = '';
	};

	for (let index = 0; index < html.length; ) {
		const char = html[index]!;

		if (char !== '<') {
			buffer += char;
			index += 1;
			continue;
		}

		const end = html.indexOf('>', index);
		if (end === -1) {
			buffer += html.slice(index);
			break;
		}

		const tag = html.slice(index + 1, end);
		if (tag.startsWith('/')) {
			flush();
			stack.pop();
		} else if (tag.startsWith('span')) {
			flush();
			const match = /class="([^"]*)"/.exec(tag);
			stack.push(match?.[1] ?? '');
		} else if (tag.startsWith('br')) {
			flush();
			runs.push({ text: '\n', className: null });
		}

		index = end + 1;
	}

	flush();
	return runs;
}

export function groupRunsByLine(runs: CodeRun[]): CodeRun[][] {
	const lines: CodeRun[][] = [[]];

	for (const run of runs) {
		const parts = run.text.split('\n');
		parts.forEach((part, index) => {
			if (index > 0) lines.push([]);
			if (part !== '') {
				lines.at(-1)!.push({ text: part, className: run.className });
			}
		});
	}

	return lines;
}

export function clampPadding(value: number): number {
	return Math.min(64, Math.max(16, Math.round(value)));
}

export function clampRadius(value: number): number {
	return Math.min(28, Math.max(0, Math.round(value)));
}

export function codeFileName(language: string): string {
	const safe = language.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
	return `kode-${safe || 'teks'}.png`;
}
