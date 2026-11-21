import { describe, expect, it } from 'vitest';
import { managementChanges, type ManageSnapshot } from './manage-view';

const snapshot: ManageSnapshot = { status: 'ready', available: true, createdAt: 1, expiresAt: 10000, protected: false, oneTime: false, downloads: 0, pendingCleanup: false, files: [] };

describe('notifikasi kelola', () => {
	it('tidak mengumumkan pembacaan pertama atau status tetap', () => {
		expect(managementChanges(null, snapshot)).toEqual([]); expect(managementChanges(snapshot, snapshot)).toEqual([]);
	});
	it('mengumumkan kenaikan unduhan dan perubahan ketersediaan sekali', () => {
		const next = { ...snapshot, downloads: 2, available: false };
		expect(managementChanges(snapshot, next)).toHaveLength(2); expect(managementChanges(snapshot, next)[0]).toContain('2 unduhan baru'); expect(managementChanges(next, next)).toEqual([]);
		expect(managementChanges({ ...snapshot, status: 'uploading', available: false }, { ...next, status: 'deleted' })).toHaveLength(2);
	});
});
