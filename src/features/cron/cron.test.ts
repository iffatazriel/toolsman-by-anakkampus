import { describe, expect, it } from 'vitest';
import { explainCron, normalizeCronExpression, previewCron } from './cron';

const from = new Date('2026-01-01T00:00:00.000Z');

describe('normalizeCronExpression', () => {
	it('merapikan spasi berlebih', () => {
		expect(normalizeCronExpression('  0   9  *  *  * ')).toBe('0 9 * * *');
	});
});

describe('explainCron', () => {
	it('menjelaskan jadwal umum dalam bahasa Indonesia', () => {
		expect(explainCron('* * * * *')).toBe('Jadwal berjalan setiap menit.');
		expect(explainCron('*/15 * * * *')).toBe('Jadwal berjalan setiap 15 menit.');
		expect(explainCron('0 9 * * *')).toBe('Jadwal berjalan setiap hari pukul 09.00.');
		expect(explainCron('30 8 * * 1-5')).toBe(
			'Jadwal berjalan setiap hari kerja pukul 08.30.',
		);
		expect(explainCron('0 7 * * 0')).toBe('Jadwal berjalan setiap Minggu pukul 07.00.');
		expect(explainCron('0 0 1 * *')).toBe(
			'Jadwal berjalan setiap tanggal 1 setiap bulan pukul 00.00.',
		);
	});

	it('menjelaskan bulan dan daftar hari', () => {
		expect(explainCron('0 9 * 12 *')).toBe(
			'Jadwal berjalan setiap hari pada bulan Desember pukul 09.00.',
		);
		expect(explainCron('0 9 * * 1,3,5')).toBe(
			'Jadwal berjalan setiap Senin, Rabu dan Jumat pukul 09.00.',
		);
	});

	it('menolak jumlah field yang salah', () => {
		expect(explainCron('0 9 * *')).toContain('5 bagian');
	});
});

describe('previewCron', () => {
	it('menghasilkan lima jadwal berurutan', () => {
		const result = previewCron('*/15 * * * *', 'UTC', 5, from);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.runs).toHaveLength(5);
		expect(result.runs.every((date) => date.getTime() > from.getTime())).toBe(true);
		expect(result.runs.map((date) => date.getUTCMinutes())).toEqual([15, 30, 45, 0, 15]);
	});

	it('menghitung jadwal sesuai zona waktu', () => {
		const jakarta = previewCron('0 9 * * *', 'Asia/Jakarta', 1, from);
		const utc = previewCron('0 9 * * *', 'UTC', 1, from);
		expect(jakarta.ok && utc.ok).toBe(true);
		if (!jakarta.ok || !utc.ok) return;

		expect(jakarta.runs[0]?.toISOString()).toBe('2026-01-01T02:00:00.000Z');
		expect(utc.runs[0]?.toISOString()).toBe('2026-01-01T09:00:00.000Z');
	});

	it('menyertakan penjelasan pada hasil', () => {
		const result = previewCron('30 8 * * 1-5', 'Asia/Jakarta', 2, from);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.explanation).toContain('hari kerja');
	});

	it('menolak ekspresi enam bagian dan ekspresi tidak valid', () => {
		expect(previewCron('0 0 9 * * *', 'UTC').ok).toBe(false);
		expect(previewCron('99 99 * * *', 'UTC').ok).toBe(false);
	});
});
