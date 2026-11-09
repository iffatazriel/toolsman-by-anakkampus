// Pemeriksa isi content/prompts/. Dijalankan oleh `npm run prompts:check`,
// `predev`, `prebuild`, dan workflow GitHub Actions. Pesan error menyebut
// berkas dan baris supaya kontributor tahu persis apa yang harus diperbaiki.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePromptSources } from '../src/lib/prompt-schema.ts';

const contentDir = fileURLToPath(new URL('../content/prompts/', import.meta.url));

function walk(directory) {
	const found = [];
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const full = join(directory, entry.name);
		if (entry.isDirectory()) found.push(...walk(full));
		else if (/\.ya?ml$/i.test(entry.name)) found.push(full);
	}
	return found;
}

let files;
try {
	files = walk(contentDir);
} catch {
	console.error(`Folder ${relative(process.cwd(), contentDir)} tidak ditemukan.`);
	process.exit(1);
}

if (files.length === 0) {
	console.error('Tidak ada berkas .yaml di content/prompts/.');
	process.exit(1);
}

const sources = files.map((path) => ({
	file: relative(contentDir, path).split(sep).join('/'),
	source: readFileSync(path, 'utf8'),
}));

const { errors, prompts } = validatePromptSources(sources);

if (errors.length > 0) {
	for (const error of errors) {
		console.error(`content/prompts/${error.file}:${error.line}  ${error.message}`);
	}
	console.error(`\n${errors.length} masalah ditemukan di ${files.length} berkas.`);
	process.exit(1);
}

const perCategory = new Map();
for (const prompt of prompts) {
	perCategory.set(prompt.kategori, (perCategory.get(prompt.kategori) ?? 0) + 1);
}
const summary = [...perCategory.entries()].map(([id, count]) => `${id} ${count}`).join(', ');
console.log(`✓ ${prompts.length} prompt valid (${summary}).`);
