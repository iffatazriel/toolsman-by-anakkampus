export type PageRangeResult =
	| { ok: true; pages: number[] }
	| { ok: false; message: string };

export function parsePageRange(input: string, pageCount: number): PageRangeResult {
	const text = input.replace(/\s+/g, '');
	if (text === '') return { ok: false, message: 'Tulis halaman yang mau diambil, misalnya 1-3,5.' };

	const pages = new Set<number>();
	for (const part of text.split(',')) {
		if (part === '') return { ok: false, message: 'Ada koma berlebih di rentang halaman.' };

		const match = /^(\d+)(?:-(\d+))?$/.exec(part);
		if (!match) return { ok: false, message: `"${part}" bukan rentang halaman yang sah.` };

		const from = Number(match[1]);
		const to = match[2] === undefined ? from : Number(match[2]);
		if (from < 1 || to < 1) return { ok: false, message: 'Nomor halaman mulai dari 1.' };
		if (to < from) return { ok: false, message: `Rentang ${part} terbalik. Tulis yang kecil dulu.` };
		if (to > pageCount) {
			return { ok: false, message: `PDF ini hanya punya ${pageCount} halaman.` };
		}
		for (let page = from; page <= to; page += 1) pages.add(page);
	}

	return { ok: true, pages: [...pages].sort((a, b) => a - b) };
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

export function reductionPercent(before: number, after: number): number {
	if (before <= 0) return 0;
	return Math.round(((before - after) / before) * 100);
}
