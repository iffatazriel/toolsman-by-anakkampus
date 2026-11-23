import { fill, type Lang } from '../../lib/i18n';
import dict from './i18n';

export type PdfMode = 'gabung' | 'pisah' | 'kompres' | 'gambar' | 'ke-gambar' | 'halaman';
export interface ActionState {
	files: number;
	pages: number;
	selected: number;
	hasFile: boolean;
	pending: boolean;
	failed: boolean;
	busy: boolean;
	changed: boolean;
	rangeValid: boolean;
}

export function describeAction(mode: PdfMode, state: ActionState, lang: Lang) {
	const copy = dict[lang];
	const summaryKey = {
		gabung: 'summaryMerge', pisah: 'summarySplit', kompres: 'summaryCompress',
		gambar: 'summaryImages', 'ke-gambar': 'summaryToImages', halaman: 'summaryEdit',
	} as const;
	const summary = fill(copy[summaryKey[mode]], { files: state.files, pages: state.pages, selected: state.selected });
	let reason: string | null = null;
	if (state.busy) reason = copy.preparing;
	else if (state.pending) reason = copy.reading;
	else if (state.failed) reason = copy.fixFiles;
	else if (mode === 'gabung' && state.files < 2) reason = copy.needTwo;
	else if (mode === 'gambar' && state.files === 0) reason = copy.needImages;
	else if (!['gabung', 'gambar'].includes(mode) && !state.hasFile) reason = copy.needFile;
	else if (mode === 'pisah' && !state.rangeValid) reason = copy.rangeEmpty;
	else if (mode === 'halaman' && state.selected === 0) reason = copy.keepPage;
	else if (mode === 'halaman' && !state.changed) reason = copy.editFirst;
	return { summary, reason };
}
