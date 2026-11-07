import type { ShareEnv } from './bindings';
import type { ShareRow } from './db';
import { isExpired } from './share-rules';

export const SHARE_ID_PATTERN = /^[0-9a-f]{32}$/;

export interface UploadFileRow {
	object_key: string;
	name: string;
	size: number;
	mime: string;
	upload_id: string | null;
}

export function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
	});
}

export async function loadUploadingShare(
	env: ShareEnv,
	id: string,
): Promise<ShareRow | null> {
	const row = await env.DB.prepare('SELECT * FROM shares WHERE id = ?').bind(id).first<ShareRow>();
	if (!row || row.status !== 'uploading' || isExpired(row.expires_at, Date.now())) return null;
	return row;
}

export async function loadUploadFile(
	env: ShareEnv,
	id: string,
	index: number,
): Promise<UploadFileRow | null> {
	return env.DB.prepare(
		'SELECT object_key, name, size, mime, upload_id FROM share_files WHERE share_id = ? AND file_index = ?',
	)
		.bind(id, index)
		.first<UploadFileRow>();
}
