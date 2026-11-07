export interface RegexMatch {
	index: number;
	length: number;
	text: string;
	groups: string[];
}

export interface RegexResult {
	matches: RegexMatch[];
	truncated: boolean;
}

export interface TextSegment {
	text: string;
	match: boolean;
}

const ALLOWED_FLAGS = new Set(['d', 'i', 'm', 's', 'u', 'v']);

export function runRegex(
	pattern: string,
	flags: string,
	input: string,
	limit = 500,
): RegexResult {
	if (pattern === '') return { matches: [], truncated: false };

	const safeFlags = Array.from(
		new Set(flags.split('').filter((flag) => ALLOWED_FLAGS.has(flag))),
	).join('');
	const regex = new RegExp(pattern, `${safeFlags}g`);
	const matches: RegexMatch[] = [];
	let truncated = false;
	let match = regex.exec(input);

	while (match !== null) {
		if (matches.length >= limit) {
			truncated = true;
			break;
		}

		matches.push({
			index: match.index,
			length: match[0].length,
			text: match[0],
			groups: match.slice(1).map((group) => group ?? ''),
		});

		if (match[0] === '') regex.lastIndex += 1;
		if (regex.lastIndex > input.length) break;
		match = regex.exec(input);
	}

	return { matches, truncated };
}

export function highlightSegments(input: string, matches: RegexMatch[]): TextSegment[] {
	const segments: TextSegment[] = [];
	let cursor = 0;

	for (const match of matches) {
		if (match.index < cursor) continue;
		if (match.index > cursor) {
			segments.push({ text: input.slice(cursor, match.index), match: false });
		}
		segments.push({ text: input.slice(match.index, match.index + match.length), match: true });
		cursor = match.index + match.length;
	}

	if (cursor < input.length) segments.push({ text: input.slice(cursor), match: false });
	return segments;
}
