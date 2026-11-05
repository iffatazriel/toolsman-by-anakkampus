import { escapeHtml } from './html';

export interface JsonPosition {
	index: number;
	line: number;
	column: number;
}

export interface JsonError extends JsonPosition {
	message: string;
}

export type JsonParseResult =
	| { ok: true; data: unknown }
	| { ok: false; error: JsonError };

export type JsonTextResult =
	| { ok: true; text: string; data: unknown }
	| { ok: false; error: JsonError };

class JsonSyntaxError extends Error {
	index: number;

	constructor(message: string, index: number) {
		super(message);
		this.index = index;
	}
}

function isDigit(char: string | undefined): boolean {
	return char !== undefined && char >= '0' && char <= '9';
}

class JsonReader {
	text: string;
	index = 0;

	constructor(text: string) {
		this.text = text;
	}

	fail(message: string): never {
		throw new JsonSyntaxError(message, this.index);
	}

	skipWhitespace(): void {
		while (this.index < this.text.length) {
			const char = this.text[this.index];
			if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
				this.index += 1;
			} else {
				break;
			}
		}
	}

	parseDocument(): unknown {
		this.skipWhitespace();
		if (this.index >= this.text.length) {
			this.fail('Dokumen masih kosong.');
		}
		const value = this.parseValue();
		this.skipWhitespace();
		if (this.index < this.text.length) {
			this.fail(`Karakter "${this.text[this.index]}" tidak terduga setelah nilai.`);
		}
		return value;
	}

	parseValue(): unknown {
		this.skipWhitespace();
		const char = this.text[this.index];
		if (char === undefined) {
			this.fail('Nilai belum selesai.');
		}
		if (char === '{') return this.parseObject();
		if (char === '[') return this.parseArray();
		if (char === '"') return this.parseString();
		if (char === '-' || isDigit(char)) return this.parseNumber();
		if (this.text.startsWith('true', this.index)) {
			this.index += 4;
			return true;
		}
		if (this.text.startsWith('false', this.index)) {
			this.index += 5;
			return false;
		}
		if (this.text.startsWith('null', this.index)) {
			this.index += 4;
			return null;
		}
		this.fail(`Karakter "${char}" bukan awal nilai JSON yang sah.`);
	}

	parseObject(): Record<string, unknown> {
		this.index += 1;
		const result: Record<string, unknown> = {};
		this.skipWhitespace();
		if (this.text[this.index] === '}') {
			this.index += 1;
			return result;
		}

		while (true) {
			this.skipWhitespace();
			if (this.text[this.index] === '}') {
				this.fail('Koma berlebih sebelum }.');
			}
			if (this.text[this.index] !== '"') {
				this.fail('Nama properti harus diapit tanda kutip.');
			}
			const key = this.parseString();
			this.skipWhitespace();
			if (this.text[this.index] !== ':') {
				this.fail('Tanda titik dua : belum ada setelah nama properti.');
			}
			this.index += 1;
			result[key] = this.parseValue();
			this.skipWhitespace();
			const char = this.text[this.index];
			if (char === ',') {
				this.index += 1;
				continue;
			}
			if (char === '}') {
				this.index += 1;
				return result;
			}
			if (char === undefined) {
				this.fail('Kurung kurawal } belum ditutup.');
			}
			this.fail(`Koma atau } dibutuhkan, bukan "${char}".`);
		}
	}

	parseArray(): unknown[] {
		this.index += 1;
		const result: unknown[] = [];
		this.skipWhitespace();
		if (this.text[this.index] === ']') {
			this.index += 1;
			return result;
		}

		while (true) {
			this.skipWhitespace();
			if (this.text[this.index] === ']') {
				this.fail('Koma berlebih sebelum ].');
			}
			result.push(this.parseValue());
			this.skipWhitespace();
			const char = this.text[this.index];
			if (char === ',') {
				this.index += 1;
				continue;
			}
			if (char === ']') {
				this.index += 1;
				return result;
			}
			if (char === undefined) {
				this.fail('Kurung siku ] belum ditutup.');
			}
			this.fail(`Koma atau ] dibutuhkan, bukan "${char}".`);
		}
	}

	parseString(): string {
		this.index += 1;
		let result = '';

		while (true) {
			const char = this.text[this.index];
			if (char === undefined) {
				this.fail('Tanda kutip penutup belum ada.');
			}
			if (char === '"') {
				this.index += 1;
				return result;
			}
			if (char === '\\') {
				this.index += 1;
				const escape = this.text[this.index];
				if (escape === undefined) {
					this.fail('Escape belum selesai.');
				}
				if (escape === '"' || escape === '\\' || escape === '/') {
					result += escape;
					this.index += 1;
					continue;
				}
				const simple: Record<string, string> = {
					b: '\b',
					f: '\f',
					n: '\n',
					r: '\r',
					t: '\t',
				};
				if (simple[escape] !== undefined) {
					result += simple[escape];
					this.index += 1;
					continue;
				}
				if (escape === 'u') {
					const hex = this.text.slice(this.index + 1, this.index + 5);
					if (hex.length !== 4 || /[^0-9a-fA-F]/.test(hex)) {
						this.index += 1;
						this.fail('Kode \\u harus diikuti empat digit heksadesimal.');
					}
					result += String.fromCharCode(parseInt(hex, 16));
					this.index += 5;
					continue;
				}
				this.index += 1;
				this.fail(`Escape \\${escape} tidak dikenal.`);
			}
			const code = char.charCodeAt(0);
			if (code < 0x20) {
				this.fail('Karakter kontrol tidak boleh langsung di dalam string.');
			}
			result += char;
			this.index += 1;
		}
	}

	parseNumber(): number {
		const start = this.index;
		const text = this.text;

		if (text[this.index] === '-') this.index += 1;

		if (text[this.index] === '0') {
			this.index += 1;
		} else if (text[this.index] !== undefined && text[this.index] >= '1' && text[this.index] <= '9') {
			this.index += 1;
			while (isDigit(text[this.index])) this.index += 1;
		} else {
			this.fail('Angka tidak valid.');
		}

		if (text[this.index] === '.') {
			this.index += 1;
			if (!isDigit(text[this.index])) {
				this.fail('Angka desimal butuh digit setelah titik.');
			}
			while (isDigit(text[this.index])) this.index += 1;
		}

		const exponent = text[this.index];
		if (exponent === 'e' || exponent === 'E') {
			this.index += 1;
			const sign = text[this.index];
			if (sign === '+' || sign === '-') this.index += 1;
			if (!isDigit(text[this.index])) {
				this.fail('Eksponen butuh digit.');
			}
			while (isDigit(text[this.index])) this.index += 1;
		}

		return Number(text.slice(start, this.index));
	}
}

export function lineColumnAt(input: string, index: number): { line: number; column: number } {
	const safe = Math.max(0, Math.min(index, input.length));
	const before = input.slice(0, safe);
	const line = before.split('\n').length;
	const lastBreak = before.lastIndexOf('\n');
	return { line, column: safe - lastBreak };
}

export function parseJson(input: string): JsonParseResult {
	try {
		return { ok: true, data: new JsonReader(input).parseDocument() };
	} catch (error) {
		if (error instanceof JsonSyntaxError) {
			return {
				ok: false,
				error: {
					message: error.message,
					index: error.index,
					...lineColumnAt(input, error.index),
				},
			};
		}
		if (error instanceof RangeError) {
			return {
				ok: false,
				error: {
					message: 'Struktur JSON terlalu dalam untuk dibaca.',
					index: 0,
					...lineColumnAt(input, 0),
				},
			};
		}
		throw error;
	}
}

export function formatJson(input: string): JsonTextResult {
	const parsed = parseJson(input);
	if (!parsed.ok) return parsed;
	return { ok: true, text: JSON.stringify(parsed.data, null, 2), data: parsed.data };
}

export function minifyJson(input: string): JsonTextResult {
	const parsed = parseJson(input);
	if (!parsed.ok) return parsed;
	return { ok: true, text: JSON.stringify(parsed.data), data: parsed.data };
}

export function highlightJson(text: string): string {
	let html = '';
	let index = 0;

	while (index < text.length) {
		const char = text[index];

		if (char === '"') {
			const start = index;
			index += 1;
			while (index < text.length) {
				if (text[index] === '\\') {
					index += 2;
					continue;
				}
				if (text[index] === '"') {
					index += 1;
					break;
				}
				index += 1;
			}
			let ahead = index;
			while (ahead < text.length && /\s/.test(text[ahead] ?? '')) ahead += 1;
			const className = text[ahead] === ':' ? 'tok-key' : 'tok-string';
			html += `<span class="${className}">${escapeHtml(text.slice(start, index))}</span>`;
			continue;
		}

		if (char === '-' || isDigit(char)) {
			const start = index;
			index += 1;
			while (index < text.length && /[-+.eE0-9]/.test(text[index] ?? '')) index += 1;
			html += `<span class="tok-number">${escapeHtml(text.slice(start, index))}</span>`;
			continue;
		}

		const literal = text.startsWith('true', index)
			? 'true'
			: text.startsWith('false', index)
				? 'false'
				: text.startsWith('null', index)
					? 'null'
					: '';
		if (literal !== '') {
			html += `<span class="tok-literal">${literal}</span>`;
			index += literal.length;
			continue;
		}

		html += escapeHtml(char ?? '');
		index += 1;
	}

	return html;
}

export interface JsonTreeOptions {
	openDepth?: number;
}

function isContainer(value: unknown): value is Record<string, unknown> | unknown[] {
	return value !== null && typeof value === 'object';
}

function containerLabel(value: unknown): string {
	return Array.isArray(value)
		? `${value.length} item`
		: `${Object.keys(value as Record<string, unknown>).length} properti`;
}

function renderPrimitive(value: unknown): string {
	if (typeof value === 'string') {
		return `<span class="tok-string">"${escapeHtml(value)}"</span>`;
	}
	if (typeof value === 'number') {
		return `<span class="tok-number">${String(value)}</span>`;
	}
	if (typeof value === 'boolean') {
		return `<span class="tok-literal">${String(value)}</span>`;
	}
	return '<span class="tok-literal">null</span>';
}

function renderNode(
	value: unknown,
	key: string | null,
	depth: number,
	openDepth: number,
): string {
	const keyPart =
		key === null
			? ''
			: `<span class="tok-key">"${escapeHtml(key)}"</span><span class="tok-punct">: </span>`;

	if (!isContainer(value)) {
		return `<li>${keyPart}${renderPrimitive(value)}</li>`;
	}

	const entries: [string, unknown][] = Array.isArray(value)
		? value.map((item, itemIndex) => [String(itemIndex), item])
		: Object.entries(value);

	if (entries.length === 0) {
		const empty = Array.isArray(value) ? '[]' : '{}';
		return `<li>${keyPart}<span class="tok-punct">${empty}</span></li>`;
	}

	const children = entries
		.map(([childKey, child]) => renderNode(child, childKey, depth + 1, openDepth))
		.join('');
	const open = depth < openDepth ? ' open' : '';

	return `<li><details${open}><summary>${keyPart}<span class="json-tree__count">${containerLabel(value)}</span></summary><ul>${children}</ul></details></li>`;
}

export function renderJsonTree(data: unknown, options: JsonTreeOptions = {}): string {
	const openDepth = options.openDepth ?? 1;
	return `<ul class="json-tree">${renderNode(data, null, 0, openDepth)}</ul>`;
}
