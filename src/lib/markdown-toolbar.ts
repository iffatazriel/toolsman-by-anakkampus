export type ToolbarAction =
	| 'bold'
	| 'italic'
	| 'heading'
	| 'list'
	| 'code'
	| 'link'
	| 'table';

export interface EditState {
	value: string;
	start: number;
	end: number;
}

function wrap(state: EditState, before: string, after: string, placeholder: string): EditState {
	const selected = state.value.slice(state.start, state.end);
	const inner = selected === '' ? placeholder : selected;
	const value =
		state.value.slice(0, state.start) + before + inner + after + state.value.slice(state.end);
	return {
		value,
		start: state.start + before.length,
		end: state.start + before.length + inner.length,
	};
}

function prefixLines(state: EditState, prefix: string): EditState {
	const value = state.value;
	const lineStart =
		state.start === 0 ? 0 : value.lastIndexOf('\n', state.start - 1) + 1;
	let lineEnd = value.indexOf('\n', state.end);
	if (lineEnd === -1) lineEnd = value.length;

	const block = value.slice(lineStart, lineEnd);
	const lines = block.split('\n');
	const prefixed = lines
		.map((line) => (line.trim() === '' ? line : prefix + line))
		.join('\n');

	const nextValue = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
	const firstLineSkipped = lines[0] !== undefined && lines[0].trim() === '';
	const startDelta = firstLineSkipped ? 0 : prefix.length;

	return {
		value: nextValue,
		start: state.start + startDelta,
		end: state.end + (prefixed.length - block.length),
	};
}

function insertLink(state: EditState): EditState {
	const selected = state.value.slice(state.start, state.end);
	const label = selected === '' ? 'teks tautan' : selected;
	const url = 'url';
	const text = `[${label}](${url})`;
	const value = state.value.slice(0, state.start) + text + state.value.slice(state.end);
	const urlStart = state.start + label.length + 3;
	return { value, start: urlStart, end: urlStart + url.length };
}

function insertCode(state: EditState): EditState {
	const selected = state.value.slice(state.start, state.end);
	if (selected !== '' && !selected.includes('\n')) {
		return wrap(state, '`', '`', 'kode');
	}
	const inner = selected === '' ? 'kode' : selected;
	const block = '```\n' + inner + '\n```';
	const value = state.value.slice(0, state.start) + block + state.value.slice(state.end);
	const start = state.start + 4;
	return { value, start, end: start + inner.length };
}

const tableBlock =
	'| Kolom 1 | Kolom 2 | Kolom 3 |\n| --- | --- | --- |\n|  |  |  |';

function insertTable(state: EditState): EditState {
	const before = state.value.slice(0, state.start);
	const after = state.value.slice(state.end);
	let lead = '';
	if (before !== '' && !before.endsWith('\n')) lead = '\n\n';
	else if (before !== '' && !before.endsWith('\n\n')) lead = '\n';
	const tail = after !== '' && !after.startsWith('\n') ? '\n\n' : '';
	const value = before + lead + tableBlock + tail + after;
	const cursor = before.length + lead.length + 2;
	return { value, start: cursor, end: cursor + 'Kolom 1'.length };
}

export function applyToolbar(state: EditState, action: ToolbarAction): EditState {
	switch (action) {
		case 'bold':
			return wrap(state, '**', '**', 'teks tebal');
		case 'italic':
			return wrap(state, '*', '*', 'teks miring');
		case 'heading':
			return prefixLines(state, '## ');
		case 'list':
			return prefixLines(state, '- ');
		case 'code':
			return insertCode(state);
		case 'link':
			return insertLink(state);
		case 'table':
			return insertTable(state);
	}
}
