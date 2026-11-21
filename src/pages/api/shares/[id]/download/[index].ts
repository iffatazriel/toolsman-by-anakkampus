import type { APIRoute } from 'astro';
import type { ShareFileRow, ShareRow } from '../../../../../features/kirim-file/db';
import { presignDownload, hasR2Config } from '../../../../../features/kirim-file/r2';
import { shareEnv } from '../../../../../features/kirim-file/bindings';
import { isExpired } from '../../../../../features/kirim-file/share-rules';
import { shareAccess } from '../../../../../features/kirim-file/share-access';
import { verifyPassword } from '../../../../../features/kirim-file/password';
import { allowPasswordAttempt, clientIp } from '../../../../../features/kirim-file/rate-limit';
import { logEvent, type LogContext } from '../../../../../lib/server-log';

export const prerender = false;

const ID_PATTERN = /^[0-9a-f]{32}$/;

function dispose(upstream: Response, context: LogContext): void {
	upstream.body?.cancel().catch((error) => {
		logEvent('warn', 'shares.download_dispose_failed', context, error);
	});
}

export const POST: APIRoute = async ({ params, request }) => {
	const env = shareEnv();
	if (!env) return new Response('Layanan belum dikonfigurasi.', { status: 503 });
	if (!hasR2Config(env)) {
		return new Response('Penyimpanan berkas belum diatur di server.', { status: 503 });
	}

	const id = params.id ?? '';
	const index = Number(params.index);
	if (!ID_PATTERN.test(id) || !Number.isInteger(index) || index < 0) {
		return new Response('Tidak ditemukan.', { status: 404 });
	}

	let row: ShareRow | null = null;
	try {
		row = await env.DB.prepare('SELECT * FROM shares WHERE id = ?').bind(id).first<ShareRow>();
	} catch (error) {
		logEvent('warn', 'shares.download_read_failed', { request, shareId: id }, error);
		return new Response('Data link tidak bisa dibaca.', { status: 503 });
	}

	if (!row) return new Response('Tidak ditemukan.', { status: 404 });
	if (row.takedown_at) {
		return new Response('Link ini sudah dinonaktifkan.', { status: 410 });
	}
	if (row.status !== 'ready') return new Response('Tidak ditemukan.', { status: 404 });
	if (isExpired(row.expires_at, Date.now())) {
		return new Response('Link sudah kedaluwarsa.', { status: 410 });
	}

	if (row.password_hash) {
		if (!(await allowPasswordAttempt(env.PASSWORD_LIMIT, clientIp(request), id))) {
			return new Response('Terlalu banyak percobaan kata sandi. Coba lagi sebentar.', {
				status: 429,
			});
		}

		let password = '';
		try {
			const form = await request.formData();
			password = String(form.get('password') ?? '');
		} catch (error) {
			logEvent('warn', 'shares.download_invalid_form', { request, shareId: id }, error);
			password = '';
		}
		if (!(await verifyPassword(password, row.password_hash))) {
			return new Response('Kata sandi salah.', { status: 401 });
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
		return new Response('Daftar berkas tidak bisa dibaca.', { status: 503 });
	}

	const access = shareAccess(row, fileRows, Date.now(), true);
	if (access === 'taken-down') {
		return new Response('Link ini sudah dinonaktifkan.', { status: 410 });
	}
	if (access === 'expired' || access === 'exhausted') {
		return new Response('Batas unduhan berkas ini sudah habis.', { status: 410 });
	}
	if (access === 'missing') return new Response('Tidak ditemukan.', { status: 404 });

	if (!file) return new Response('Berkas tidak ditemukan.', { status: 404 });
	if (file.purged) {
		return new Response('Batas unduhan berkas ini sudah habis.', { status: 410 });
	}

	// Ambil dulu dari R2, baru catat unduhan. Kalau penyimpanan gagal, kuota
	// sekali unduh tidak ikut hangus.
	let upstream: Response;
	try {
		upstream = await fetch(await presignDownload(env, file.object_key, file.name));
	} catch (error) {
		logEvent('warn', 'shares.download_upstream_failed', { request, shareId: id }, error);
		return new Response('Gagal mengambil berkas dari penyimpanan.', { status: 502 });
	}
	if (!upstream.ok || !upstream.body) {
		logEvent('warn', 'shares.download_upstream_rejected', { request, shareId: id });
		dispose(upstream, { request, shareId: id });
		return new Response('Gagal mengambil berkas dari penyimpanan.', { status: 502 });
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
				return new Response('Batas unduhan berkas ini sudah habis.', { status: 410 });
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
		return new Response('Gagal mencatat unduhan.', { status: 503 });
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
