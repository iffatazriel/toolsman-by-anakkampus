// Mengunduh model penghapus latar ke public/models/imgly/ supaya tidak
// bergantung pada CDN staticimgly.com saat dipakai.
//
// Jalankan: npm run models:fetch
// Lalu set PUBLIC_IMGLY_PATH=/models/imgly/ di .env sebelum build.

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'public', 'models', 'imgly');
const pkg = JSON.parse(await readFile(join(root, 'node_modules', '@imgly', 'background-removal', 'package.json'), 'utf8'));
const base = `https://staticimgly.com/@imgly/background-removal-data/${pkg.version}/dist/`;

// Isnet fp16 plus runtime ONNX untuk CPU. Varian jsep (WebGPU) tidak diunduh
// karena halaman memakai device 'cpu'.
const wanted = ['/models/isnet_fp16', '/onnxruntime-web/ort-wasm-simd-threaded.wasm', '/onnxruntime-web/ort-wasm-simd-threaded.mjs'];

async function exists(path) {
	try {
		return (await stat(path)).size > 0;
	} catch {
		return false;
	}
}

async function download(url, path) {
	if (await exists(path)) {
		console.log(`ada      ${path.slice(root.length + 1)}`);
		return;
	}
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Gagal mengunduh ${url} (${response.status})`);
	const buffer = Buffer.from(await response.arrayBuffer());
	await writeFile(path, buffer);
	console.log(`terunduh ${path.slice(root.length + 1)} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
}

await mkdir(target, { recursive: true });

const response = await fetch(new URL('resources.json', base));
if (!response.ok) throw new Error(`resources.json tidak bisa diunduh (${response.status})`);
const resources = await response.json();

const reduced = {};
for (const key of wanted) {
	if (!resources[key]) throw new Error(`Resource ${key} tidak ada di resources.json`);
	reduced[key] = resources[key];
}
await writeFile(join(target, 'resources.json'), `${JSON.stringify(reduced, null, 2)}\n`);

let total = 0;
for (const [key, entry] of Object.entries(reduced)) {
	console.log(`${key} (${(entry.size / 1024 / 1024).toFixed(1)} MB)`);
	for (const chunk of entry.chunks) {
		await download(new URL(chunk.name, base), join(target, chunk.name));
		total += chunk.offsets[1] - chunk.offsets[0];
	}
}

console.log(`\nSelesai. ${(total / 1024 / 1024).toFixed(1)} MB di public/models/imgly/.`);
console.log('Set PUBLIC_IMGLY_PATH=/models/imgly/ di .env lalu build ulang.');
