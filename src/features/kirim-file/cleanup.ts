import type { SharesDb, ShareFileRow } from './db';
import { abortMultipartUpload, deleteObject, type R2Env } from './r2';

export interface CleanupEnv extends R2Env {
	DB: SharesDb;
}

const BATCH = 50;
const DEFAULT_BUDGET_MS = 20_000;

interface BatchResult {
	processed: number;
	removed: number;
}

async function removeExpiredBatch(env: CleanupEnv, now: number): Promise<BatchResult> {
	const { results } = await env.DB.prepare(
		"SELECT id FROM shares WHERE status != 'deleted' AND expires_at <= ? LIMIT ?",
	)
		.bind(now, BATCH)
		.all<{ id: string }>();

	let removed = 0;

	for (const share of results) {
		const { results: files } = await env.DB.prepare('SELECT * FROM share_files WHERE share_id = ?')
			.bind(share.id)
			.all<ShareFileRow>();

		let failed = false;

		for (const file of files) {
			if (file.upload_id) {
				await abortMultipartUpload(env, file.object_key, file.upload_id).catch((error) => {
					console.error(`Gagal membatalkan unggahan ${file.object_key}:`, error);
					failed = true;
				});
			}

			try {
				await deleteObject(env, file.object_key);
			} catch (error) {
				console.error(`Gagal menghapus objek ${file.object_key}:`, error);
				failed = true;
			}
		}

		// Kalau satu objek gagal dihapus, jangan hapus barisnya. Cron berikutnya
		// akan mencoba lagi, jadi tidak ada objek yang tertinggal tanpa jejak.
		if (failed) continue;

		try {
			await env.DB.prepare("UPDATE shares SET status = 'deleted' WHERE id = ?")
				.bind(share.id)
				.run();
			await env.DB.prepare('DELETE FROM upload_parts WHERE share_id = ?').bind(share.id).run();
			await env.DB.prepare('DELETE FROM share_files WHERE share_id = ?').bind(share.id).run();
			await env.DB.prepare('DELETE FROM reports WHERE share_id = ?').bind(share.id).run();
			removed += 1;
		} catch (error) {
			console.error(`Gagal membersihkan data share ${share.id}:`, error);
		}
	}

	return { processed: results.length, removed };
}

export async function removeExpiredShares(
	env: CleanupEnv,
	now = Date.now(),
	budgetMs = DEFAULT_BUDGET_MS,
): Promise<number> {
	const deadline = Date.now() + budgetMs;
	let total = 0;

	while (Date.now() < deadline) {
		const batch = await removeExpiredBatch(env, now);
		total += batch.removed;

		if (batch.processed < BATCH) break;
		// Tidak ada kemajuan berarti sisa antrean gagal terus. Berhenti supaya
		// cron tidak berputar sampai batas waktu.
		if (batch.removed === 0) break;
	}

	return total;
}

interface ExhaustedFileRow {
	share_id: string;
	object_key: string;
}

interface PurgeResult {
	processed: number;
	purged: number;
}

async function purgeExhaustedBatch(env: CleanupEnv, now: number): Promise<PurgeResult> {
	const { results } = await env.DB.prepare(
		`SELECT f.share_id AS share_id, f.object_key AS object_key
		 FROM share_files f
		 JOIN shares s ON s.id = f.share_id
		 WHERE f.purged = 0
		   AND s.status = 'ready'
		   AND s.max_downloads IS NOT NULL
		   AND f.downloads >= s.max_downloads
		   AND s.expires_at > ?
		 LIMIT ?`,
	)
		.bind(now, BATCH)
		.all<ExhaustedFileRow>();

	let purged = 0;

	for (const file of results) {
		try {
			await deleteObject(env, file.object_key);
			await env.DB.prepare(
				'UPDATE share_files SET purged = 1 WHERE share_id = ? AND object_key = ?',
			)
				.bind(file.share_id, file.object_key)
				.run();
			purged += 1;
		} catch (error) {
			console.error(`Gagal menghapus berkas habis pakai ${file.object_key}:`, error);
		}
	}

	return { processed: results.length, purged };
}

export async function purgeExhaustedFiles(
	env: CleanupEnv,
	now = Date.now(),
	budgetMs = DEFAULT_BUDGET_MS,
): Promise<number> {
	const deadline = Date.now() + budgetMs;
	let total = 0;

	while (Date.now() < deadline) {
		const batch = await purgeExhaustedBatch(env, now);
		total += batch.purged;

		if (batch.processed < BATCH) break;
		if (batch.purged === 0) break;
	}

	return total;
}
