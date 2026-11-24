import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { shellText } from './shell-copy';
import { localizedTool } from './i18n';
import { toLatex, parseTable, defaultOptions } from '../features/tabel-latex/table';
import { setCurrentLang } from './i18n';
import type { ToolMeta } from './tool-types';

const metadata = import.meta.glob<{meta: ToolMeta}>('../features/*/meta.ts', { eager: true });

it('translates every tool privacy statement and FAQ, without changing the Indonesian source', () => {
	for (const {meta: tool} of Object.values(metadata)) {
		for (const id of [tool.privacyDetail, ...tool.faq?.flatMap(item => [item.q, item.a]) ?? []].filter(Boolean) as string[]) {
			expect(shellText(id, 'en'), `${tool.slug}: ${id}`).not.toBe(id);
			expect(shellText(id, 'id')).toBe(id);
		}
		expect(localizedTool(tool.slug, 'en')?.usage.length).toBeGreaterThan(0);
	}
});

it('keeps counts dynamic and leaves unknown text and authored content unchanged', () => {
	expect(shellText('31 alat dalam 9 kategori. Tidak ada yang perlu dipasang atau didaftarkan.', 'en')).toContain('31 tools in 9 categories');
	expect(shellText('88 prompt dalam 7 kategori', 'en')).toBe('88 prompts in 7 categories');
	expect(shellText('', 'en')).toBe('');
	expect(shellText('my prompt {name}', 'en')).toBe('my prompt {name}');
});

it('localizes generated LaTeX comments without changing table content', () => {
	try {
		setCurrentLang('en');
		const latex = toLatex(parseTable('Nama,Isi\nKamu,Teks'), defaultOptions);
		expect(latex).toContain('% Add \\usepackage{booktabs} to the preamble.');
		expect(latex).toContain('Kamu');
	} finally { setCurrentLang('id'); }
});

it('retains shell translation boundaries on static pages', () => {
	for (const page of ['tentang', 'privasi', 'syarat', 'lisensi', '404']) {
		expect(readFileSync(new URL(`../pages/${page}.astro`, import.meta.url), 'utf8')).toContain('data-shell-copy');
	}
});
