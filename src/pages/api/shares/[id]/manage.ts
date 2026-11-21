import type { APIRoute } from 'astro';
import { shareEnv } from '../../../../features/kirim-file/bindings';
import type { ShareFileRow, ShareRow } from '../../../../features/kirim-file/db';
import { MANAGE_TOKEN_PATTERN, verifyManageToken } from '../../../../features/kirim-file/manage-token';
import { allowRequest, clientIp } from '../../../../features/kirim-file/rate-limit';
import { abortMultipartUpload, deleteObject, hasR2Config } from '../../../../features/kirim-file/r2';
import { logEvent } from '../../../../lib/server-log';

export const prerender = false;

function json(data: unknown, status = 200): Response {
	return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function bodyToken(request: Request): Promise<string | undefined> {
	if (!request.body) return undefined;
	const reader = request.body.getReader();
	const decoder = new TextDecoder();
	let text = '', bytes = 0;
	try {
		while (true) {
			const chunk = await reader.read();
			if (chunk.done) break;
			bytes += chunk.value.byteLength;
			if (bytes > 2048) { await reader.cancel(); throw new Error('Body terlalu besar.'); }
			text += decoder.decode(chunk.value, { stream: true });
		}
		text += decoder.decode();
	} finally { reader.releaseLock(); }
	const body: unknown = JSON.parse(text);
	if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => key !== 'token')) throw new Error('Body tidak valid.');
	const token = (body as { token?: unknown }).token;
	if (token !== undefined && typeof token !== 'string') throw new Error('Token harus berupa teks.');
	return token;
}

const manage: APIRoute = async ({ params, request }) => {
	let token: string | undefined;
	try { token = await bodyToken(request); }
	catch { return json({ error: 'Permintaan tidak valid. Pakai JSON dengan field token berupa teks.' }, 400); }
	const authorization = request.headers.get('Authorization');
	if (authorization) {
		const bearer = /^Bearer ([A-Za-z0-9_-]{43})$/i.exec(authorization)?.[1];
		if (!bearer) return json({ error: 'Tidak ditemukan.' }, 404);
		if (token !== undefined && token !== bearer) return json({ error: 'Token header dan body harus sama.' }, 400);
		token = bearer;
	}
	const id = params.id ?? '';
	if (!/^[0-9a-f]{32}$/.test(id)) return json({ error: 'Tidak ditemukan.' }, 404);
	const env = shareEnv();
	if (!env) return json({ error: 'Layanan belum dikonfigurasi.' }, 503);
	try {
		if (!(await allowRequest(env.PASSWORD_LIMIT, `manage:${clientIp(request)}:${id}`))) return json({ error: 'Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.' }, 429);
		if (!token || !MANAGE_TOKEN_PATTERN.test(token)) return json({ error: 'Tidak ditemukan.' }, 404);
		const row = await env.DB.prepare('SELECT * FROM shares WHERE id = ?').bind(id).first<ShareRow & { manage_token_hash: string | null }>();
		const verified = await verifyManageToken(token, row?.manage_token_hash ?? '0'.repeat(64));
		if (!row?.manage_token_hash || !verified) return json({ error: 'Tidak ditemukan.' }, 404);
		const { results: files } = await env.DB.prepare('SELECT * FROM share_files WHERE share_id = ? ORDER BY file_index, rowid').bind(id).all<ShareFileRow>();
		if (request.method === 'DELETE') {
			if (!hasR2Config(env)) return json({ error: 'Penyimpanan berkas belum dikonfigurasi.' }, 503);
			await env.DB.prepare("UPDATE shares SET status = 'deleted' WHERE id = ?").bind(id).run();
			await env.DB.prepare('UPDATE share_files SET purged = 0 WHERE share_id = ?').bind(id).run();
			let failed = false;
			for (const file of files) {
				if (file.upload_id) {
					try { await abortMultipartUpload(env, file.object_key, file.upload_id); }
					catch (error) { logEvent('error', 'shares.manage_abort_failed', { request, shareId: id }, error); failed = true; }
				}
				try { await deleteObject(env, file.object_key); }
				catch (error) { logEvent('error', 'shares.manage_delete_failed', { request, shareId: id }, error); failed = true; }
			}
			if (!failed) await env.DB.prepare('UPDATE share_files SET purged = 1, upload_id = NULL WHERE share_id = ?').bind(id).run();
			return json({ ok: true, pendingCleanup: failed }, failed ? 202 : 200);
		}
		const available = row.status === 'ready' && row.expires_at > Date.now() && !row.takedown_at && files.some((file) => !file.purged && (row.max_downloads === null || file.downloads < row.max_downloads));
		return json({
			status: row.status, available, createdAt: row.created_at, expiresAt: row.expires_at,
			protected: Boolean(row.password_hash), oneTime: row.max_downloads !== null, downloads: row.downloads,
			pendingCleanup: row.status === 'deleted' && files.some((file) => !file.purged || file.upload_id),
			files: files.map((file) => ({ name: file.name, size: file.size, downloads: file.downloads, purged: Boolean(file.purged) })),
		});
	} catch (error) {
		logEvent('error', 'shares.manage_failed', { request, shareId: id }, error);
		return json({ error: 'Kiriman belum bisa dikelola. Coba lagi sebentar.' }, 503);
	}
};

export const POST = manage;
export const DELETE = manage;
