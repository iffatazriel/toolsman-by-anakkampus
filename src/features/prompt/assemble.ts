const PLACEHOLDER = /\{\{\s*([a-z0-9_]+)\s*\}\}/g;

export interface PromptSegment {
	text: string;
	/** Nama variabel kalau segmen ini berasal dari placeholder. */
	variable: string | null;
	filled: boolean;
}

function readValue(values: Record<string, string>, name: string): string {
	return (values[name] ?? '').trim();
}

/** Menyusun prompt akhir. Variabel kosong ditandai [nama] supaya kelihatan. */
export function assemblePrompt(template: string, values: Record<string, string>): string {
	return template.replace(PLACEHOLDER, (_whole, name: string) => {
		const value = readValue(values, name);
		return value === '' ? `[${name}]` : value;
	});
}

/** Daftar variabel yang masih kosong, tanpa duplikat, urut kemunculan. */
export function missingVariables(template: string, values: Record<string, string>): string[] {
	const missing: string[] = [];
	for (const match of template.matchAll(PLACEHOLDER)) {
		const name = match[1];
		if (readValue(values, name) === '' && !missing.includes(name)) missing.push(name);
	}
	return missing;
}

/** Potongan teks dan variabel untuk pratinjau yang bisa ditandai. */
export function promptSegments(
	template: string,
	values: Record<string, string>,
): PromptSegment[] {
	const segments: PromptSegment[] = [];
	let last = 0;
	for (const match of template.matchAll(PLACEHOLDER)) {
		const index = match.index ?? 0;
		if (index > last) segments.push({ text: template.slice(last, index), variable: null, filled: true });
		const name = match[1];
		const value = readValue(values, name);
		segments.push({
			text: value === '' ? `[${name}]` : value,
			variable: name,
			filled: value !== '',
		});
		last = index + match[0].length;
	}
	if (last < template.length) {
		segments.push({ text: template.slice(last), variable: null, filled: true });
	}
	return segments;
}

export interface PromptMarkdownMeta {
	judul: string;
	catatan: string;
	lisensi: string;
	penulis: string;
}

export function promptMarkdown(prompt: PromptMarkdownMeta, assembled: string): string {
	const parts = [`# ${prompt.judul}`, '', assembled.trim(), ''];
	if (prompt.catatan.trim() !== '') parts.push('---', '', prompt.catatan.trim(), '');
	parts.push(`Lisensi: ${prompt.lisensi} · ${prompt.penulis} · Toolsman`);
	return `${parts.join('\n')}\n`;
}
