import { beforeEach, describe, expect, it } from 'vitest';
import {
	FAVORITES_KEY,
	MAX_RECENT,
	RECENT_KEY,
	isFavorite,
	readFavorites,
	readRecent,
	recordRecent,
	toggleFavorite,
	type StorageLike,
} from './favorites';

function memoryStorage(): StorageLike & { data: Map<string, string> } {
	const data = new Map<string, string>();
	return {
		data,
		getItem: (key) => data.get(key) ?? null,
		setItem: (key, value) => void data.set(key, value),
	};
}

let storage: ReturnType<typeof memoryStorage>;

beforeEach(() => {
	storage = memoryStorage();
});

describe('favorit', () => {
	it('menambah dan menghapus favorit', () => {
		expect(toggleFavorite(storage, 'pdf')).toBe(true);
		expect(readFavorites(storage)).toEqual(['pdf']);
		expect(isFavorite(storage, 'pdf')).toBe(true);

		expect(toggleFavorite(storage, 'pdf')).toBe(false);
		expect(readFavorites(storage)).toEqual([]);
	});

	it('menaruh favorit terbaru di depan', () => {
		toggleFavorite(storage, 'pdf');
		toggleFavorite(storage, 'qr');
		expect(readFavorites(storage)).toEqual(['qr', 'pdf']);
	});

	it('mengabaikan data rusak', () => {
		storage.data.set(FAVORITES_KEY, '{bukan json');
		expect(readFavorites(storage)).toEqual([]);
	});
});

describe('alat terakhir', () => {
	it('menyimpan tanpa duplikat dan yang terbaru di depan', () => {
		recordRecent(storage, 'pdf');
		recordRecent(storage, 'qr');
		recordRecent(storage, 'pdf');
		expect(readRecent(storage)).toEqual(['pdf', 'qr']);
	});

	it('membatasi jumlah riwayat', () => {
		for (let index = 0; index < 10; index += 1) recordRecent(storage, `alat-${index}`);
		const recent = readRecent(storage);
		expect(recent).toHaveLength(MAX_RECENT);
		expect(recent[0]).toBe('alat-9');
	});

	it('tidak menyimpan slug kosong', () => {
		recordRecent(storage, '');
		expect(readRecent(storage)).toEqual([]);
	});

	it('mengabaikan daftar yang bukan array', () => {
		storage.data.set(RECENT_KEY, '"satu"');
		expect(readRecent(storage)).toEqual([]);
	});
});
