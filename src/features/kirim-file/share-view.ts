export type ShareState = 'ok' | 'expired' | 'missing';

export interface ShareView {
	state: ShareState;
	remainingMs: number;
}

interface ShareRowLike {
	status: 'uploading' | 'ready' | 'deleted';
	expires_at: number;
}

export function viewShare(row: ShareRowLike | null, now: number): ShareView {
	if (!row || row.status !== 'ready') return { state: 'missing', remainingMs: 0 };
	if (now >= row.expires_at) return { state: 'expired', remainingMs: 0 };
	return { state: 'ok', remainingMs: row.expires_at - now };
}
