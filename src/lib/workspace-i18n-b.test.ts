import { afterEach, describe, expect, it } from 'vitest';
import { setCurrentLang, WorkspaceError, workspaceErrorMessage } from './i18n';
import { parseInteger, subnet } from '../features/bilangan-subnet/network';
import { generateCode, parseCurl } from '../features/curl-ke-kode/curl';
import { targetAverage } from '../features/kalkulator-ipk/gpa';
import { citation, validateEntry, type Entry } from '../features/sitasi/citation';
import { parseTable, toLatex } from '../features/tabel-latex/table';
import { parseTimestamp } from '../features/utilitas/utils';
import { formatJson, minifyJson, parseJson, renderJsonTree } from './json-tools';
import { jsonToCsv, jsonToYaml, yamlToJson } from './convert';
import { buildGitignore } from './gitignore';
import { generateReadme, type ReadmeInput } from './readme';

afterEach(() => setCurrentLang('id'));

describe('batch B workspace localization', () => {
	it.each([
		[() => parseInteger('', 10), 'Enter an integer'],
		[() => parseInteger('102', 2), 'Digit “2” is invalid in base 2.'],
		[() => parseCurl(''), 'Paste your cURL command'],
		[() => parseCurl('curl'), 'No URL found'],
		[() => targetAverage({ credits: 0, points: 0, gpa: null }, 0, 3), 'Enter remaining credits'],
		[() => parseTimestamp(''), 'Enter a timestamp'],
		[() => parseTimestamp('bad'), 'Unrecognized date format'],
		[() => parseTable(''), 'Paste your table'],
		[() => parseTable('bad', 'markdown'), 'Markdown needs'],
	] as const)('translates logic errors while keeping the source message stable (%#)', (run, english) => {
		let problem: unknown;
		try { run(); } catch (error) { problem = error; }
		expect(problem).toBeInstanceOf(WorkspaceError);
		const original = (problem as Error).message;
		setCurrentLang('en'); expect(workspaceErrorMessage(problem, 'fallback')).toContain(english);
		setCurrentLang('id'); expect(workspaceErrorMessage(problem, 'fallback')).toBe(original);
	});

	it('localizes network classifications without changing addresses', () => {
		const id = subnet('192.168.1.10/24');
		const en = subnet('192.168.1.10/24', '', 'en');
		expect(en).toEqual({ ...id, scope: 'Private (RFC 1918)' });
		expect(subnet('255.255.255.255/32', '', 'en').ipClass).toBe('E (reserved)');
	});

	it('translates cURL warnings but keeps generated code and JSON values identical', () => {
		const source = `curl https://example.com -k --unknown --json '{"nama":"kamu"}'`;
		const id = parseCurl(source);
		const en = parseCurl(source, 'en');
		expect(en.warnings.join(' ')).toContain('-k is ignored.');
		expect(en.warnings.join(' ')).toContain('Flag “--unknown” is unsupported.');
		expect(generateCode(en, 'fetch')).toBe(generateCode(id, 'fetch'));
		expect(generateCode(en, 'fetch')).toContain('"nama": "kamu"');
	});

	it('keeps standard APA/IEEE wording and source data independent of UI language', () => {
		const entry: Entry = { id: 'x', type: 'web', authors: [{ first: 'Nama', last: 'Penulis' }], year: '2026', title: 'Judul pengguna', publisher: 'Situs', volume: '', issue: '', pages: '', doi: '', url: 'https://example.com', accessed: '2026-01-02' };
		const apa = citation(entry, 'apa'); const ieee = citation(entry, 'ieee');
		setCurrentLang('en');
		expect(citation(entry, 'apa')).toEqual(apa); expect(citation(entry, 'ieee')).toEqual(ieee);
		expect(apa.text).toContain('Retrieved January 2, 2026, from');
		expect(ieee.text).toContain('Accessed: January 2, 2026');
		expect(apa.text).toContain('Judul pengguna');
		expect(() => validateEntry({ ...entry, title: '' })).toThrow(WorkspaceError);
		try { validateEntry({ ...entry, title: '' }); } catch (error) { expect(workspaceErrorMessage(error, '')).toBe('Enter the source title.'); }
	});

	it('does not translate table cells or LaTeX tokens', () => {
		const table = parseTable('| Nama | Nilai |\n| --- | --- |\n| kamu | 3 |');
		const options = { booktabs: true, wrap: false, boldHeader: true, caption: '', label: '', columns: '' };
		const id = toLatex(table, options);
		setCurrentLang('en');
		const en = toLatex(table, options);
		expect(en.replace(/^%.*\n/gm, '')).toBe(id.replace(/^%.*\n/gm, ''));
		expect(en).toContain('% Add \\usepackage{booktabs} to the preamble.');
		expect(id).toContain('kamu'); expect(id).toContain('\\begin{tabular}');
	});
});

describe('generator helper localization', () => {
	it('preserves parsed data and supports empty English diagnostics', () => {
		expect(formatJson('{"nama":"kamu"}', 'en')).toEqual(formatJson('{"nama":"kamu"}'));
		expect(parseJson('', 'en')).toEqual({ ok: false, error: { message: 'The document is empty.', index: 0, line: 1, column: 1 } });
		expect(minifyJson('', 'en')).toEqual(parseJson('', 'en'));
	});
	it.each([
		['{}x', 'Unexpected character "x" after the value.'],
		['{"a":}', 'Character "}" cannot start a JSON value.'],
		['{"a":1,}', 'Trailing comma before }.'],
		['{a:1}', 'Property names must be quoted.'],
		['{"a" 1}', 'Missing colon : after the property name.'],
		['{"a":1', 'Missing closing brace }.'],
		['[1,]', 'Trailing comma before ].'],
		['[1', 'Missing closing bracket ].'],
		['"x', 'Missing closing quote.'],
		['"\\q"', 'Unknown escape \\q.'],
		['"\\uXYZW"', '\\u must be followed by four hexadecimal digits.'],
		['1.', 'Decimals need a digit after the point.'],
		['1e', 'Exponents need a digit.'],
	])('localizes a JSON parser diagnostic for %s', (input, expected) => {
		const result = parseJson(input, 'en'); expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.message).toBe(expected);
	});
	it('localizes tree counts while escaping user data', () => {
		const html = renderJsonTree({ '<script>': ['kamu'] }, { lang: 'en' });
		expect(html).toContain('1 property'); expect(html).toContain('1 item');
		expect(html).toContain('&lt;script&gt;'); expect(html).not.toContain('<script>');
	});
	it('localizes conversion errors and retains data and empty output', () => {
		expect(jsonToCsv('bad', 'en')).toEqual({ ok: false, error: 'Invalid JSON.' });
		expect(jsonToCsv('{}', 'en')).toEqual({ ok: false, error: 'JSON must be an array of objects.' });
		expect(jsonToCsv('[null]', 'en')).toEqual({ ok: false, error: 'Each row must be an object.' });
		expect(jsonToCsv('[]', 'en')).toEqual({ ok: true, text: '' });
		expect(jsonToYaml('bad', 'en')).toEqual({ ok: false, error: 'Invalid JSON.' });
		expect(yamlToJson('a: [', 'en')).toEqual({ ok: false, error: 'Invalid YAML.' });
		expect(jsonToCsv('[{"nama":"kamu"}]', 'en')).toEqual(jsonToCsv('[{"nama":"kamu"}]'));
	});
	it('localizes README scaffolding, not user content or commands', () => {
		const input: ReadmeInput = { name: 'proyek', description: 'Deskripsi pengguna', features: 'Fitur pengguna', install: 'npm install', usage: 'Cara pengguna', license: 'MIT', showLicenseBadge: false };
		const en = generateReadme(input, 'en');
		for (const value of ['Deskripsi pengguna', 'Fitur pengguna', 'npm install', 'Cara pengguna', '## Features', '## Installation', '## Usage', '## License']) expect(en).toContain(value);
		expect(generateReadme({ ...input, name: '' }, 'en')).toBe('');
		expect(generateReadme(input)).toContain('## Fitur');
	});
	it('localizes .gitignore headings without changing rules', () => {
		const id = buildGitignore(['env', 'logs']); const en = buildGitignore(['env', 'logs'], 'en');
		expect(en).toContain('# Secrets and env'); expect(en).toContain('# Logs and cache');
		expect(en.split('\n').filter(line => !line.startsWith('#'))).toEqual(id.split('\n').filter(line => !line.startsWith('#')));
		expect(buildGitignore([], 'en')).toBe('');
	});
});
