import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../src/features/', import.meta.url);
const marker = /\b(?:kamu|salin|unduh|unggah|pilih|tempel|berkas|hasil|gagal|mengolah|periksa|kata|bahasa|jumlah|karakter|tanpa|spasi|ubah|kalimat|huruf|besar|kecil|hapus|simpan|batal|kosong|masukkan|tambah|semua|belum|sudah|tidak|hanya|untuk|dengan|atau|ukuran|baris|warna|gambar|mulai|berhenti|mengunduh|memuat|menyalin|maksimal|pertahankan|standar)\b/i;
const check = process.argv.includes('--check');
const selected = new Set(process.argv.slice(2).filter((arg) => !arg.startsWith('--')));
let failed = false;

function filesAt(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((item) => {
		const path = join(directory, item.name);
		return item.isDirectory() ? filesAt(path) : /\.(?:astro|tsx?|jsx?)$/.test(path) && !/(?:\.test\.|\/meta\.|\/i18n\.)/.test(path) ? [path] : [];
	});
}

for (const item of readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
	if (!item.isDirectory() || selected.size && !selected.has(item.name)) continue;
	const files = filesAt(new URL(`${item.name}/`, root).pathname);
	const tokens = new Set(files.flatMap((file) => [...readFileSync(file, 'utf8').matchAll(/\b(?:data-[\w-]+|id|for|class)="([^"\s]+)"/g)].map((match) => match[1])));
	const candidates = [];
	for (const file of files) {
		const source = readFileSync(file, 'utf8');
		for (const match of source.matchAll(/(['"`])((?:\\[\s\S]|(?!\1)[^\\])*?)\1|>([^<>{}\n]+)</g)) {
			const prefix = source.slice(Math.max(0, match.index - 200), match.index);
			if (/\b(?:class|id|for)=\s*$/.test(prefix) || /\b(?:\w*[Ff]ile[Nn]ame|resultName)\s*=\s*$/.test(prefix) || /\boutputFileName\([^}]*$/.test(prefix) || /\bdownloadText\(\s*$/.test(prefix)) continue;
			const value = match[2] ?? match[3] ?? '';
			if (tokens.has(value) && !/>\s*$/.test(prefix)) continue;
			if (/^(?:#|\[)/.test(value) || /^[^\s]+\.(?:pdf|png|jpe?g|webp|svg|drawio|excalidraw)$/.test(value)) continue;
			if (/^(?:flowchart|sequenceDiagram|erDiagram|classDiagram|gantt|stateDiagram-v2)\b/.test(value)) continue;
			if (/\bplaceholder\s*=\s*(?:{\s*)?$/.test(prefix) && (/^curl\s/.test(value) || /^[\w.-]+=[\s\S]*[&?](?:amp;)?\s*[\w.-]+=/.test(value) || /^[\w-]+:[\w.-]+$/.test(value))) continue;
			if (marker.test(value) && !/^(?:workspace\.|[.\/]|https?:)/.test(value)) candidates.push(value.trim());
		}
	}
	console.log(`${item.name}: ${candidates.length} Indonesian copy candidates (${files.length} workspace/logic files)`);
	if (check && candidates.length) { failed = true; for (const value of candidates.slice(0, 10)) console.error(`  ${value.slice(0, 140)}`); }
}
if (check && selected.size && [...selected].some((slug) => !readdirSync(root).includes(slug))) failed = true;
process.exitCode = failed ? 1 : 0;
