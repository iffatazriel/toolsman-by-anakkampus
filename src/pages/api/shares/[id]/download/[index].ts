import type { APIRoute } from 'astro';
import type { ShareFileRow, ShareRow } from '../../../../../features/kirim-file/db';
import { presignDownload, hasR2Config } from '../../../../../features/kirim-file/r2';
import { shareEnv } from '../../../../../features/kirim-file/bindings';
import { isExpired } from '../../../../../features/kirim-file/share-rules';
import { shareAccess } from '../../../../../features/kirim-file/share-access';
import { verifyPassword } from '../../../../../features/kirim-file/password';
import { allowPasswordAttempt, clientIp } from '../../../../../features/kirim-file/rate-limit';
import { logEvent, type LogContext } from '../../../../../lib/server-log';
import { defineWorkspaceDictionary } from '../../../../../lib/i18n';

export const prerender = false;

const ID_PATTERN = /^[0-9a-f]{32}$/;

const messages = defineWorkspaceDictionary({
	service: 'Layanan belum dikonfigurasi.',
	storage: 'Penyimpanan berkas belum diatur di server.',
	notFound: 'Tidak ditemukan.',
	read: 'Data link tidak bisa dibaca.',
	disabled: 'Link ini sudah dinonaktifkan.',
	expired: 'Link sudah kedaluwarsa.',
	passwordRate: 'Terlalu banyak percobaan kata sandi. Coba lagi sebentar.',
	password: 'Kata sandi salah.',
	files: 'Daftar berkas tidak bisa dibaca.',
	limit: 'Batas unduhan berkas ini sudah habis.',
	file: 'Berkas tidak ditemukan.',
	upstream: 'Gagal mengambil berkas dari penyimpanan.',
	claim: 'Gagal mencatat unduhan.',
}, {
	service: 'The service is not configured yet.',
	storage: 'File storage is not configured on the server.',
	notFound: 'Not found.',
	read: 'The share could not be read.',
	disabled: 'This link has been disabled.',
	expired: 'This link has expired.',
	passwordRate: 'Too many password attempts. Try again shortly.',
	password: 'Incorrect password.',
	files: 'The file list could not be read.',
	limit: 'This file has reached its download limit.',
	file: 'File not found.',
	upstream: 'Could not retrieve the file from storage.',
	claim: 'Could not record the download.',
});

function dispose(upstream: Response, context: LogContext): void {
	upstream.body?.cancel().catch((error) => {
		logEvent('warn', 'shares.download_dispose_failed', context, error);
	});
}

export const POST: APIRoute = async ({ params, request }) => {
	let form: FormData | null = null;
	try {
		if (request.body) form = await request.formData();
	} catch (error) {
		logEvent('warn', 'shares.download_invalid_form', { request, shareId: params.id }, error);
	}
	const lang = form?.get('lang') === 'en' ? 'en' : 'id';
	const fail = (key: keyof typeof messages.id, status: number) => new Response(messages[lang][key], {
		status,
		headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Language': lang, 'Cache-Control': 'no-store' },
	});
	const env = shareEnv();
	if (!env) return fail('service', 503);
	if (!hasR2Config(env)) {
		return fail('storage', 503);
	}

	const id = params.id ?? '';
	const index = Number(params.index);
	if (!ID_PATTERN.test(id) || !Number.isInteger(index) || index < 0) {
		return fail('notFound', 404);
	}

	let row: ShareRow | null = null;
	try {
		row = await env.DB.prepare('SELECT * FROM shares WHERE id = ?').bind(id).first<ShareRow>();
	} catch (error) {
		logEvent('warn', 'shares.download_read_failed', { request, shareId: id }, error);
		return fail('read', 503);
	}

	if (!row) return fail('notFound', 404);
	if (row.takedown_at) {
		return fail('disabled', 410);
	}
	if (row.status !== 'ready') return fail('notFound', 404);
	if (isExpired(row.expires_at, Date.now())) {
		return fail('expired', 410);
	}

	if (row.password_hash) {
		if (!(await allowPasswordAttempt(env.PASSWORD_LIMIT, clientIp(request), id))) {
			return fail('passwordRate', 429);
		}

		const password = String(form?.get('password') ?? '');
		if (!(await verifyPassword(password, row.password_hash))) {
			return fail('password', 401);
		}
	}

	let file: ShareFileRow | undefined;
	let fileRows: ShareFileRow[] = [];
	try {
		const { results } = await env.DB.prepare(
			'SELECT * FROM share_files WHERE share_id = ? ORDER BY rowid',
		)
			.bind(id)
			.all<ShareFileRow>();
		fileRows = results;
		file = results[index];
	} catch (error) {
		logEvent('warn', 'shares.download_files_failed', { request, shareId: id }, error);
		return fail('files', 503);
	}

	const access = shareAccess(row, fileRows, Date.now(), true);
	if (access === 'taken-down') {
		return fail('disabled', 410);
	}
	if (access === 'expired' || access === 'exhausted') {
		return fail('limit', 410);
	}
	if (access === 'missing') return fail('notFound', 404);

	if (!file) return fail('file', 404);
	if (file.purged) {
		return fail('limit', 410);
	}

	// Ambil dulu dari R2, baru catat unduhan. Kalau penyimpanan gagal, kuota
	// sekali unduh tidak ikut hangus.
	let upstream: Response;
	try {
		upstream = await fetch(await presignDownload(env, file.object_key, file.name));
	} catch (error) {
		logEvent('warn', 'shares.download_upstream_failed', { request, shareId: id }, error);
		return fail('upstream', 502);
	}
	if (!upstream.ok || !upstream.body) {
		logEvent('warn', 'shares.download_upstream_rejected', { request, shareId: id });
		dispose(upstream, { request, shareId: id });
		return fail('upstream', 502);
	}

	const now = Date.now();
	try {
		if (row.max_downloads !== null) {
			const claim = await env.DB.prepare(
				`UPDATE share_files
				 SET downloads = downloads + 1
				 WHERE share_id = ? AND object_key = ? AND downloads < ?
				 RETURNING downloads`,
			)
				.bind(id, file.object_key, row.max_downloads)
				.first<{ downloads: number }>();

			if (!claim) {
				dispose(upstream, { request, shareId: id });
				return fail('limit', 410);
			}
		} else {
			await env.DB.prepare('UPDATE share_files SET downloads = downloads + 1 WHERE share_id = ? AND object_key = ?')
				.bind(id, file.object_key).run();
		}

		// Kuota tiap berkas sudah dijaga di atas. Kalau pencatatan ringkasan
		// gagal, berkas tetap dikirim dan link tetap dibersihkan oleh cron.
		await env.DB.prepare(
			`UPDATE shares
			 SET downloads = downloads + 1,
			     expires_at = CASE
			       WHEN max_downloads IS NOT NULL AND NOT EXISTS (
			         SELECT 1 FROM share_files
			         WHERE share_id = shares.id AND downloads < shares.max_downloads
			       )
			       THEN ?
			       ELSE expires_at
			     END
			 WHERE id = ?`,
		)
			.bind(now, id)
			.run()
			.catch((error) => { logEvent('warn', 'shares.download_summary_failed', { request, shareId: id }, error); });
	} catch (error) {
		logEvent('warn', 'shares.download_claim_failed', { request, shareId: id }, error);
		dispose(upstream, { request, shareId: id });
		return fail('claim', 503);
	}

	const encoded = encodeURIComponent(file.name);
	return new Response(upstream.body, {
		status: 200,
		headers: {
			// Selalu octet-stream. Jangan pernah biarkan .html atau .svg
			// dirender sebagai halaman di domain ini.
			'Content-Type': 'application/octet-stream',
			'Content-Length': String(file.size),
			'Content-Disposition': `attachment; filename*=UTF-8''${encoded}`,
			'X-Content-Type-Options': 'nosniff',
			'Cache-Control': 'no-store',
		},
	});
};
