import { describe, expect, it } from 'vitest';
import { generateCode, parseCurl, tokenize } from './curl';

describe('tokenizer cURL', () => {
	it('memisahkan argumen serta mempertahankan kutip dan argumen kosong', () => {
		expect(tokenize(`curl 'https://example.com?q=a b' -d "hello world" -H ''`)).toEqual(['curl', 'https://example.com?q=a b', '-d', 'hello world', '-H', '']);
		expect(tokenize(`curl abc'def'"ghi"`)).toEqual(['curl', 'abcdefghi']);
	});
	it('menangani escape kutip dan spasi, bukan mengeksekusi shell', () => {
		expect(tokenize(String.raw`curl https://example.com -d "{\"a\":\"b\"}"`)).toContain('{"a":"b"}');
		expect(tokenize(String.raw`curl abc\ def 'a\b' "a\q"`)).toEqual(['curl', 'abc def', 'a\\b', 'a\\q']);
		expect(tokenize(`curl '$HOME'`)).toEqual(['curl', '$HOME']);
	});
	it('menggabungkan lanjutan baris Unix dan Windows termasuk CRLF', () => {
		expect(tokenize('curl \\\n https://example.com ^\r\n -X POST')).toEqual(['curl', 'https://example.com', '-X', 'POST']);
		expect(tokenize('curl "https://example.com" ^\n -H "X-Test: yes"')).toHaveLength(4);
	});
	it('menolak kosong, kutip terbuka, escape menggantung, dan input berlebih', () => {
		for (const input of ['', ' ', "curl 'oops", 'curl "oops', 'curl \\']) expect(() => tokenize(input)).toThrow();
		expect(() => tokenize('x'.repeat(200001))).toThrow('200.000');
	});
});

describe('parser cURL', () => {
	it('GET sederhana dan query asli', () => {
		const r = parseCurl('curl "https://example.com/api?x=1&y=a%20b"');
		expect(r.method).toBe('GET'); expect(r.url).toBe('https://example.com/api?x=1&y=a%20b'); expect(r.body).toBeUndefined(); expect(r.follow).toBe(false);
	});
	it('memakai metode eksplisit, header case-insensitive, dan argumen inline', () => {
		const r = parseCurl(`curl --request=PATCH -H'X-Test: a:b' --header='Content-Type: application/json' -d'{"ok":true}' https://example.com`);
		expect(r.method).toBe('PATCH'); expect(r.headers['x-test']).toBe('a:b'); expect(r.headers['content-type']).toBe('application/json');
		expect(r.body).toEqual({ kind: 'json', value: { ok: true } });
	});
	it('mengonversi --json serta array dan JSON primitif', () => {
		const r = parseCurl(`curl --json '{"a":' --json '1}' https://example.com`);
		expect(r.method).toBe('POST'); expect(r.body).toEqual({ kind: 'json', value: { a: 1 } });
		expect(r.headers.accept).toBe('application/json'); expect(r.headers['content-type']).toBe('application/json');
		expect(parseCurl(`curl --json '[1,2]' https://example.com`).body).toEqual({ kind: 'json', value: [1, 2] });
		expect(parseCurl(`curl --json 'null' https://example.com`).body).toEqual({ kind: 'json', value: null });
	});
	it('mempertahankan JSON tidak valid sebagai teks dengan peringatan', () => {
		const r = parseCurl(`curl --json '{bad}' https://example.com`);
		expect(r.body).toEqual({ kind: 'text', value: '{bad}' }); expect(r.warnings.join()).toContain('bukan JSON valid');
	});
	it('menggabungkan -d/--data/--data-binary dan mendukung --data-raw @ literal', () => {
		const r = parseCurl(`curl -d a=1 --data b=2 --data-binary c=3 https://example.com`);
		expect(r.body).toEqual({ kind: 'text', value: 'a=1&b=2&c=3' }); expect(r.headers['content-type']).toBe('application/x-www-form-urlencoded');
		expect(parseCurl(`curl --data-raw @literal https://example.com`).body).toEqual({ kind: 'text', value: '@literal' });
		expect(parseCurl(`curl -d '' https://example.com`).method).toBe('POST');
	});
	it('melakukan URL encoding dan -G menggabungkan query', () => {
		const r = parseCurl(`curl -G --data-urlencode 'q=a b&c' --data 'page=2' https://example.com/search?first=yes`);
		expect(r.method).toBe('GET'); expect(r.body).toBeUndefined();
		expect(r.url).toBe('https://example.com/search?first=yes&q=a%20b%26c&page=2');
		expect(parseCurl(`curl --data-urlencode '=a b' https://example.com`).body).toEqual({ kind: 'text', value: 'a%20b' });
		expect(parseCurl(`curl -X POST -G -d a=1 https://example.com`).method).toBe('POST');
	});
	it('menghasilkan Basic auth termasuk Unicode dan titik dua password', () => {
		const r = parseCurl(`curl -u 'kamu:rahasia:123' https://example.com`);
		expect(r.headers.authorization).toBe(`Basic ${btoa('kamu:rahasia:123')}`);
		expect(parseCurl(`curl -u 'ü:é' https://example.com`).headers.authorization).toBe('Basic w7w6w6k=');
		expect(parseCurl(`curl -u kamu https://example.com`).warnings.join()).toContain('Password -u kosong');
	});
	it('mempertahankan Authorization eksplisit serta memberi catatan header berulang', () => {
		const r = parseCurl(`curl -H 'Authorization: Bearer a' -u a:b -H 'X-Test: one' -H 'x-test: two' https://example.com`);
		expect(r.headers.authorization).toBe('Bearer a'); expect(r.headers['x-test']).toBe('two'); expect(r.warnings.join()).toContain('berulang');
	});
	it('cookie, user agent, referer, compression, redirects dan TLS', () => {
		const r = parseCurl(`curl -b 'session=abc' --cookie 'lang=id' -A 'Agent 1' -e https://ref.example/ --compressed -L -k https://example.com`);
		expect(r.headers.cookie).toBe('session=abc; lang=id'); expect(r.headers['user-agent']).toBe('Agent 1'); expect(r.headers.referer).toBe('https://ref.example/'); expect(r.follow).toBe(true);
		expect(r.warnings.join()).toContain('-k diabaikan'); expect(r.warnings.join()).toContain('runtime HTTP'); expect(r.warnings.join()).toContain('dibatasi browser');
	});
	it('form teks dan file menyimpan nama, MIME, dan placeholder', () => {
		const r = parseCurl(`curl -F 'title=hello' --form 'upload=@/home/kamu/a.txt;type=text/plain;filename=b.txt' -H 'Content-Type: multipart/form-data' https://example.com`);
		expect(r.body).toEqual({ kind: 'form', parts: [{ name: 'title', value: 'hello', file: false }, { name: 'upload', value: '/home/kamu/a.txt', file: true, type: 'text/plain', filename: 'b.txt' }] });
		expect(r.headers['content-type']).toBeUndefined(); expect(r.warnings.join()).toContain('tidak dibaca');
	});
	it('menandai file body dan cookie file tanpa membaca disk', () => {
		const r = parseCurl(`curl --data-binary @payload.bin -b cookies.txt https://example.com`);
		expect(r.body).toEqual({ kind: 'file', filename: 'payload.bin' }); expect(r.headers.cookie).toBeUndefined(); expect(r.warnings.join()).toContain('Cookie dari file');
	});
	it('memperingatkan flag dan variabel yang tidak didukung', () => {
		const r = parseCurl(`curl --retry 3 -H 'Authorization: Bearer $TOKEN' https://example.com`);
		expect(r.warnings.join()).toContain('--retry'); expect(r.headers.authorization).toBe('Bearer $TOKEN'); expect(r.warnings.join()).toContain('tidak dijalankan');
	});
	it('mendukung curl.exe, --url dan marker akhir opsi', () => {
		expect(parseCurl('curl.exe --url=https://example.com').url).toBe('https://example.com/');
		expect(parseCurl('/usr/bin/curl -- https://example.com').method).toBe('GET');
	});
	it('menolak perintah, URL, dan nilai wajib yang tidak lengkap', () => {
		for (const input of ['wget https://example.com', 'curl', 'curl -X', 'curl --json', 'curl https://a.example https://b.example', 'curl http://', 'curl https://u:p@example.com']) expect(() => parseCurl(input)).toThrow();
		expect(() => parseCurl(`curl -H 'broken' https://example.com`)).toThrow('Header');
		expect(() => parseCurl(`curl -H 'X-Test: a\nb' https://example.com`)).toThrow('baris baru');
	});
	it('menolak campuran body ambigu atau file yang tidak didukung', () => {
		for (const input of [`curl -F x=y -d a=b https://example.com`, `curl -G -F x=y https://example.com`, `curl --data-urlencode x@a.txt https://example.com`, `curl -F bad https://example.com`, `curl --data-binary @ https://example.com`]) expect(() => parseCurl(input)).toThrow();
	});
});

describe('generator JavaScript', () => {
	it('Fetch mengeluarkan objek JSON, stringify, dan redirect sesuai opsi', () => {
		const code = generateCode(parseCurl(`curl --json '{"x":1}' -L https://example.com`), 'fetch');
		expect(code).toContain('const body = {'); expect(code).toContain('"x": 1'); expect(code).toContain('body: JSON.stringify(body)'); expect(code).toContain('redirect: "follow"');
	});
	it('Axios mengeluarkan objek JSON dan string form tanpa transformasi yang salah', () => {
		const code = generateCode(parseCurl(`curl --json '{"x":1}' https://example.com`), 'axios');
		expect(code).toContain('import axios'); expect(code).toContain('data: body'); expect(code).toContain('maxRedirects: 0');
		const formJson = generateCode(parseCurl(`curl -d '{"x":1}' https://example.com`), 'axios');
		expect(formJson).toContain('data: JSON.stringify(body)');
	});
	it('membuat FormData dan placeholder file eksplisit', () => {
		const code = generateCode(parseCurl(`curl -F x=y -F 'upload=@a.txt' https://example.com`), 'fetch');
		expect(code).toContain('new FormData()'); expect(code).toContain('body.append("x", "y")'); expect(code).toContain('new File([], "a.txt"'); expect(code).toContain('TODO');
	});
	it('tidak menghasilkan fetch body GET/HEAD yang tidak bisa dijalankan', () => {
		const request = parseCurl('curl -X GET -d a=b https://example.com');
		expect(generateCode(request, 'fetch')).not.toContain('await fetch'); expect(request.warnings.join()).toContain('body GET/HEAD'); expect(generateCode(request, 'axios')).toContain('data: body');
	});
	it('mengutip kode berbahaya sebagai data dan mempertahankan key __proto__', () => {
		const code = generateCode(parseCurl(`curl --json '{"__proto__":{"x":1},"text":"</script>"}' https://example.com`), 'fetch');
		expect(code).toContain('["__proto__"]:'); expect(code).toContain('"text": "</script>"');
	});
});
