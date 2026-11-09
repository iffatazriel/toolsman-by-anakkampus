import { describe, expect, it } from 'vitest';
import {
	DAILY_BYTES_GLOBAL,
	DAILY_BYTES_PER_IP,
	quotaDay,
	quotaMessage,
	releaseUploadQuota,
	reserveUploadQuota,
	type QuotaStore,
} from './quota';

function makeStore(initial: Record<string, number> = {}) {
	const usage = new Map<string, number>(Object.entries(initial));
	const store: QuotaStore & { usage: Map<string, number> } = {
		usage,
		async reserve(day, key, bytes, limit) {
			const slot = `${day}:${key}`;
			const used = usage.get(slot) ?? 0;
			if (used + bytes > limit) return false;
			usage.set(slot, used + bytes);
			return true;
		},
		async release(day, key, bytes) {
			const slot = `${day}:${key}`;
			usage.set(slot, Math.max(0, (usage.get(slot) ?? 0) - bytes));
		},
	};
	return store;
}

const now = Date.UTC(2026, 10, 8, 3, 0, 0);

describe('quotaDay', () => {
	it('memakai tanggal UTC supaya batas harian tidak mundur di zona waktu lain', () => {
		expect(quotaDay(now)).toBe('2026-11-08');
		expect(quotaDay(Date.UTC(2026, 10, 8, 23, 59, 59))).toBe('2026-11-08');
		expect(quotaDay(Date.UTC(2026, 10, 9, 0, 0, 0))).toBe('2026-11-09');
	});
});

describe('reserveUploadQuota', () => {
	it('menerima unggahan yang masih di bawah batas', async () => {
		const store = makeStore();
		await expect(reserveUploadQuota(store, { ip: '1.1.1.1', bytes: 1024, now })).resolves.toEqual({
			ok: true,
		});
	});

	it('menolak saat batas harian per IP tercapai tanpa menyentuh kuota global', async () => {
		const store = makeStore({ [`2026-11-08:ip:1.1.1.1`]: DAILY_BYTES_PER_IP - 10 });

		const result = await reserveUploadQuota(store, { ip: '1.1.1.1', bytes: 1024, now });

		expect(result).toEqual({ ok: false, scope: 'ip' });
		expect(store.usage.get('2026-11-08:global')).toBeUndefined();
	});

	it('menolak saat kuota harian seluruh layanan tercapai', async () => {
		const store = makeStore({ [`2026-11-08:global`]: DAILY_BYTES_GLOBAL - 10 });

		const result = await reserveUploadQuota(store, { ip: '2.2.2.2', bytes: 1024, now });

		expect(result).toEqual({ ok: false, scope: 'global' });
		expect(store.usage.get('2026-11-08:ip:2.2.2.2')).toBe(0);
	});

	it('menghitung ulang dari nol di hari berikutnya', async () => {
		const store = makeStore({ [`2026-11-08:ip:1.1.1.1`]: DAILY_BYTES_PER_IP });
		await expect(reserveUploadQuota(store, { ip: '1.1.1.1', bytes: 1024, now })).resolves.toEqual({
			ok: false,
			scope: 'ip',
		});

		const tomorrow = now + 24 * 60 * 60 * 1000;
		await expect(
			reserveUploadQuota(store, { ip: '1.1.1.1', bytes: 1024, now: tomorrow }),
		).resolves.toEqual({ ok: true });
	});

	it('mengembalikan kuota kalau unggahan batal', async () => {
		const store = makeStore();
		await reserveUploadQuota(store, { ip: '1.1.1.1', bytes: 1024, now });
		expect(store.usage.get('2026-11-08:ip:1.1.1.1')).toBe(1024);

		await releaseUploadQuota(store, { ip: '1.1.1.1', bytes: 1024, now });

		expect(store.usage.get('2026-11-08:ip:1.1.1.1')).toBe(0);
		expect(store.usage.get('2026-11-08:global')).toBe(0);
	});
});

describe('kuota bawaan', () => {
	it('memakai angka yang masuk akal untuk situs gratis', () => {
		expect(DAILY_BYTES_PER_IP).toBe(500 * 1024 * 1024);
		expect(DAILY_BYTES_GLOBAL).toBe(20 * 1024 * 1024 * 1024);
	});
});

describe('quotaMessage', () => {
	it('memberi pesan ramah, bukan kode error', () => {
		expect(quotaMessage('ip').toLowerCase()).toContain('jatah unggah harianmu');
		expect(quotaMessage('global')).toContain('Kuota unggah hari ini');
	});
});
