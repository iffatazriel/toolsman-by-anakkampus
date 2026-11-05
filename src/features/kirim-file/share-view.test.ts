import { describe, expect, it } from 'vitest';
import { viewShare } from './share-view';
import { formatBytes, formatRemaining } from './format';

describe('viewShare', () => {
	const now = 1_000_000;

	it('menganggap link belum ada kalau baris kosong', () => {
		expect(viewShare(null, now).state).toBe('missing');
	});

	it('menolak link yang masih dalam proses unggah', () => {
		expect(viewShare({ status: 'uploading', expires_at: now + 1000 }, now).state).toBe('missing');
	});

	it('menolak link yang sudah dihapus', () => {
		expect(viewShare({ status: 'deleted', expires_at: now + 1000 }, now).state).toBe('missing');
	});

	it('menandai link kedaluwarsa tepat saat waktunya tiba', () => {
		expect(viewShare({ status: 'ready', expires_at: now }, now).state).toBe('expired');
	});

	it('menghitung sisa waktu link yang masih berlaku', () => {
		const view = viewShare({ status: 'ready', expires_at: now + 90_000 }, now);
		expect(view.state).toBe('ok');
		expect(view.remainingMs).toBe(90_000);
	});
});

describe('format', () => {
	it('menulis ukuran berkas dalam satuan yang masuk akal', () => {
		expect(formatBytes(512)).toBe('512 B');
		expect(formatBytes(2048)).toBe('2.0 KB');
		expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
	});

	it('menulis sisa waktu dalam hari, jam, atau menit', () => {
		expect(formatRemaining(2 * 24 * 60 * 60 * 1000)).toBe('2 hari 0 jam lagi');
		expect(formatRemaining(3 * 60 * 60 * 1000)).toBe('3 jam 0 menit lagi');
		expect(formatRemaining(25 * 60 * 1000)).toBe('25 menit lagi');
	});

	it('tidak menampilkan sisa waktu negatif', () => {
		expect(formatRemaining(-5000)).toBe('0 menit lagi');
	});
});
