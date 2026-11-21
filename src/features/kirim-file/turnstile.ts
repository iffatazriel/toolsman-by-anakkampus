import { logEvent, type LogContext } from '../../lib/server-log';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(
	secret: string | undefined,
	token: unknown,
	remoteIp: string,
	context: LogContext = { route: '/api/shares' },
): Promise<boolean> {
	// Tanpa secret, jangan pernah melewati verifikasi diam-diam. Rute yang
	// memanggil fungsi ini harus menolak permintaan sebagai salah konfigurasi.
	if (!secret) return false;
	if (typeof token !== 'string' || token.trim() === '') return false;

	const body = new URLSearchParams({ secret, response: token });
	if (remoteIp !== 'unknown') body.set('remoteip', remoteIp);

	try {
		const response = await fetch(VERIFY_URL, { method: 'POST', body });
		if (!response.ok) { logEvent('warn', 'shares.turnstile_rejected', context); return false; }
		const result = (await response.json()) as { success?: boolean };
		return result.success === true;
	} catch (error) {
		logEvent('warn', 'shares.turnstile_failed', context, error);
		return false;
	}
}
