export const FAVORITES_KEY = 'toolsman-favorites';
export const RECENT_KEY = 'toolsman-recent';
export const MAX_RECENT = 6;

export interface StorageLike {
	getItem: (key: string) => string | null;
	setItem: (key: string, value: string) => void;
}

function read(key: string, storage: StorageLike): string[] {
	try {
		const parsed: unknown = JSON.parse(storage.getItem(key) ?? '[]');
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((item): item is string => typeof item === 'string' && item !== '');
	} catch {
		return [];
	}
}

function write(key: string, list: string[], storage: StorageLike): void {
	try {
		storage.setItem(key, JSON.stringify(list));
	} catch {
		// Mode privat atau kuota penuh: simpanan dilewati, alat tetap jalan.
	}
}

export function readFavorites(storage: StorageLike): string[] {
	return read(FAVORITES_KEY, storage);
}

export function isFavorite(storage: StorageLike, slug: string): boolean {
	return readFavorites(storage).includes(slug);
}

export function toggleFavorite(storage: StorageLike, slug: string): boolean {
	const favorites = readFavorites(storage);
	const exists = favorites.includes(slug);
	const next = exists ? favorites.filter((item) => item !== slug) : [slug, ...favorites];
	write(FAVORITES_KEY, next, storage);
	return !exists;
}

export function readRecent(storage: StorageLike): string[] {
	return read(RECENT_KEY, storage).slice(0, MAX_RECENT);
}

export function recordRecent(storage: StorageLike, slug: string): string[] {
	const next = [slug, ...readRecent(storage).filter((item) => item !== slug)].slice(
		0,
		MAX_RECENT,
	);
	write(RECENT_KEY, next, storage);
	return next;
}
