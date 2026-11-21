import dict from './i18n';
import { fill } from '../../lib/i18n';

export class FormatError extends Error {
	constructor(public code: 'errorTooLong' | 'errorMinify' | 'errorInvalid', public detail = '') {
		super(fill(dict.id[code], { detail: detail || dict.id.errorUnknown }));
		this.name = 'FormatError';
	}
}

export type Language = 'sql' | 'json' | 'javascript' | 'typescript' | 'html' | 'css';
export interface FormatOptions {
	language: Language;
	indent: '2' | '4' | 'tab';
	dialect: 'sql' | 'mysql' | 'postgresql' | 'sqlite';
	keywordCase: 'upper' | 'lower' | 'preserve';
}

export const extensions: Record<Language, string> = {
	sql: 'sql', json: 'json', javascript: 'js', typescript: 'ts', html: 'html', css: 'css',
};

export function canMinify(language: Language): boolean {
	return language === 'json' || language === 'css';
}

export async function formatCode(source: string, options: FormatOptions, minify = false): Promise<string> {
	if (source.trim() === '') return '';
	if (source.length > 500_000) throw new FormatError('errorTooLong');
	if (minify && !canMinify(options.language)) throw new FormatError('errorMinify');
	try {
		const tabWidth = options.indent === '4' ? 4 : 2;
		if (options.language === 'json') {
			return JSON.stringify(JSON.parse(source), null, minify ? undefined : options.indent === 'tab' ? '\t' : tabWidth);
		}
		if (options.language === 'sql') {
			const { format } = await import('sql-formatter');
			return format(source, {
				language: options.dialect, tabWidth, useTabs: options.indent === 'tab', keywordCase: options.keywordCase,
			});
		}
		const prettier = await import('prettier/standalone');
		let formatted: string;
		const base = { tabWidth, useTabs: options.indent === 'tab' };
		if (options.language === 'css') {
			const postcss = await import('prettier/plugins/postcss');
			formatted = await prettier.format(source, { ...base, parser: 'css', plugins: [postcss] });
			if (minify) {
				const csso = await import('csso');
				return csso.minify(formatted, { restructure: false }).css;
			}
		} else if (options.language === 'html') {
			const html = await import('prettier/plugins/html');
			formatted = await prettier.format(source, { ...base, parser: 'html', plugins: [html] });
		} else {
			const estree = await import('prettier/plugins/estree');
			const parser = options.language === 'typescript'
				? await import('prettier/plugins/typescript')
				: await import('prettier/plugins/babel');
			formatted = await prettier.format(source, {
				...base, parser: options.language === 'typescript' ? 'typescript' : 'babel', plugins: [parser, estree],
			});
		}
		return formatted;
	} catch (error) {
		throw new FormatError('errorInvalid', error instanceof Error ? error.message : '');
	}
}
