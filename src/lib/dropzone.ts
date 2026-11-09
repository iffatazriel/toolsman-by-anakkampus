export type DropzoneState = 'empty' | 'drag' | 'processing' | 'done';

/** Dropzone yang membungkus input berkas dengan id tertentu. */
export function dropzoneOf(inputId: string): HTMLElement | null {
	const input = document.getElementById(inputId);
	return input?.closest<HTMLElement>('[data-dropzone]') ?? null;
}

/**
 * Alat memakai ini untuk keadaan `processing` saat pekerjaan berjalan, dan
 * mengembalikannya ke `done` (atau `empty`) setelah selesai. Keadaan `drag`
 * dan `done` diurus komponen Dropzone sendiri.
 */
export function setDropzoneState(zone: HTMLElement | null, state: DropzoneState): void {
	if (zone) zone.dataset.state = state;
}
