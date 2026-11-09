import {
	promptCuplikan,
	validatePromptSources,
	type PromptEntry,
	type PromptIndexItem,
} from './prompt-schema';

// Semua YAML dibaca saat build. Berkas yang tidak lolos skema menghentikan
// build, jadi halaman tidak pernah memuat prompt yang setengah jadi.
const sources = import.meta.glob('../../content/prompts/**/*.yaml', {
	query: '?raw',
	import: 'default',
	eager: true,
}) as Record<string, string>;

const files = Object.entries(sources).map(([path, source]) => ({
	file: path.split('/content/prompts/').pop() ?? path,
	source,
}));

const checked = validatePromptSources(files);
if (checked.errors.length > 0) {
	const detail = checked.errors
		.map((error) => `content/prompts/${error.file}:${error.line}  ${error.message}`)
		.join('\n');
	throw new Error(`Isi content/prompts/ belum valid:\n${detail}`);
}

export const prompts: PromptEntry[] = checked.prompts;

export const promptIndex: PromptIndexItem[] = prompts.map((prompt) => ({
	id: prompt.id,
	judul: prompt.judul,
	kategori: prompt.kategori,
	tag: prompt.tag,
	ai: prompt.ai,
	level: prompt.level,
	cuplikan: promptCuplikan(prompt),
}));

export function getPrompt(id: string): PromptEntry | undefined {
	return prompts.find((prompt) => prompt.id === id);
}
