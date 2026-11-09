import DOMPurify from 'dompurify';
import { escapeHtml } from '../../lib/html';

/**
 * Catatan prompt ditulis sebagai teks biasa. Markdown yang diizinkan hanya
 * yang tidak berbahaya: tebal, miring, kode sebaris, dan daftar. Semua teks
 * di-escape lebih dulu, lalu DOMPurify tetap dipakai sebagai lapis kedua.
 */
function inline(text: string): string {
	return text
		.replace(/`([^`]+)`/g, (_whole, code: string) => `<code>${escapeHtml(code)}</code>`)
		.replace(/\*\*([^*]+)\*\*/g, (_whole, bold: string) => `<strong>${escapeHtml(bold)}</strong>`)
		.replace(/(^|[\s(])\*([^*\n]+)\*/g, (_whole, lead: string, italic: string) =>
			`${escapeHtml(lead)}<em>${escapeHtml(italic)}</em>`,
		);
}

export function renderNote(source: string): string {
	const blocks = source.trim().split(/\n{2,}/);
	const html = blocks
		.map((block) => {
			const lines = block.split('\n');
			const isList = lines.every((line) => /^\s*[-*]\s+/.test(line));
			if (isList) {
				const items = lines
					.map((line) => `<li>${inline(line.replace(/^\s*[-*]\s+/, ''))}</li>`)
					.join('');
				return `<ul>${items}</ul>`;
			}
			return `<p>${lines.map(inline).join('<br>')}</p>`;
		})
		.join('');

	return DOMPurify.sanitize(html, {
		ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'ul', 'li'],
		ALLOWED_ATTR: [],
	});
}
