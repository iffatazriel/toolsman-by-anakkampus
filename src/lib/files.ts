export function slugify(value: string): string {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+/, '')
		.slice(0, 60)
		.replace(/-+$/, '');
}

export function markdownFilename(markdown: string): string {
	const heading = markdown.split('\n').find((line) => /^#\s+\S/.test(line));
	const name = heading ? slugify(heading.replace(/^#\s+/, '')) : '';
	return name === '' ? 'catatan.md' : `${name}.md`;
}
