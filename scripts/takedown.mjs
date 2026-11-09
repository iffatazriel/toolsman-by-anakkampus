#!/usr/bin/env node
// Nonaktifkan satu link dan hapus objek R2-nya. Dipakai saat ada laporan
// penyalahgunaan yang serius. Perintah ini mengubah data produksi, jadi jalankan
// dengan sadar: `npm run takedown -- <id-link>`.
//
// Tambahkan `--local` untuk mencoba di D1/R2 lokal (wrangler dev).
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { takedownShare } from '../src/features/kirim-file/takedown.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WRANGLER = resolve(root, 'node_modules/wrangler/bin/wrangler.js');
const DB = 'toolsman-shares';
const BUCKET = 'toolsman-files';
const ID_PATTERN = /^[0-9a-f]{32}$/;

const argv = process.argv.slice(2);
const local = argv.includes('--local');
const id = argv.find((arg) => !arg.startsWith('--'));
const mode = local ? '--local' : '--remote';

if (!id || !ID_PATTERN.test(id)) {
	console.error('Pakai: npm run takedown -- <id-link-32-hex> [--local]');
	process.exit(1);
}

function wrangler(args, capture = false) {
	const output = execFileSync(process.execPath, [WRANGLER, ...args], {
		cwd: root,
		encoding: 'utf8',
		stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
	});
	return capture ? output : '';
}

function query(sql) {
	const output = wrangler(['d1', 'execute', DB, mode, '--json', '--command', sql], true);
	const start = output.indexOf('[');
	if (start === -1) {
		throw new Error(`Keluaran wrangler tidak dikenali: ${output.slice(0, 200)}`);
	}
	const parsed = JSON.parse(output.slice(start));
	return parsed[0]?.results ?? [];
}

const store = {
	async listKeys(shareId) {
		return query(`SELECT object_key FROM share_files WHERE share_id = '${shareId}'`).map(
			(row) => row.object_key,
		);
	},
	async markTakenDown(shareId, at) {
		// status = 'deleted' membuat cron dan halaman berhenti melayani link;
		// takedown_at dipakai halaman /s/[id] untuk membedakan takedown dari
		// link yang sekadar kedaluwarsa.
		query(
			`UPDATE shares SET status = 'deleted', takedown_at = ${Number(at)} WHERE id = '${shareId}'`,
		);
	},
	async removeObject(key) {
		wrangler(['r2', 'object', 'delete', `${BUCKET}/${key}`, mode]);
	},
	async clearRows(shareId) {
		query(
			`DELETE FROM share_files WHERE share_id = '${shareId}';
			 DELETE FROM upload_parts WHERE share_id = '${shareId}';
			 DELETE FROM reports WHERE share_id = '${shareId}'`,
		);
	},
};

try {
	const exists = query(`SELECT status FROM shares WHERE id = '${id}'`);
	if (exists.length === 0) {
		console.error(`Link ${id} tidak ditemukan di ${DB}.`);
		process.exit(1);
	}

	const result = await takedownShare(store, id);

	console.log(`Link ${id} dinonaktifkan.`);
	console.log(`Objek dihapus: ${result.deleted}`);
	if (result.failed.length > 0) {
		console.error('Objek yang gagal dihapus (jalankan ulang perintah ini):');
		for (const key of result.failed) console.error(`  - ${key}`);
		process.exit(1);
	}
	console.log('Selesai. Halaman link sekarang membalas 410.');
} catch (error) {
	console.error('Takedown gagal:', error instanceof Error ? error.message : error);
	process.exit(1);
}
