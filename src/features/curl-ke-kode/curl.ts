import { WorkspaceError, fill, type Lang } from '../../lib/i18n';
import dict from './i18n';
const say = (lang: Lang, key: keyof typeof dict.id, vars: Record<string, string | number> = {}) => fill(dict[lang][key], vars);
export interface FormPart { name: string; value: string; file: boolean; filename?: string; type?: string }
export type Body = { kind: 'text'; value: string } | { kind: 'json'; value: unknown } | { kind: 'form'; parts: FormPart[] } | { kind: 'file'; filename: string };
export interface CurlRequest { url: string; method: string; headers: Record<string, string>; body?: Body; follow: boolean; warnings: string[] }

export function tokenize(command: string): string[] {
	if (!command.trim() || command.length > 200000) throw new WorkspaceError(dict, 'emptyError');
	const tokens: string[] = [];
	let token = '', quote = '', started = false;
	for (let i = 0; i < command.length; i++) {
		const char = command[i]!;
		const next = command[i + 1];
		if (quote === "'") {
			if (char === "'") quote = ''; else token += char;
			continue;
		}
		if (char === '\\' || char === '^') {
			const newline = next === '\n' ? 1 : next === '\r' && command[i + 2] === '\n' ? 2 : 0;
			if (newline) { i += newline; continue; }
			if (char === '\\' && quote === '"' && next && !['$', '`', '"', '\\'].includes(next)) { token += char; continue; }
			if (char === '^' && quote) { token += char; continue; }
			if (next === undefined) throw new WorkspaceError(dict, 'escapeError');
			token += next; i++; started = true; continue;
		}
		if (quote) { if (char === quote) quote = ''; else token += char; continue; }
		if (char === "'" || char === '"') { quote = char; started = true; continue; }
		if (/\s/.test(char)) {
			if (started) { tokens.push(token); token = ''; started = false; }
		} else { token += char; started = true; }
	}
	if (quote) throw new WorkspaceError(dict, 'quoteError');
	if (started) tokens.push(token);
	if (tokens.length > 10000) throw new WorkspaceError(dict, 'argumentsError');
	return tokens;
}

const valueFlags = new Set(['-X', '--request', '-H', '--header', '-d', '--data', '--data-raw', '--data-binary', '--data-urlencode', '--json', '-F', '--form', '-u', '--user', '-b', '--cookie', '-A', '--user-agent', '-e', '--referer', '--url']);
const shortValues = new Set(['X', 'H', 'd', 'F', 'u', 'b', 'A', 'e']);
const basename = (path: string) => path.replace(/^"|"$/g, '').split(/[/\\]/).at(-1) || 'file';
const encode = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);

function urlencode(value: string): string {
	const equal = value.indexOf('=');
	if (equal >= 0) return equal === 0 ? encode(value.slice(1)) : value.slice(0, equal + 1) + encode(value.slice(equal + 1));
	if (value.includes('@')) throw new WorkspaceError(dict, 'urlencodeError');
	return encode(value);
}

function formPart(value: string, warnings: string[], lang: Lang): FormPart {
	const equal = value.indexOf('=');
	if (equal < 1) throw new WorkspaceError(dict, 'formError');
	const name = value.slice(0, equal), content = value.slice(equal + 1);
	if (content.startsWith('<')) throw new WorkspaceError(dict, 'formReadError');
	if (!content.startsWith('@')) return { name, value: content, file: false };
	const [path, ...options] = content.slice(1).split(';');
	if (!path) throw new WorkspaceError(dict, 'formFileError');
	warnings.push(say(lang, 'warnFile', { path }));
	const part: FormPart = { name, value: path.replace(/^"|"$/g, ''), file: true, filename: basename(path) };
	for (const option of options) {
		if (option.startsWith('type=')) part.type = option.slice(5);
		else if (option.startsWith('filename=')) part.filename = option.slice(9).replace(/^"|"$/g, '');
		else warnings.push(say(lang, 'warnForm', { option }));
	}
	return part;
}

export function parseCurl(command: string, lang: Lang = 'id'): CurlRequest {
	const tokens = tokenize(command);
	if (!/(^|[/\\])curl(?:\.exe)?$/i.test(tokens.shift() ?? '')) throw new WorkspaceError(dict, 'commandError');
	const headers: Record<string, string> = Object.create(null);
	const warnings: string[] = [];
	const explicitHeaders = new Set<string>();
	let url = '', explicitMethod = '', get = false, follow = false, jsonMode = false;
	const data: string[] = [], forms: FormPart[] = [], files: string[] = [];
	if (/\$|`|%[A-Za-z_][A-Za-z_0-9]*%/.test(command)) warnings.push(say(lang, 'warnShell'));
	const setUrl = (value: string) => { if (url) throw new WorkspaceError(dict, 'singleUrlError'); url = value; };
	const header = (name: string, value: string) => {
		if (!/^[!#$%&'*+.^_`|~\w-]+$/.test(name) || /[\r\n]/.test(value)) throw new WorkspaceError(dict, 'headerError');
		headers[name.toLowerCase()] = value;
	};
	let positional = false;
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i]!;
		if (token === '--') { positional = true; continue; }
		if (positional || !token.startsWith('-')) {
			if (/^https?:\/\//i.test(token)) setUrl(token);
			else warnings.push(say(lang, 'warnArgument', { token }));
			continue;
		}
		let flag = token, inline: string | undefined;
		const equals = token.indexOf('=');
		if (token.startsWith('--') && equals > 0) { flag = token.slice(0, equals); inline = token.slice(equals + 1); }
		else if (token.length > 2 && shortValues.has(token[1]!)) { flag = token.slice(0, 2); inline = token.slice(2); }
		if (valueFlags.has(flag)) {
			const value = inline ?? tokens[++i];
			if (value === undefined) throw new WorkspaceError(dict, 'flagValueError', { flag });
			switch (flag) {
				case '-X': case '--request': explicitMethod = value.toUpperCase(); break;
				case '--url': setUrl(value); break;
				case '-H': case '--header': {
					const colon = value.indexOf(':');
					const name = (colon < 0 ? value.slice(0, -1) : value.slice(0, colon)).trim().toLowerCase();
					if (explicitHeaders.has(name)) warnings.push(say(lang, 'warnHeader', { name }));
					if (colon < 1) { if (value.endsWith(';')) header(value.slice(0, -1), ''); else throw new WorkspaceError(dict, 'headerFormatError'); }
					else header(value.slice(0, colon).trim(), value.slice(colon + 1).trim());
					explicitHeaders.add(name);
					break;
				}
				case '-u': case '--user': {
					if (!value.includes(':')) warnings.push(say(lang, 'warnPassword'));
					const auth = value.includes(':') ? value : `${value}:`;
					if (!explicitHeaders.has('authorization')) header('authorization', `Basic ${btoa(Array.from(new TextEncoder().encode(auth), (n) => String.fromCharCode(n)).join(''))}`); break;
				}
				case '-b': case '--cookie':
					if (value && !value.includes('=')) warnings.push(say(lang, 'warnCookie'));
					else header('cookie', [headers.cookie, value].filter(Boolean).join('; ')); break;
				case '-A': case '--user-agent': if (!explicitHeaders.has('user-agent')) header('user-agent', value); break;
				case '-e': case '--referer': if (!explicitHeaders.has('referer')) header('referer', value); break;
				case '-F': case '--form': forms.push(formPart(value, warnings, lang)); break;
				default:
					if (flag === '--data-urlencode') data.push(urlencode(value));
					else if (value.startsWith('@') && flag !== '--data-raw') { files.push(value.slice(1)); jsonMode ||= flag === '--json'; }
					else { data.push(value); jsonMode ||= flag === '--json'; }
			}
		} else if (['-G', '--get'].includes(flag)) get = true;
		else if (['-L', '--location'].includes(flag)) follow = true;
		else if (['-k', '--insecure'].includes(flag)) warnings.push(say(lang, 'warnTls'));
		else if (flag === '--compressed') warnings.push(say(lang, 'warnCompressed'));
		else warnings.push(say(lang, 'warnFlag', { token }));
	}
	if (!url) throw new WorkspaceError(dict, 'missingUrl');
	let parsedUrl: URL;
	try { parsedUrl = new URL(url); } catch { throw new WorkspaceError(dict, 'invalidUrl'); }
	if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new WorkspaceError(dict, 'protocolError');
	if (parsedUrl.username || parsedUrl.password) throw new WorkspaceError(dict, 'credentialsError');
	if (parsedUrl.hash) warnings.push(say(lang, 'warnFragment'));
	if ((forms.length && (data.length || files.length)) || files.length > 1 || (files.length && data.length)) throw new WorkspaceError(dict, 'mixedBodyError');
	if (get && (forms.length || files.length)) throw new WorkspaceError(dict, 'getError');
	let body: Body | undefined;
	if (get && data.length) {
		const query = data.join('&');
		parsedUrl.search = parsedUrl.search ? `${parsedUrl.search}&${query}` : query;
	} else if (forms.length) {
		body = { kind: 'form', parts: forms };
		if (headers['content-type']) { delete headers['content-type']; warnings.push(say(lang, 'warnBoundary')); }
	} else if (data.length || files.length) {
		if (headers['content-type'] === undefined) headers['content-type'] = jsonMode ? 'application/json' : 'application/x-www-form-urlencoded';
		if (jsonMode && headers.accept === undefined) headers.accept = 'application/json';
		if (files.length) {
			if (!files[0]) throw new WorkspaceError(dict, 'filenameError');
			body = { kind: 'file', filename: files[0] };
			warnings.push(say(lang, 'warnBodyFile', { path: files[0] }));
		} else {
			const value = data.join(jsonMode ? '' : '&');
			try { body = { kind: 'json', value: JSON.parse(value) }; }
			catch { body = { kind: 'text', value }; if (jsonMode) warnings.push(say(lang, 'warnJson')); }
		}
	}
	const method = explicitMethod || (get ? 'GET' : body ? 'POST' : 'GET');
	if (!/^[!#$%&'*+.^_`|~\w-]+$/.test(method)) throw new WorkspaceError(dict, 'methodError');
	if (['GET', 'HEAD'].includes(method) && body) warnings.push(say(lang, 'warnGet'));
	if (Object.keys(headers).some((h) => ['cookie', 'host', 'user-agent', 'referer', 'origin', 'content-length', 'accept-encoding', 'connection'].includes(h))) warnings.push(say(lang, 'warnBrowser'));
	warnings.push(say(lang, 'warnCors'));
	return { url: parsedUrl.toString(), method, headers, body, follow, warnings: [...new Set(warnings)] };
}

const js = (value: unknown) => JSON.stringify(value, null, 2).replace(/"__proto__":/g, '["__proto__"]:');

export function generateCode(request: CurlRequest, target: 'fetch' | 'axios'): string {
	if (target === 'fetch' && ['GET', 'HEAD'].includes(request.method) && request.body) return '// Fetch tidak mendukung body GET/HEAD.\n// Pilih Axios (Node.js) atau ubah metode/data cURL kamu.';
	const lines: string[] = [];
	if (target === 'axios') lines.push('import axios from "axios";', '');
	let body = '';
	if (request.body?.kind === 'form') {
		lines.push('const body = new FormData();');
		for (const part of request.body.parts) {
			if (part.file) {
				lines.push('// TODO: Ganti file kosong ini dengan file asli.');
				lines.push(`body.append(${js(part.name)}, new File([], ${js(part.filename)}, { type: ${js(part.type || 'application/octet-stream')} }));`);
			} else lines.push(`body.append(${js(part.name)}, ${js(part.value)});`);
		}
		body = 'body';
	} else if (request.body?.kind === 'file') {
		lines.push('// TODO: Ganti file kosong ini dengan file asli.');
		lines.push(`const body = new File([], ${js(basename(request.body.filename))});`); body = 'body';
	} else if (request.body) {
		lines.push(`const body = ${js(request.body.value)};`);
		body = request.body.kind === 'json' && (target === 'fetch' || !/\bapplication\/(?:[\w.+-]*\+)?json\b/i.test(request.headers['content-type'] || '')) ? 'JSON.stringify(body)' : 'body';
	}
	if (lines.length) lines.push('');
	if (target === 'fetch') {
		lines.push(`const response = await fetch(${js(request.url)}, {`, `  method: ${js(request.method)},`, `  headers: ${js(request.headers).replace(/\n/g, '\n  ')},`, `  redirect: ${js(request.follow ? 'follow' : 'manual')},`);
		if (body) lines.push(`  body: ${body},`);
		lines.push('});', 'if (!response.ok) throw new Error(`HTTP ${response.status}`);', 'const result = await response.text();', 'console.log(result);');
	} else {
		lines.push('const response = await axios({', `  url: ${js(request.url)},`, `  method: ${js(request.method)},`, `  headers: ${js(request.headers).replace(/\n/g, '\n  ')},`, `  maxRedirects: ${request.follow ? 5 : 0},`);
		if (body) lines.push(`  data: ${body},`);
		lines.push('});', 'console.log(response.data);');
	}
	return lines.join('\n');
}
