import type { ShareFileRow, ShareRow } from './db';

export type ShareAccessState =
	| 'ok'
	| 'locked'
	| 'exhausted'
	| 'expired'
	| 'taken-down'
	| 'missing';

type AccessShare = Pick<
	ShareRow,
	'status' | 'expires_at' | 'password_hash' | 'max_downloads'
> & { takedown_at?: number | null };
type AccessFile = Pick<ShareFileRow, 'downloads' | 'purged'>;

// Satu tempat yang memutuskan apakah sebuah link boleh menghasilkan URL unduh.
// Halaman /s/[id] dan rute unduh memakai aturan yang sama supaya tidak ada
// jalur yang melewati kata sandi, kuota, kedaluwarsa, atau status terhapus.
export function shareAccess(
	share: AccessShare | null,
	files: AccessFile[],
	now: number,
	unlocked = false,
): ShareAccessState {
	// Takedown manual dicek paling awal. Link yang dinonaktifkan operator tidak
	// boleh menampilkan kata sandi, kuota, atau sisa waktu seolah masih hidup.
	if (!share) return 'missing';
	if (share.takedown_at !== null && share.takedown_at !== undefined) return 'taken-down';
	if (share.status !== 'ready') return 'missing';
	if (now >= share.expires_at) return 'expired';
	if (share.password_hash && !unlocked) return 'locked';

	if (share.max_downloads !== null) {
		if (files.length === 0) return 'missing';
		const remaining = files.some(
			(file) => !file.purged && file.downloads < share.max_downloads!,
		);
		if (!remaining) return 'exhausted';
	}

	return 'ok';
}
