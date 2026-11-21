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
	if (source.length > 500_000) throw new Error('Kode lebih dari 500.000 karakter. Pecah dulu menjadi bagian yang lebih kecil.');
	if (minify && !canMinify(options.language)) throw new Error('Minify tersedia untuk JSON dan CSS. Pilih Format untuk bahasa ini.');
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
		const detail = error instanceof Error ? error.message : 'Kesalahan tidak dikenal.';
		throw new Error(`Kode belum bisa diolah. Periksa sintaks dan pilihan bahasa atau dialek kamu. ${detail}`);
	}
}
