import { MANAGE_TOKEN_PATTERN } from './manage-token';

export interface SavedShare { id: string; token: string; expiresAt: number; fileNames: string[] }
type Store = Pick<Storage, 'getItem' | 'setItem'> | null;
export const SAVED_SHARES_KEY = 'toolsman-kiriman-v1';

export function senderStorage(): Store {
	try { return globalThis.localStorage ?? null; } catch { return null; }
}

function valid(value: unknown, now: number): value is SavedShare {
	if (!value || typeof value !== 'object') return false;
	const share = value as SavedShare;
	return typeof share.id === 'string' && /^[0-9a-f]{32}$/.test(share.id) && typeof share.token === 'string' && MANAGE_TOKEN_PATTERN.test(share.token) && Number.isSafeInteger(share.expiresAt) && share.expiresAt > now && Array.isArray(share.fileNames) && share.fileNames.length > 0 && share.fileNames.length <= 10 && share.fileNames.every((name) => typeof name === 'string' && name.length <= 1000);
}

export function loadSavedShares(storage: Store, now = Date.now()): SavedShare[] {
	try {
		const raw = storage?.getItem(SAVED_SHARES_KEY) ?? '[]';
		const data: unknown = raw.length <= 200000 ? JSON.parse(raw) : [];
		const ids = new Set<string>();
		const shares = Array.isArray(data) ? data.filter((share): share is SavedShare => {
			if (!valid(share, now) || ids.has(share.id)) return false;
			ids.add(share.id); return true;
		}).slice(0, 50).map(({ id, token, expiresAt, fileNames }) => ({ id, token, expiresAt, fileNames })) : [];
		try { storage?.setItem(SAVED_SHARES_KEY, JSON.stringify(shares)); } catch { /* daftar masih bisa dibaca */ }
		return shares;
	} catch { return []; }
}

export function saveShare(storage: Store, share: SavedShare, now = Date.now()): boolean {
	if (!storage || !valid(share, now)) return false;
	try {
		const shares = loadSavedShares(storage, now).filter((saved) => saved.id !== share.id);
		storage.setItem(SAVED_SHARES_KEY, JSON.stringify([share, ...shares].slice(0, 50)));
		return true;
	} catch { return false; }
}

export function removeSavedShare(storage: Store, id: string, now = Date.now()): boolean {
	if (!storage) return false;
	try { storage.setItem(SAVED_SHARES_KEY, JSON.stringify(loadSavedShares(storage, now).filter((share) => share.id !== id))); return true; }
	catch { return false; }
}

export function managePath(id: string, token: string): string {
	return `/kelola/${encodeURIComponent(id)}#t=${encodeURIComponent(token)}`;
}
