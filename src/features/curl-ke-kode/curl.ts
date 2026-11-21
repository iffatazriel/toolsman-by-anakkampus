export interface FormPart { name: string; value: string; file: boolean; filename?: string; type?: string }
export type Body = { kind: 'text'; value: string } | { kind: 'json'; value: unknown } | { kind: 'form'; parts: FormPart[] } | { kind: 'file'; filename: string };
export interface CurlRequest { url: string; method: string; headers: Record<string, string>; body?: Body; follow: boolean; warnings: string[] }

export function tokenize(command: string): string[] {
	if (!command.trim() || command.length > 200000) throw new Error('Tempel perintah cURL kamu, maksimal 200.000 karakter.');
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
			if (next === undefined) throw new Error('Karakter escape di akhir belum lengkap. Hapus atau lengkapi perintahnya.');
			token += next; i++; started = true; continue;
		}
		if (quote) { if (char === quote) quote = ''; else token += char; continue; }
		if (char === "'" || char === '"') { quote = char; started = true; continue; }
		if (/\s/.test(char)) {
			if (started) { tokens.push(token); token = ''; started = false; }
		} else { token += char; started = true; }
	}
	if (quote) throw new Error('Tanda kutip belum ditutup. Tutup kutip tunggal atau gandanya.');
	if (started) tokens.push(token);
	if (tokens.length > 10000) throw new Error('Terlalu banyak argumen. Batasi hingga 10.000 argumen.');
	return tokens;
}

const valueFlags = new Set(['-X', '--request', '-H', '--header', '-d', '--data', '--data-raw', '--data-binary', '--data-urlencode', '--json', '-F', '--form', '-u', '--user', '-b', '--cookie', '-A', '--user-agent', '-e', '--referer', '--url']);
const shortValues = new Set(['X', 'H', 'd', 'F', 'u', 'b', 'A', 'e']);
const basename = (path: string) => path.replace(/^"|"$/g, '').split(/[/\\]/).at(-1) || 'file';
const encode = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);

function urlencode(value: string): string {
	const equal = value.indexOf('=');
	if (equal >= 0) return equal === 0 ? encode(value.slice(1)) : value.slice(0, equal + 1) + encode(value.slice(equal + 1));
	if (value.includes('@')) throw new Error('--data-urlencode dengan @file perlu isi file. Ganti dengan nama=isi sebelum dikonversi.');
	return encode(value);
}

function formPart(value: string, warnings: string[]): FormPart {
	const equal = value.indexOf('=');
	if (equal < 1) throw new Error('Isi --form dengan nama=nilai atau nama=@file.');
	const name = value.slice(0, equal), content = value.slice(equal + 1);
	if (content.startsWith('<')) throw new Error('Form dengan <file belum didukung. Ganti dengan isi teks file terlebih dahulu.');
	if (!content.startsWith('@')) return { name, value: content, file: false };
	const [path, ...options] = content.slice(1).split(';');
	if (!path) throw new Error('Isi nama file setelah @ pada --form.');
	warnings.push(`File “${path}” tidak dibaca. Ganti new File([]) dengan file asli sebelum menjalankan kode.`);
	const part: FormPart = { name, value: path.replace(/^"|"$/g, ''), file: true, filename: basename(path) };
	for (const option of options) {
		if (option.startsWith('type=')) part.type = option.slice(5);
		else if (option.startsWith('filename=')) part.filename = option.slice(9).replace(/^"|"$/g, '');
		else warnings.push(`Atribut form “${option}” belum didukung.`);
	}
	return part;
}

export function parseCurl(command: string): CurlRequest {
	const tokens = tokenize(command);
	if (!/(^|[/\\])curl(?:\.exe)?$/i.test(tokens.shift() ?? '')) throw new Error('Awali perintah dengan curl atau curl.exe.');
	const headers: Record<string, string> = Object.create(null);
	const warnings: string[] = [];
	const explicitHeaders = new Set<string>();
	let url = '', explicitMethod = '', get = false, follow = false, jsonMode = false;
	const data: string[] = [], forms: FormPart[] = [], files: string[] = [];
	if (/\$|`|%[A-Za-z_][A-Za-z_0-9]*%/.test(command)) warnings.push('Variabel shell dan substitusi perintah tidak dijalankan; nilainya dipertahankan sebagai teks.');
	const setUrl = (value: string) => { if (url) throw new Error('Hanya satu URL didukung. Pisahkan perintah yang memiliki beberapa URL.'); url = value; };
	const header = (name: string, value: string) => {
		if (!/^[!#$%&'*+.^_`|~\w-]+$/.test(name) || /[\r\n]/.test(value)) throw new Error('Header harus berupa Nama: nilai tanpa baris baru.');
		headers[name.toLowerCase()] = value;
	};
	let positional = false;
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i]!;
		if (token === '--') { positional = true; continue; }
		if (positional || !token.startsWith('-')) {
			if (/^https?:\/\//i.test(token)) setUrl(token);
			else warnings.push(`Argumen “${token}” tidak dikenali dan diabaikan.`);
			continue;
		}
		let flag = token, inline: string | undefined;
		const equals = token.indexOf('=');
		if (token.startsWith('--') && equals > 0) { flag = token.slice(0, equals); inline = token.slice(equals + 1); }
		else if (token.length > 2 && shortValues.has(token[1]!)) { flag = token.slice(0, 2); inline = token.slice(2); }
		if (valueFlags.has(flag)) {
			const value = inline ?? tokens[++i];
			if (value === undefined) throw new Error(`Isi nilai untuk ${flag}.`);
			switch (flag) {
				case '-X': case '--request': explicitMethod = value.toUpperCase(); break;
				case '--url': setUrl(value); break;
				case '-H': case '--header': {
					const colon = value.indexOf(':');
					const name = (colon < 0 ? value.slice(0, -1) : value.slice(0, colon)).trim().toLowerCase();
					if (explicitHeaders.has(name)) warnings.push(`Header “${name}” berulang; hanya nilai terakhir dipakai. Gabungkan nilainya bila perlu.`);
					if (colon < 1) { if (value.endsWith(';')) header(value.slice(0, -1), ''); else throw new Error('Header harus seperti -H "Content-Type: application/json".'); }
					else header(value.slice(0, colon).trim(), value.slice(colon + 1).trim());
					explicitHeaders.add(name);
					break;
				}
				case '-u': case '--user': {
					if (!value.includes(':')) warnings.push('Password -u kosong; konverter tidak meminta password.');
					const auth = value.includes(':') ? value : `${value}:`;
					if (!explicitHeaders.has('authorization')) header('authorization', `Basic ${btoa(Array.from(new TextEncoder().encode(auth), (n) => String.fromCharCode(n)).join(''))}`); break;
				}
				case '-b': case '--cookie':
					if (value && !value.includes('=')) warnings.push('Cookie dari file tidak dibaca. Ganti -b dengan "nama=nilai".');
					else header('cookie', [headers.cookie, value].filter(Boolean).join('; ')); break;
				case '-A': case '--user-agent': if (!explicitHeaders.has('user-agent')) header('user-agent', value); break;
				case '-e': case '--referer': if (!explicitHeaders.has('referer')) header('referer', value); break;
				case '-F': case '--form': forms.push(formPart(value, warnings)); break;
				default:
					if (flag === '--data-urlencode') data.push(urlencode(value));
					else if (value.startsWith('@') && flag !== '--data-raw') { files.push(value.slice(1)); jsonMode ||= flag === '--json'; }
					else { data.push(value); jsonMode ||= flag === '--json'; }
			}
		} else if (['-G', '--get'].includes(flag)) get = true;
		else if (['-L', '--location'].includes(flag)) follow = true;
		else if (['-k', '--insecure'].includes(flag)) warnings.push('-k diabaikan. Fetch/Axios tetap memverifikasi TLS; jangan nonaktifkan pemeriksaan sertifikat.');
		else if (flag === '--compressed') warnings.push('--compressed dikelola otomatis oleh runtime HTTP; tidak perlu menyalin Accept-Encoding.');
		else warnings.push(`Flag “${token}” belum didukung. Periksa dan sesuaikan hasilnya.`);
	}
	if (!url) throw new Error('URL belum ditemukan. Sertakan satu URL http:// atau https://.');
	let parsedUrl: URL;
	try { parsedUrl = new URL(url); } catch { throw new Error('URL tidak valid. Gunakan URL HTTP atau HTTPS lengkap.'); }
	if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Hanya URL HTTP dan HTTPS yang didukung.');
	if (parsedUrl.username || parsedUrl.password) throw new Error('Pindahkan kredensial URL ke -u "user:pass".');
	if (parsedUrl.hash) warnings.push('Fragmen # pada URL tidak dikirim ke server HTTP.');
	if ((forms.length && (data.length || files.length)) || files.length > 1 || (files.length && data.length)) throw new Error('Campuran form, data, atau beberapa file body belum didukung. Gunakan satu jenis body.');
	if (get && (forms.length || files.length)) throw new Error('-G hanya mendukung data teks, bukan form atau @file.');
	let body: Body | undefined;
	if (get && data.length) {
		const query = data.join('&');
		parsedUrl.search = parsedUrl.search ? `${parsedUrl.search}&${query}` : query;
	} else if (forms.length) {
		body = { kind: 'form', parts: forms };
		if (headers['content-type']) { delete headers['content-type']; warnings.push('Content-Type form dilepas agar runtime mengisi boundary multipart yang benar.'); }
	} else if (data.length || files.length) {
		if (headers['content-type'] === undefined) headers['content-type'] = jsonMode ? 'application/json' : 'application/x-www-form-urlencoded';
		if (jsonMode && headers.accept === undefined) headers.accept = 'application/json';
		if (files.length) {
			if (!files[0]) throw new Error('Isi nama file setelah @.');
			body = { kind: 'file', filename: files[0] };
			warnings.push(`File body “${files[0]}” tidak dibaca. Ganti new File([]) dengan file asli.`);
		} else {
			const value = data.join(jsonMode ? '' : '&');
			try { body = { kind: 'json', value: JSON.parse(value) }; }
			catch { body = { kind: 'text', value }; if (jsonMode) warnings.push('Body --json bukan JSON valid; dipertahankan sebagai teks. Periksa kembali JSON kamu.'); }
		}
	}
	const method = explicitMethod || (get ? 'GET' : body ? 'POST' : 'GET');
	if (!/^[!#$%&'*+.^_`|~\w-]+$/.test(method)) throw new Error('Metode HTTP harus satu token, misalnya GET atau POST.');
	if (['GET', 'HEAD'].includes(method) && body) warnings.push('Fetch tidak mendukung body GET/HEAD. Pilih Axios di Node.js atau ubah metode/data perintah.');
	if (Object.keys(headers).some((h) => ['cookie', 'host', 'user-agent', 'referer', 'origin', 'content-length', 'accept-encoding', 'connection'].includes(h))) warnings.push('Beberapa header dibatasi browser (misalnya Cookie, Referer, User-Agent). Gunakan runtime Node.js jika browser menolaknya.');
	warnings.push('Browser tetap tunduk pada CORS. Axios maxRedirects hanya berlaku di Node.js; browser mengelola redirect sendiri.');
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
