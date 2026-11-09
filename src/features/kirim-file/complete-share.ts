import type { ShareFileRow } from './db';

export interface VerifyResult {
	ok: boolean;
	missing: string[];
	mismatched: string[];
}

export interface StorageProbe {
	head: (key: string) => Promise<number | null>;
	remove: (key: string) => Promise<void>;
}

// Dipanggil saat complete. Kalau ada objek yang hilang atau ukurannya tidak
// sama dengan yang didaftarkan, seluruh berkas share dihapus dan share tidak
// pernah ditandai siap. Link setengah jadi lebih buruk daripada link gagal.
export async function verifyUploadedFiles(
	files: Pick<ShareFileRow, 'object_key' | 'name' | 'size'>[],
	probe: StorageProbe,
): Promise<VerifyResult> {
	const missing: string[] = [];
	const mismatched: string[] = [];

	for (const file of files) {
		let size: number | null;
		try {
			size = await probe.head(file.object_key);
		} catch {
			missing.push(file.name);
			continue;
		}

		if (size === null) missing.push(file.name);
		else if (size !== file.size) mismatched.push(file.name);
	}

	if (missing.length === 0 && mismatched.length === 0) {
		return { ok: true, missing, mismatched };
	}

	const cleanup = await Promise.allSettled(
		files.map((file) => probe.remove(file.object_key)),
	);
	for (const [index, result] of cleanup.entries()) {
		if (result.status === 'rejected') {
			console.error(`Gagal menghapus objek ${files[index]?.object_key}:`, result.reason);
		}
	}

	return { ok: false, missing, mismatched };
}
