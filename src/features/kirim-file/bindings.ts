// Binding Cloudflare hanya ada saat berjalan di Worker (dev atau deploy).
// Modul ini sengaja tidak diimpor unit test karena 'cloudflare:workers'
// tidak bisa di-resolve di Node.
import { env as cloudflareEnv } from 'cloudflare:workers';
import type { SharesDb } from './db';
import type { RateLimitBinding } from './rate-limit';
import type { R2Env } from './r2';

export interface ShareEnv extends R2Env {
	DB: SharesDb;
	UPLOAD_LIMIT?: RateLimitBinding;
	REPORT_LIMIT?: RateLimitBinding;
	PASSWORD_LIMIT?: RateLimitBinding;
	TURNSTILE_SECRET_KEY?: string;
	ABUSE_WEBHOOK_URL?: string;
}

export function shareEnv(): ShareEnv | null {
	const env = cloudflareEnv as unknown as Partial<ShareEnv> | undefined;
	return env && env.DB ? (env as ShareEnv) : null;
}
