export interface ManageSnapshot {
	status: 'uploading' | 'ready' | 'deleted'; available: boolean; createdAt: number; expiresAt: number;
	protected: boolean; oneTime: boolean; downloads: number; pendingCleanup: boolean;
	files: { name: string; size: number; downloads: number; purged: boolean }[];
}

export function managementChanges(previous: ManageSnapshot | null, next: ManageSnapshot): string[] {
	if (!previous) return [];
	const messages: string[] = [];
	if (next.downloads > previous.downloads) messages.push(`Ada ${next.downloads - previous.downloads} unduhan baru pada kiriman kamu.`);
	const unavailable = (snapshot: ManageSnapshot) => snapshot.status === 'deleted' || (snapshot.status === 'ready' && !snapshot.available);
	if (!unavailable(previous) && unavailable(next)) messages.push('Kiriman kamu sekarang tidak tersedia untuk penerima.');
	return messages;
}
