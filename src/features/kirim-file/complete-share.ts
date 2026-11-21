import type { ShareFileRow } from './db';
import { logEvent, type LogContext } from '../../lib/server-log';

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
	context: LogContext = { route: '/api/shares/:id/complete' },
): Promise<VerifyResult> {
	const missing: string[] = [];
	const mismatched: string[] = [];

	for (const file of files) {
		let size: number | null;
		try {
			size = await probe.head(file.object_key);
		} catch (error) {
			logEvent('warn', 'shares.upload_probe_failed', context, error);
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
	for (const result of cleanup) {
		if (result.status === 'rejected') {
			logEvent('error', 'shares.upload_rollback_failed', context, result.reason);
		}
	}

	return { ok: false, missing, mismatched };
}
