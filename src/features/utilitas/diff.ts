export type DiffKind = 'same' | 'added' | 'removed';

export interface DiffRow {
	kind: DiffKind;
	oldLine: number | null;
	newLine: number | null;
	text: string;
}

export interface DiffResult {
	rows: DiffRow[];
	added: number;
	removed: number;
	truncated: boolean;
}

export const MAX_DIFF_LINES = 800;

export function diffLines(before: string, after: string): DiffResult {
	const oldLines = before.split('\n');
	const newLines = after.split('\n');

	if (oldLines.length > MAX_DIFF_LINES || newLines.length > MAX_DIFF_LINES) {
		return { rows: [], added: 0, removed: 0, truncated: true };
	}

	const width = newLines.length + 1;
	const table: Uint32Array[] = Array.from(
		{ length: oldLines.length + 1 },
		() => new Uint32Array(width),
	);

	for (let oldIndex = oldLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
		for (let newIndex = newLines.length - 1; newIndex >= 0; newIndex -= 1) {
			table[oldIndex]![newIndex] =
				oldLines[oldIndex] === newLines[newIndex]
					? table[oldIndex + 1]![newIndex + 1]! + 1
					: Math.max(table[oldIndex + 1]![newIndex]!, table[oldIndex]![newIndex + 1]!);
		}
	}

	const rows: DiffRow[] = [];
	let added = 0;
	let removed = 0;
	let oldIndex = 0;
	let newIndex = 0;

	while (oldIndex < oldLines.length && newIndex < newLines.length) {
		if (oldLines[oldIndex] === newLines[newIndex]) {
			rows.push({
				kind: 'same',
				oldLine: oldIndex + 1,
				newLine: newIndex + 1,
				text: oldLines[oldIndex]!,
			});
			oldIndex += 1;
			newIndex += 1;
		} else if (table[oldIndex + 1]![newIndex]! >= table[oldIndex]![newIndex + 1]!) {
			rows.push({
				kind: 'removed',
				oldLine: oldIndex + 1,
				newLine: null,
				text: oldLines[oldIndex]!,
			});
			removed += 1;
			oldIndex += 1;
		} else {
			rows.push({
				kind: 'added',
				oldLine: null,
				newLine: newIndex + 1,
				text: newLines[newIndex]!,
			});
			added += 1;
			newIndex += 1;
		}
	}

	while (oldIndex < oldLines.length) {
		rows.push({
			kind: 'removed',
			oldLine: oldIndex + 1,
			newLine: null,
			text: oldLines[oldIndex]!,
		});
		removed += 1;
		oldIndex += 1;
	}

	while (newIndex < newLines.length) {
		rows.push({
			kind: 'added',
			oldLine: null,
			newLine: newIndex + 1,
			text: newLines[newIndex]!,
		});
		added += 1;
		newIndex += 1;
	}

	return { rows, added, removed, truncated: false };
}
