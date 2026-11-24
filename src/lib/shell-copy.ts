import copy from './shell-copy.json';
import type { Lang } from './i18n';

export const normalizeCopy = (value: string) => value.replace(/\s+/g, ' ').trim();
const dictionary: Record<string, string> = copy;
const original = new WeakMap<Text, string>();
let pageTitle: string | undefined;

export function shellText(source: string, lang: Lang): string {
	if (lang === 'id') return source;
	const normalized = normalizeCopy(source);
	const tools = normalized.match(/^(\d+) alat dalam (\d+) kategori\. Tidak ada yang perlu dipasang atau didaftarkan\.$/);
	if (tools) return `${tools[1]} tools in ${tools[2]} categories. Nothing to install or sign up for.`;
	const prompts = normalized.match(/^(\d+) prompt dalam (\d+) kategori$/);
	if (prompts) return `${prompts[1]} prompts in ${prompts[2]} categories`;
	const local = normalized.match(/^(\d+) dari (\d+) alat memproses isi sepenuhnya di perangkatmu\./);
	if (local) return `${local[1]} of ${local[2]} tools process content entirely on your device. No files are sent to Toolsman servers, and there are no accounts, tracking cookies, or ads.`;
	return dictionary[normalized] ?? source;
}

export function translateShellCopy(lang: Lang): void {
	if (document.querySelector('.prose-page[data-shell-copy], .about[data-shell-copy]')) {
		pageTitle ??= document.title;
		document.title = shellText(pageTitle, lang);
	}
	document.querySelectorAll<HTMLElement>('[data-shell-copy]').forEach(root => {
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
		let node: Node | null;
		while ((node = walker.nextNode())) {
			const text = node as Text;
			if (text.parentElement?.closest('code, script, style, svg, [data-i18n], [data-tool-name], [data-tool-tagline], [data-tool-usage-index]')) continue;
			if (!original.has(text)) original.set(text, text.data);
			const source = original.get(text)!;
			const translated = shellText(source, lang);
			text.data = translated === source ? source : source.replace(/\S[\s\S]*\S|\S/, translated);
		}
	});
}
