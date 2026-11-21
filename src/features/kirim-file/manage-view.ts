import { fill, type Lang } from '../../lib/i18n';
import dict from './i18n';

export interface ManageSnapshot {
	status: 'uploading' | 'ready' | 'deleted'; available: boolean; createdAt: number; expiresAt: number;
	protected: boolean; oneTime: boolean; downloads: number; pendingCleanup: boolean;
	files: { name: string; size: number; downloads: number; purged: boolean }[];
}

export function managementChanges(previous: ManageSnapshot | null, next: ManageSnapshot, lang: Lang = 'id'): string[] {
	if (!previous) return [];
	const messages: string[] = [];
	if (next.downloads > previous.downloads) messages.push(fill(dict[lang].newDownloads, { count: next.downloads - previous.downloads }));
	const unavailable = (snapshot: ManageSnapshot) => snapshot.status === 'deleted' || (snapshot.status === 'ready' && !snapshot.available);
	if (!unavailable(previous) && unavailable(next)) messages.push(dict[lang].becameUnavailable);
	return messages;
}
