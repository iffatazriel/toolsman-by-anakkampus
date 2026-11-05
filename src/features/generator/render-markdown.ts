import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { Marked } from 'marked';
import { escapeHtml } from '../../lib/html';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);

const aliases: Record<string, string> = {
	js: 'javascript',
	jsx: 'javascript',
	ts: 'typescript',
	tsx: 'typescript',
	html: 'xml',
	sh: 'bash',
	shell: 'bash',
	zsh: 'bash',
};

const marked = new Marked({ gfm: true, breaks: false });

marked.use({
	renderer: {
		code({ text, lang }) {
			const requested = (lang ?? '').trim().split(/\s+/)[0]?.toLowerCase() ?? '';
			const resolved = aliases[requested] ?? requested;
			const language = resolved !== '' && hljs.getLanguage(resolved) ? resolved : '';
			const body = language !== '' ? hljs.highlight(text, { language }).value : escapeHtml(text);
			const label =
				language !== '' ? `<span class="codeblock__lang">${escapeHtml(language)}</span>` : '';
			return `<div class="codeblock">${label}<pre><code class="hljs">${body}</code></pre></div>`;
		},
	},
});

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
	if (node.tagName === 'A') {
		const href = node.getAttribute('href') ?? '';
		if (/^https?:\/\//i.test(href)) {
			node.setAttribute('target', '_blank');
			node.setAttribute('rel', 'noopener noreferrer');
		}
	}
	if (node.tagName === 'IMG') {
		node.setAttribute('loading', 'lazy');
		node.setAttribute('decoding', 'async');
	}
});

export function renderMarkdown(source: string): string {
	const html = marked.parse(source, { async: false }) as string;
	return DOMPurify.sanitize(html, {
		USE_PROFILES: { html: true },
		ADD_ATTR: ['target', 'rel', 'loading', 'decoding'],
	});
}
