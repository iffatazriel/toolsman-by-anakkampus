import type { SharesDb } from './db';

// Batas harian dihitung dari ukuran yang didaftarkan saat share dibuat.
// Ubah angka di sini kalau layanan mulai ramai atau biaya R2 naik.
export const DAILY_BYTES_PER_IP = 500 * 1024 * 1024;
export const DAILY_BYTES_GLOBAL = 20 * 1024 * 1024 * 1024;

export function quotaDay(now: number): string {
	return new Date(now).toISOString().slice(0, 10);
}

export type QuotaScope = 'ip' | 'global';

export type QuotaResult = { ok: true } | { ok: false; scope: QuotaScope };

export interface QuotaStore {
	reserve: (day: string, key: string, bytes: number, limit: number) => Promise<boolean>;
	release: (day: string, key: string, bytes: number) => Promise<void>;
}

export function quotaMessage(scope: QuotaScope): string {
	return scope === 'ip'
		? 'Jatah unggah harianmu sudah habis. Coba lagi besok, atau minta orang lain mengunggah berkasnya.'
		: 'Kuota unggah hari ini untuk seluruh layanan sudah habis. Coba lagi besok.';
}

export async function reserveUploadQuota(
	store: QuotaStore,
	input: { ip: string; bytes: number; now: number },
): Promise<QuotaResult> {
	const day = quotaDay(input.now);
	const ipKey = `ip:${input.ip}`;

	if (!(await store.reserve(day, ipKey, input.bytes, DAILY_BYTES_PER_IP))) {
		return { ok: false, scope: 'ip' };
	}

	if (!(await store.reserve(day, 'global', input.bytes, DAILY_BYTES_GLOBAL))) {
		await store.release(day, ipKey, input.bytes);
		return { ok: false, scope: 'global' };
	}

	return { ok: true };
}

export async function releaseUploadQuota(
	store: QuotaStore,
	input: { ip: string; bytes: number; now: number },
): Promise<void> {
	const day = quotaDay(input.now);
	await Promise.all([
		store.release(day, `ip:${input.ip}`, input.bytes),
		store.release(day, 'global', input.bytes),
	]);
}

export function d1QuotaStore(db: SharesDb): QuotaStore {
	return {
		async reserve(day, key, bytes, limit) {
			if (bytes > limit) return false;

			const row = await db
				.prepare(
					`INSERT INTO upload_usage (day, scope, bytes) VALUES (?, ?, ?)
					 ON CONFLICT(day, scope) DO UPDATE SET bytes = bytes + excluded.bytes
					 WHERE upload_usage.bytes + excluded.bytes <= ?
					 RETURNING bytes`,
				)
				.bind(day, key, bytes, limit)
				.first<{ bytes: number }>();

			return row !== null;
		},

		async release(day, key, bytes) {
			await db
				.prepare(
					'UPDATE upload_usage SET bytes = MAX(0, bytes - ?) WHERE day = ? AND scope = ?',
				)
				.bind(bytes, day, key)
				.run();
		},
	};
}
