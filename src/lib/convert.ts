import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

export type ConvertResult = { ok: true; text: string } | { ok: false; error: string };

function csvEscape(value: string): string {
	if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
	return value;
}

function parseCsv(text: string): string[][] {
	const normalized = text.replace(/\r\n?/g, '\n');
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let inQuotes = false;

	for (let index = 0; index < normalized.length; index += 1) {
		const char = normalized[index]!;

		if (inQuotes) {
			if (char === '"') {
				if (normalized[index + 1] === '"') {
					field += '"';
					index += 1;
				} else {
					inQuotes = false;
				}
			} else {
				field += char;
			}
			continue;
		}

		if (char === '"') {
			inQuotes = true;
		} else if (char === ',') {
			row.push(field);
			field = '';
		} else if (char === '\n') {
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else {
			field += char;
		}
	}

	if (field !== '' || row.length > 0) {
		row.push(field);
		rows.push(row);
	}

	return rows.filter((entry) => !(entry.length === 1 && entry[0] === ''));
}

export function jsonToCsv(input: string): ConvertResult {
	let data: unknown;
	try {
		data = JSON.parse(input);
	} catch {
		return { ok: false, error: 'JSON tidak valid.' };
	}

	if (!Array.isArray(data)) return { ok: false, error: 'JSON harus berupa array objek.' };
	if (data.length === 0) return { ok: true, text: '' };

	const headers: string[] = [];
	for (const item of data) {
		if (item === null || typeof item !== 'object' || Array.isArray(item)) {
			return { ok: false, error: 'Tiap baris harus berupa objek.' };
		}
		for (const key of Object.keys(item as Record<string, unknown>)) {
			if (!headers.includes(key)) headers.push(key);
		}
	}

	const lines = [headers.map(csvEscape).join(',')];
	for (const item of data) {
		const row = headers.map((key) => {
			const value = (item as Record<string, unknown>)[key];
			if (value === undefined || value === null) return '';
			if (typeof value === 'object') return JSON.stringify(value);
			return String(value);
		});
		lines.push(row.map(csvEscape).join(','));
	}

	return { ok: true, text: `${lines.join('\n')}\n` };
}

export function csvToJson(input: string): ConvertResult {
	const rows = parseCsv(input);
	if (rows.length === 0) return { ok: true, text: '[]' };

	const headers = rows[0]!;
	const out: Record<string, string>[] = [];

	for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
		const row = rows[rowIndex]!;
		const object: Record<string, string> = {};
		headers.forEach((header, columnIndex) => {
			object[header] = row[columnIndex] ?? '';
		});
		out.push(object);
	}

	return { ok: true, text: JSON.stringify(out, null, 2) };
}

export function jsonToYaml(input: string): ConvertResult {
	let data: unknown;
	try {
		data = JSON.parse(input);
	} catch {
		return { ok: false, error: 'JSON tidak valid.' };
	}

	try {
		return { ok: true, text: stringifyYaml(data, { indent: 2, lineWidth: 100 }) };
	} catch {
		return { ok: false, error: 'Tidak bisa mengubah JSON ke YAML.' };
	}
}

export function yamlToJson(input: string): ConvertResult {
	try {
		const data = parseYaml(input) ?? null;
		return { ok: true, text: JSON.stringify(data, null, 2) };
	} catch {
		return { ok: false, error: 'YAML tidak valid.' };
	}
}
