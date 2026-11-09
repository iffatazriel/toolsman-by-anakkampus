export const FAVORITES_KEY = 'toolsman-favorites';
export const RECENT_KEY = 'toolsman-recent';
export const PROMPT_FAVORITES_KEY = 'toolsman-prompt-favorites';
export const PROMPT_RECENT_KEY = 'toolsman-prompt-recent';
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

export function readKeyedList(key: string, storage: StorageLike): string[] {
	return read(key, storage);
}

export function isFavorite(storage: StorageLike, slug: string): boolean {
	return readFavorites(storage).includes(slug);
}

export function toggleFavorite(storage: StorageLike, slug: string): boolean {
	return toggleKeyedItem(FAVORITES_KEY, storage, slug);
}

export function toggleKeyedItem(key: string, storage: StorageLike, item: string): boolean {
	const list = read(key, storage);
	const exists = list.includes(item);
	const next = exists ? list.filter((entry) => entry !== item) : [item, ...list];
	write(key, next, storage);
	return !exists;
}

export function readRecent(storage: StorageLike): string[] {
	return readRecentKeyed(RECENT_KEY, storage);
}

export function readRecentKeyed(key: string, storage: StorageLike): string[] {
	return read(key, storage).slice(0, MAX_RECENT);
}

export function recordRecent(storage: StorageLike, slug: string): string[] {
	return recordKeyedRecent(RECENT_KEY, storage, slug);
}

export function recordKeyedRecent(key: string, storage: StorageLike, item: string): string[] {
	const next = [item, ...readRecentKeyed(key, storage).filter((entry) => entry !== item)].slice(
		0,
		MAX_RECENT,
	);
	write(key, next, storage);
	return next;
}
