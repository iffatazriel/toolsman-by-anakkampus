import { Validator, type Schema, type SchemaDraft } from '@cfworker/json-schema';
import { parseJson } from '../../lib/json-tools';

export type SchemaDraftId = '2020-12' | '2019-09' | '7' | '4';

export interface SchemaIssue {
	path: string;
	message: string;
}

export type SchemaValidation =
	| { ok: true; valid: boolean; issues: SchemaIssue[] }
	| { ok: false; kind: 'schema' | 'data' | 'validator'; error: string };

const IGNORED_KEYWORDS = new Set(['properties', 'items', 'false', '$ref', 'allOf']);

export function pathFromInstance(location: string): string {
	if (!location || location === '#') return '$';
	const rest = location.replace(/^#\/?/, '');
	if (rest === '') return '$';

	return `$${rest
		.split('/')
		.map((part) => {
			const decoded = part.replace(/~1/g, '/').replace(/~0/g, '~');
			return /^\d+$/.test(decoded) ? `[${decoded}]` : `.${decoded}`;
		})
		.join('')}`;
}

function quoted(error: string): string | null {
	return /"([^"]+)"/.exec(error)?.[1] ?? null;
}

function numbers(error: string): [string, string] | null {
	const match = /(\d+(?:\.\d+)?)\D+?(\d+(?:\.\d+)?)/.exec(error);
	return match ? [match[1]!, match[2]!] : null;
}

export function friendlyMessage(keyword: string, error: string): string {
	if (keyword === 'required') {
		const name = quoted(error);
		return name ? `Properti wajib "${name}" belum ada.` : 'Ada properti wajib yang belum diisi.';
	}

	if (keyword === 'type') {
		const match = /Instance type "([^"]+)" is invalid\. Expected "([^"]+)"/.exec(error);
		return match
			? `Tipe harus ${match[2]}, bukan ${match[1]}.`
			: 'Tipe nilai tidak sesuai schema.';
	}

	if (keyword === 'minLength' || keyword === 'maxLength') {
		const pair = numbers(error);
		if (pair) {
			return keyword === 'minLength'
				? `Panjang minimal ${pair[1]} karakter, sekarang ${pair[0]}.`
				: `Panjang maksimal ${pair[1]} karakter, sekarang ${pair[0]}.`;
		}
		return keyword === 'minLength' ? 'Teks terlalu pendek.' : 'Teks terlalu panjang.';
	}

	if (keyword === 'minimum' || keyword === 'maximum') {
		const pair = numbers(error);
		if (pair) {
			return keyword === 'minimum'
				? `Nilai minimal ${pair[1]}, sekarang ${pair[0]}.`
				: `Nilai maksimal ${pair[1]}, sekarang ${pair[0]}.`;
		}
		return keyword === 'minimum' ? 'Nilai terlalu kecil.' : 'Nilai terlalu besar.';
	}

	if (keyword === 'exclusiveMinimum' || keyword === 'exclusiveMaximum') {
		const pair = numbers(error);
		return pair
			? `Nilai harus ${keyword === 'exclusiveMinimum' ? 'lebih besar' : 'lebih kecil'} dari ${pair[1]}.`
			: 'Nilai di luar batas yang diizinkan.';
	}

	if (keyword === 'minItems' || keyword === 'maxItems') {
		const pair = numbers(error);
		if (pair) {
			return keyword === 'minItems'
				? `Minimal ${pair[1]} item, sekarang ${pair[0]}.`
				: `Maksimal ${pair[1]} item, sekarang ${pair[0]}.`;
		}
		return 'Jumlah item tidak sesuai.';
	}

	if (keyword === 'uniqueItems') return 'Item array harus unik.';
	if (keyword === 'pattern') return 'Teks tidak cocok dengan pola yang diminta.';
	if (keyword === 'format') return 'Format nilai tidak sesuai.';
	if (keyword === 'enum' || keyword === 'const') {
		return 'Nilai tidak termasuk pilihan yang diizinkan.';
	}
	if (keyword === 'additionalProperties') {
		const name = quoted(error);
		return name ? `Properti "${name}" tidak diizinkan.` : 'Ada properti yang tidak diizinkan.';
	}
	if (keyword === 'minProperties' || keyword === 'maxProperties') {
		const pair = numbers(error);
		return pair
			? `Jumlah properti harus ${keyword === 'minProperties' ? 'minimal' : 'maksimal'} ${pair[1]}.`
			: 'Jumlah properti tidak sesuai.';
	}
	if (keyword === 'dependentRequired') return 'Ada properti yang harus diisi bersama.';
	if (keyword === 'oneOf' || keyword === 'anyOf') {
		return 'Data tidak cocok dengan salah satu bentuk yang diizinkan.';
	}

	return 'Nilai tidak sesuai aturan schema.';
}

function parseError(kind: 'schema' | 'data', error: { line: number; column: number; message: string }) {
	return {
		ok: false as const,
		kind,
		error: `${kind === 'schema' ? 'Schema' : 'Data'} JSON: baris ${error.line}, kolom ${error.column}: ${error.message}`,
	};
}

export function validateJsonSchema(
	schemaText: string,
	dataText: string,
	draft: SchemaDraftId = '2020-12',
): SchemaValidation {
	const schemaParsed = parseJson(schemaText);
	if (!schemaParsed.ok) return parseError('schema', schemaParsed.error);

	const dataParsed = parseJson(dataText);
	if (!dataParsed.ok) return parseError('data', dataParsed.error);

	const schema = schemaParsed.data;
	if (schema === null || (typeof schema !== 'object' && typeof schema !== 'boolean')) {
		return { ok: false, kind: 'schema', error: 'Schema harus berupa objek JSON atau boolean.' };
	}

	let result;
	try {
		const validator = new Validator(schema as Schema, draft as SchemaDraft, false);
		result = validator.validate(dataParsed.data);
	} catch (error) {
		return {
			ok: false,
			kind: 'validator',
			error:
				error instanceof Error
					? `Schema tidak bisa diproses: ${error.message}`
					: 'Schema tidak bisa diproses.',
		};
	}

	const seen = new Set<string>();
	const issues: SchemaIssue[] = [];

	for (const entry of result.errors) {
		if (IGNORED_KEYWORDS.has(entry.keyword)) continue;

		const path = pathFromInstance(entry.instanceLocation);
		const message = friendlyMessage(entry.keyword, entry.error);
		const key = `${path}|${message}`;
		if (seen.has(key)) continue;
		seen.add(key);
		issues.push({ path, message });
	}

	issues.sort((a, b) => a.path.localeCompare(b.path) || a.message.localeCompare(b.message));

	return { ok: true, valid: result.valid, issues };
}
