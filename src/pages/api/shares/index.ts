import type { APIRoute } from 'astro';
import { allowRequest, clientIp } from '../../../features/kirim-file/rate-limit';
import {
	MAX_FILE_BYTES,
	expiresAt,
	isExpiryId,
	randomToken,
	sanitizeFileName,
	validateFile,
	validatePassword,
} from '../../../features/kirim-file/share-rules';
import { presignUpload, hasR2Config } from '../../../features/kirim-file/r2';
import { hashPassword } from '../../../features/kirim-file/password';
import {
	d1QuotaStore,
	quotaMessage,
	releaseUploadQuota,
	reserveUploadQuota,
} from '../../../features/kirim-file/quota';
import { shareEnv, type ShareEnv } from '../../../features/kirim-file/bindings';
import { verifyTurnstile } from '../../../features/kirim-file/turnstile';
import { createManageToken, hashManageToken } from '../../../features/kirim-file/manage-token';
export const prerender = false;

interface Body {
	files: { name: string; size: number; type: string }[];
	expiry: string;
	password?: string;
	oneTime?: boolean;
	turnstileToken?: string;
}

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
	});
}

export const POST: APIRoute = async ({ request }) => {
	const env: ShareEnv | null = shareEnv();
	if (!env) return json({ error: 'Layanan belum dikonfigurasi.' }, 503);
	if (!hasR2Config(env)) {
		return json({ error: 'Penyimpanan berkas belum diatur di server.' }, 503);
	}

	if (!(await allowRequest(env.UPLOAD_LIMIT, clientIp(request)))) {
		return json({ error: 'Terlalu banyak unggahan dari jaringanmu. Coba lagi sebentar.' }, 429);
	}

	let body: Body;
	try {
		body = (await request.json()) as Body;
	} catch {
		return json({ error: 'Permintaan tidak valid.' }, 400);
	}
	if (!body || typeof body !== 'object' || Array.isArray(body) ||
		(body.password !== undefined && typeof body.password !== 'string') ||
		(body.oneTime !== undefined && typeof body.oneTime !== 'boolean') ||
		(body.turnstileToken !== undefined && typeof body.turnstileToken !== 'string')) {
		return json({ error: 'Permintaan tidak valid. Periksa tipe isian kamu.' }, 400);
	}

	if (!isExpiryId(body.expiry)) return json({ error: 'Masa berlaku tidak dikenal.' }, 400);
	if (!Array.isArray(body.files) || body.files.length === 0 || body.files.length > 10) {
		return json({ error: 'Pilih 1 sampai 10 berkas.' }, 400);
	}

	for (const file of body.files) {
		if (!file || typeof file !== 'object' || typeof file.name !== 'string' || file.name.length > 1000 || typeof file.type !== 'string' || file.type.length > 255 || !Number.isSafeInteger(file.size)) {
			return json({ error: 'Metadata berkas tidak valid. Pilih ulang berkas kamu.' }, 400);
		}
		const problem = validateFile(file);
		if (problem) return json({ error: problem }, 400);
	}

	const password = typeof body.password === 'string' ? body.password : '';
	if (password !== '') {
		const problem = validatePassword(password);
		if (problem) return json({ error: problem }, 400);
	}

	const turnstileSecret = env.TURNSTILE_SECRET_KEY;
	if (!turnstileSecret) {
		return json({ error: 'Verifikasi keamanan belum dikonfigurasi di server.' }, 503);
	}

	const verified = await verifyTurnstile(turnstileSecret, body.turnstileToken, clientIp(request));
	if (!verified) {
		return json(
			{ error: 'Verifikasi keamanan gagal. Selesaikan ulang, lalu coba lagi.' },
			400,
		);
	}

	const oneTime = body.oneTime === true;
	const shareId = randomToken(16);
	const now = Date.now();
	const ip = clientIp(request);
	const totalBytes = body.files.reduce((sum, file) => sum + file.size, 0);
	const expiry = expiresAt(now, body.expiry);

	const quotaStore = d1QuotaStore(env.DB);
	const quota = await reserveUploadQuota(quotaStore, { ip, bytes: totalBytes, now });
	if (!quota.ok) {
		return json({ error: quotaMessage(quota.scope) }, 429);
	}

	try {
		const files = await Promise.all(
			body.files.map(async (file, index) => {
				const safe = sanitizeFileName(file.name);
				const key = `${shareId}/${index}-${safe}`;
				const uploadUrl = await presignUpload(
					env,
					key,
					file.type || 'application/octet-stream',
					file.size,
				);
				return { key, name: safe, size: file.size, type: file.type, uploadUrl };
			}),
		);

		const passwordHash = password === '' ? null : await hashPassword(password);
		const manageToken = createManageToken();
		const manageTokenHash = await hashManageToken(manageToken);

		await env.DB.prepare(
			'INSERT INTO shares (id, expires_at, created_at, status, password_hash, max_downloads, manage_token_hash) VALUES (?, ?, ?, ?, ?, ?, ?)',
		)
			.bind(shareId, expiry, now, 'uploading', passwordHash, oneTime ? 1 : null, manageTokenHash)
			.run();

		for (const [index, file] of files.entries()) {
			await env.DB.prepare(
				'INSERT INTO share_files (share_id, file_index, object_key, name, size, mime) VALUES (?, ?, ?, ?, ?, ?)',
			)
				.bind(shareId, index, file.key, file.name, file.size, file.type)
				.run();
		}

		return json({
			id: shareId,
			manageToken,
			expiresAt: expiry,
			maxBytes: MAX_FILE_BYTES,
			protected: passwordHash !== null,
			oneTime,
			uploads: files.map((file) => ({ name: file.name, uploadUrl: file.uploadUrl })),
		});
	} catch (error) {
		console.error('Gagal menyiapkan share:', error);
		await releaseUploadQuota(quotaStore, { ip, bytes: totalBytes, now }).catch(() => undefined);
		return json({ error: 'Server gagal menyiapkan unggahan. Coba lagi.' }, 500);
	}
};
