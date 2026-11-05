import type { SharesDb, ShareFileRow } from './db';
import { deleteObject, type R2Env } from './r2';

export interface CleanupEnv extends R2Env {
	DB: SharesDb;
}

const BATCH = 50;

export async function removeExpiredShares(env: CleanupEnv, now = Date.now()): Promise<number> {
	const { results } = await env.DB.prepare(
		"SELECT id FROM shares WHERE status != 'deleted' AND expires_at <= ? LIMIT ?",
	)
		.bind(now, BATCH)
		.all<{ id: string }>();

	for (const share of results) {
		const { results: files } = await env.DB.prepare('SELECT * FROM share_files WHERE share_id = ?')
			.bind(share.id)
			.all<ShareFileRow>();

		for (const file of files) {
			await deleteObject(env, file.object_key);
		}

		await env.DB.prepare("UPDATE shares SET status = 'deleted' WHERE id = ?").bind(share.id).run();
		await env.DB.prepare('DELETE FROM share_files WHERE share_id = ?').bind(share.id).run();
	}

	return results.length;
}

interface ExhaustedFileRow {
	share_id: string;
	object_key: string;
}

export async function purgeExhaustedFiles(env: CleanupEnv, now = Date.now()): Promise<number> {
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

	for (const file of results) {
		await deleteObject(env, file.object_key);
		await env.DB.prepare(
			'UPDATE share_files SET purged = 1 WHERE share_id = ? AND object_key = ?',
		)
			.bind(file.share_id, file.object_key)
			.run();
	}

	return results.length;
}
