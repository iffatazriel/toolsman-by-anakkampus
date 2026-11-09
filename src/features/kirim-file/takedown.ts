export interface TakedownStore {
	listKeys: (shareId: string) => Promise<string[]>;
	markTakenDown: (shareId: string, at: number) => Promise<void>;
	removeObject: (key: string) => Promise<void>;
	clearRows: (shareId: string) => Promise<void>;
}

export interface TakedownResult {
	ok: boolean;
	deleted: number;
	failed: string[];
}

// Takedown manual dipakai saat ada laporan penyalahgunaan yang serius. Urutannya
// penting: link dinonaktifkan dulu supaya berhenti melayani unduhan, baru objek
// R2 dihapus. Kalau ada objek yang gagal dihapus, barisnya dibiarkan agar
// operator bisa menjalankan ulang perintah ini.
export async function takedownShare(
	store: TakedownStore,
	shareId: string,
	now = Date.now(),
): Promise<TakedownResult> {
	const keys = await store.listKeys(shareId);
	await store.markTakenDown(shareId, now);

	const failed: string[] = [];
	let deleted = 0;

	for (const key of keys) {
		try {
			await store.removeObject(key);
			deleted += 1;
		} catch (error) {
			console.error(`Gagal menghapus objek ${key}:`, error);
			failed.push(key);
		}
	}

	if (failed.length === 0) {
		await store.clearRows(shareId);
	}

	return { ok: failed.length === 0, deleted, failed };
}
