import type { ShareFileRow } from './db';

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

export function fileDownloadViews(id: string, files: Pick<ShareFileRow, 'name' | 'size' | 'purged' | 'downloads'>[], maxDownloads: number | null) {
	return files.map((file, index) => ({
		name: file.name,
		size: file.size,
		action: `/api/shares/${encodeURIComponent(id)}/download/${index}`,
		remaining: maxDownloads === null ? null : file.purged ? 0 : Math.max(0, maxDownloads - file.downloads),
	}));
}
