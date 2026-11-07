export interface TextCounts {
	chars: number;
	charsNoSpaces: number;
	words: number;
	lines: number;
	sentences: number;
}

export function toTitleCase(input: string): string {
	return input
		.toLowerCase()
		.replace(/(^|[\s\p{P}])(\p{L})/gu, (_match, prefix: string, letter: string) => {
			return `${prefix}${letter.toUpperCase()}`;
		});
}

export function toSentenceCase(input: string): string {
	return input
		.toLowerCase()
		.replace(/(^\s*\p{L})|([.!?]\s+\p{L})/gu, (match) => match.toUpperCase());
}

function splitWords(input: string): string[] {
	return input
		.replace(/([\p{Ll}\p{N}])([\p{Lu}])/gu, '$1 $2')
		.split(/[^\p{L}\p{N}]+/u)
		.filter((word) => word !== '');
}

export function toCamelCase(input: string): string {
	return splitWords(input)
		.map((word, index) => {
			const lower = word.toLowerCase();
			if (index === 0) return lower;
			return `${lower.slice(0, 1).toUpperCase()}${lower.slice(1)}`;
		})
		.join('');
}

export function toSnakeCase(input: string): string {
	return splitWords(input)
		.map((word) => word.toLowerCase())
		.join('_');
}

export function toKebabCase(input: string): string {
	return splitWords(input)
		.map((word) => word.toLowerCase())
		.join('-');
}

export function slugify(input: string): string {
	return input
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function countText(input: string): TextCounts {
	const characters = Array.from(input);
	const sentences = input.match(/[^.!?]+/g)?.filter((part) => part.trim() !== '').length ?? 0;

	return {
		chars: characters.length,
		charsNoSpaces: characters.filter((char) => !/\s/.test(char)).length,
		words: input.trim() === '' ? 0 : input.trim().split(/\s+/u).length,
		lines: input === '' ? 0 : input.split('\n').length,
		sentences: input.trim() === '' ? 0 : sentences,
	};
}

const loremSentences = [
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
	'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
	'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
	'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.',
	'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt.',
	'Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a.',
	'Curabitur non nulla sit amet nisl tempus convallis quis ac lectus.',
	'Vivamus suscipit tortor eget felis porttitor volutpat.',
];

export function loremIpsum(sentences: number): string {
	const count = Math.min(50, Math.max(0, Math.trunc(sentences)));
	if (count === 0) return '';

	return Array.from(
		{ length: count },
		(_, index) => loremSentences[index % loremSentences.length]!,
	).join(' ');
}
