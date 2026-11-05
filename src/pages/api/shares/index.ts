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
import { shareEnv, type ShareEnv } from '../../../features/kirim-file/bindings';
import { turnstileSiteKey, verifyTurnstile } from '../../../features/kirim-file/turnstile';

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

	if (!isExpiryId(body.expiry)) return json({ error: 'Masa berlaku tidak dikenal.' }, 400);
	if (!Array.isArray(body.files) || body.files.length === 0 || body.files.length > 10) {
		return json({ error: 'Pilih 1 sampai 10 berkas.' }, 400);
	}

	for (const file of body.files) {
		const problem = validateFile(file);
		if (problem) return json({ error: problem }, 400);
	}

	const password = typeof body.password === 'string' ? body.password : '';
	if (password !== '') {
		const problem = validatePassword(password);
		if (problem) return json({ error: problem }, 400);
	}

	const siteKey = turnstileSiteKey();
	const turnstileSecret = env.TURNSTILE_SECRET_KEY;
	if (siteKey && !turnstileSecret) {
		return json({ error: 'Verifikasi keamanan belum dikonfigurasi di server.' }, 503);
	}
	if (!siteKey && turnstileSecret) {
		return json({ error: 'Kunci situs Turnstile belum diatur saat build.' }, 503);
	}
	if (siteKey && turnstileSecret) {
		const verified = await verifyTurnstile(
			turnstileSecret,
			body.turnstileToken,
			clientIp(request),
		);
		if (!verified) {
			return json(
				{ error: 'Verifikasi keamanan gagal. Selesaikan ulang, lalu coba lagi.' },
				400,
			);
		}
	}

	const oneTime = body.oneTime === true;
	const shareId = randomToken(16);
	const now = Date.now();
	const expiry = expiresAt(now, body.expiry);

	try {
		const files = await Promise.all(
			body.files.map(async (file, index) => {
				const safe = sanitizeFileName(file.name);
				const key = `${shareId}/${index}-${safe}`;
				const uploadUrl = await presignUpload(env, key, file.type || 'application/octet-stream');
				return { key, name: safe, size: file.size, type: file.type, uploadUrl };
			}),
		);

		const passwordHash = password === '' ? null : await hashPassword(password);

		await env.DB.prepare(
			'INSERT INTO shares (id, expires_at, created_at, status, password_hash, max_downloads) VALUES (?, ?, ?, ?, ?, ?)',
		)
			.bind(shareId, expiry, now, 'uploading', passwordHash, oneTime ? 1 : null)
			.run();

		for (const file of files) {
			await env.DB.prepare(
				'INSERT INTO share_files (share_id, object_key, name, size, mime) VALUES (?, ?, ?, ?, ?)',
			)
				.bind(shareId, file.key, file.name, file.size, file.type)
				.run();
		}

		return json({
			id: shareId,
			expiresAt: expiry,
			maxBytes: MAX_FILE_BYTES,
			protected: passwordHash !== null,
			oneTime,
			uploads: files.map((file) => ({ name: file.name, uploadUrl: file.uploadUrl })),
		});
	} catch (error) {
		console.error('Gagal menyiapkan share:', error);
		return json({ error: 'Server gagal menyiapkan unggahan. Coba lagi.' }, 500);
	}
};
