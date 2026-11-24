import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const copy = JSON.parse(readFileSync(new URL('src/lib/shell-copy.json', root), 'utf8'));
const normalize = value => value.replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const sources = Object.keys(copy);
const marker = /\b(?:kamu|berkas|halaman|alat|simpan|dikirim|lisensi|pustaka|kebijakan|syarat|dipakai|tidak|tanpa|untuk|dengan|dan|atau|yang|diunggah|kategori|koding|kirim|sumber|berikutnya|perangkatmu|perubahan|kontak|analitik|versi)\b/i;

export function shellCandidates(source) {
	const html = source.replace(/^---[\s\S]*?---/, '').replace(/<(?:script|style|code)\b[^>]*>[\s\S]*?<\/(?:script|style|code)>/g, '<code></code>');
	return [...html.matchAll(/>([^<>{}]+)(?=<|\{)/g)]
		.map(match => normalize(match[1])).filter(text => marker.test(text) && !sources.some(key => key.includes(text)));
}

export function auditShell() {
	const issues = [];
	for (const page of ['tentang', 'privasi', 'syarat', 'lisensi', '404']) {
		const source = readFileSync(new URL(`src/pages/${page}.astro`, root), 'utf8');
		if (!source.includes('data-shell-copy')) issues.push(`${page}: missing translation boundary`);
		for (const text of shellCandidates(source)) issues.push(`${page}: ${text}`);
	}
	for (const [id, en] of Object.entries(copy)) if (!en.trim() || marker.test(en)) issues.push(`English shell copy: ${id}`);
	return issues;
}
