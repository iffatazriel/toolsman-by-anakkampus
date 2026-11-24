import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { setCurrentLang, tr, workspaceErrorMessage } from '../../lib/i18n';
import dict from './i18n';
import { latexToTable, parseTable, resolveColumns, toLatex, toMarkdown } from './table';

afterEach(() => { vi.unstubAllGlobals(); setCurrentLang('id'); });

it('regenerates the displayed, copied and downloaded output on language changes, including empty/error states', async () => {
	const node = () => ({ value: '', checked: false, disabled: false, hidden: false, textContent: '', style: {}, handlers: {} as Record<string, () => unknown>,
		addEventListener(event: string, handler: () => unknown) { this.handlers[event] = handler; }, replaceChildren() {}, append() {}, setAttribute() {}, focus() {} });
	const nodes = new Map<string, ReturnType<typeof node>>();
	const get = (id: string) => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id)!; };
	const document = { querySelector: (selector: string) => get(selector.slice(1)), getElementById: get, createElement: node, addEventListener: vi.fn() };
	get('table-input').value = 'Nama,Nilai\nKamu,90';
	get('table-format').value = 'auto'; get('table-booktabs').checked = true;
	vi.stubGlobal('document', document);
	const copyText = vi.fn(async () => true), downloadText = vi.fn();
	const localizedText = (element: ReturnType<typeof node>, value: () => string) => { element.textContent = value(); };
	const source = readFileSync(new URL('./tool.astro', import.meta.url), 'utf8');
	const script = source.match(/<script>([\s\S]*?)<\/script>/)![1].replace(/^\s*import .*?;$/gm, '');
	const dependencies = { copyText, tr, workspaceErrorMessage, localizedText, dict, downloadText, latexToTable, parseTable, resolveColumns, toLatex, toMarkdown };
	new Function(...Object.keys(dependencies), script)(...Object.values(dependencies));
	const change = document.addEventListener.mock.calls.find(([event]) => event === 'lang:change')![1];
	expect(get('table-output').value).toContain('% Tambahkan');
	setCurrentLang('en'); change();
	const output = get('table-output').value;
	expect(output).toContain('% Add \\usepackage{booktabs}');
	expect(output).toContain('Kamu');
	await get('table-copy').handlers.click(); get('table-download').handlers.click();
	expect(copyText).toHaveBeenCalledWith(output);
	expect(downloadText).toHaveBeenCalledWith('tabel.tex', output, 'text/plain;charset=utf-8');
	setCurrentLang('id'); change(); expect(get('table-output').value).toContain('% Tambahkan');
	get('table-input').value = ''; change();
	expect(get('table-output').value).toBe(''); expect(get('table-download').disabled).toBe(true);
	get('table-input').value = 'A,B\n1,2'; get('table-columns').value = 'invalid'; change();
	expect(get('table-output').value).toBe(''); expect(get('table-error').hidden).toBe(false); expect(get('table-copy').disabled).toBe(true);
});
