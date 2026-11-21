import { Validator, type Schema, type SchemaDraft } from '@cfworker/json-schema';
import { parseJson } from '../../lib/json-tools';
import { fill, type Lang } from '../../lib/i18n';
import dict from './i18n';

const say = (lang: Lang, key: keyof typeof dict.id, vars: Record<string, string | number> = {}) => fill(dict[lang][key], vars);

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

export function friendlyMessage(keyword: string, error: string, lang: Lang = 'id'): string {
	if (keyword === 'required') {
		const name = quoted(error);
		return say(lang, name ? 'requiredNamed' : 'required', { name: name ?? '' });
	}

	if (keyword === 'type') {
		const match = /Instance type "([^"]+)" is invalid\. Expected "([^"]+)"/.exec(error);
		return match
			? say(lang, 'typeNamed', { expected: match[2]!, actual: match[1]! })
			: say(lang, 'type');
	}

	if (keyword === 'minLength' || keyword === 'maxLength') {
		const pair = numbers(error);
		if (pair) {
			return say(lang, keyword === 'minLength' ? 'minLengthNamed' : 'maxLengthNamed', { limit: pair[1], actual: pair[0] });
		}
		return say(lang, keyword);
	}

	if (keyword === 'minimum' || keyword === 'maximum') {
		const pair = numbers(error);
		if (pair) {
			return say(lang, keyword === 'minimum' ? 'minimumNamed' : 'maximumNamed', { limit: pair[1], actual: pair[0] });
		}
		return say(lang, keyword);
	}

	if (keyword === 'exclusiveMinimum' || keyword === 'exclusiveMaximum') {
		const pair = numbers(error);
		return pair
			? say(lang, keyword, { limit: pair[1] })
			: say(lang, 'outOfBounds');
	}

	if (keyword === 'minItems' || keyword === 'maxItems') {
		const pair = numbers(error);
		if (pair) {
			return say(lang, keyword === 'minItems' ? 'minItemsNamed' : 'maxItemsNamed', { limit: pair[1], actual: pair[0] });
		}
		return say(lang, 'items');
	}

	if (keyword === 'uniqueItems' || keyword === 'pattern' || keyword === 'format') return say(lang, keyword);
	if (keyword === 'enum' || keyword === 'const') {
		return say(lang, 'enum');
	}
	if (keyword === 'additionalProperties') {
		const name = quoted(error);
		return say(lang, name ? 'additionalNamed' : 'additional', { name: name ?? '' });
	}
	if (keyword === 'minProperties' || keyword === 'maxProperties') {
		const pair = numbers(error);
		return pair
			? say(lang, keyword, { limit: pair[1] })
			: say(lang, 'properties');
	}
	if (keyword === 'dependentRequired') return say(lang, 'dependentRequired');
	if (keyword === 'oneOf' || keyword === 'anyOf') {
		return say(lang, 'union');
	}

	return say(lang, 'rule');
}

function parseError(kind: 'schema' | 'data', error: { line: number; column: number; message: string }, source: string, lang: Lang) {
	let detail = lang === 'id' ? error.message : dict.en.invalidJson;
	if (lang === 'en') {
		try { JSON.parse(source); } catch (error) {
			if (error instanceof Error) detail = error.message;
		}
	}
	return {
		ok: false as const,
		kind,
		error: say(lang, 'parse', { kind: kind === 'schema' ? 'Schema' : 'Data', line: error.line, column: error.column, detail }),
	};
}

export function validateJsonSchema(
	schemaText: string,
	dataText: string,
	draft: SchemaDraftId = '2020-12',
	lang: Lang = 'id',
): SchemaValidation {
	const schemaParsed = parseJson(schemaText);
	if (!schemaParsed.ok) return parseError('schema', schemaParsed.error, schemaText, lang);

	const dataParsed = parseJson(dataText);
	if (!dataParsed.ok) return parseError('data', dataParsed.error, dataText, lang);

	const schema = schemaParsed.data;
	if (schema === null || (typeof schema !== 'object' && typeof schema !== 'boolean')) {
		return { ok: false, kind: 'schema', error: say(lang, 'schemaType') };
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
					? say(lang, 'schemaFailedDetail', { detail: error.message })
					: say(lang, 'schemaFailed'),
		};
	}

	const seen = new Set<string>();
	const issues: SchemaIssue[] = [];

	for (const entry of result.errors) {
		if (IGNORED_KEYWORDS.has(entry.keyword)) continue;

		const path = pathFromInstance(entry.instanceLocation);
		const message = friendlyMessage(entry.keyword, entry.error, lang);
		const key = `${path}|${message}`;
		if (seen.has(key)) continue;
		seen.add(key);
		issues.push({ path, message });
	}

	issues.sort((a, b) => a.path.localeCompare(b.path) || a.message.localeCompare(b.message));

	return { ok: true, valid: result.valid, issues };
}
