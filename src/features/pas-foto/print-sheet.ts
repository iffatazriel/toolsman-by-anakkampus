import { cmToPixels, PRINT_DPI } from './sizes';

export type PaperId = '4r' | 'a4';

export interface Paper {
	id: PaperId;
	label: string;
	description: string;
	widthPx: number;
	heightPx: number;
}

export const papers: Paper[] = [
	{
		id: '4r',
		label: '4R',
		description: '10,2 × 15,2 cm, 1200 × 1800 px',
		widthPx: cmToPixels(10.16, PRINT_DPI),
		heightPx: cmToPixels(15.24, PRINT_DPI),
	},
	{
		id: 'a4',
		label: 'A4',
		description: '21 × 29,7 cm, 2480 × 3508 px',
		widthPx: cmToPixels(21, PRINT_DPI),
		heightPx: cmToPixels(29.7, PRINT_DPI),
	},
];

export interface Placement {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface SheetPlan {
	placements: Placement[];
	columns: number;
	rows: number;
	count: number;
	rotated: boolean;
	margin: number;
	gap: number;
}

export interface SheetOptions {
	margin?: number;
	gap?: number;
}

const DEFAULT_MARGIN = cmToPixels(0.3, PRINT_DPI);
const DEFAULT_GAP = cmToPixels(0.2, PRINT_DPI);

export function planSheet(
	paper: Paper,
	photoWidth: number,
	photoHeight: number,
	options: SheetOptions = {},
): SheetPlan {
	const margin = Math.max(0, Math.round(options.margin ?? DEFAULT_MARGIN));
	const gap = Math.max(0, Math.round(options.gap ?? DEFAULT_GAP));
	const sourceWidth = Math.max(1, Math.round(photoWidth));
	const sourceHeight = Math.max(1, Math.round(photoHeight));

	const usableWidth = paper.widthPx - margin * 2;
	const usableHeight = paper.heightPx - margin * 2;

	const candidates = [false, true].map((rotated) => {
		const width = rotated ? sourceHeight : sourceWidth;
		const height = rotated ? sourceWidth : sourceHeight;
		const columns = Math.floor((usableWidth + gap) / (width + gap));
		const rows = Math.floor((usableHeight + gap) / (height + gap));
		const safeColumns = Math.max(0, columns);
		const safeRows = Math.max(0, rows);

		return {
			rotated,
			width,
			height,
			columns: safeColumns,
			rows: safeRows,
			count: safeColumns * safeRows,
		};
	});

	const best = candidates.reduce((winner, candidate) =>
		candidate.count > winner.count ? candidate : winner,
	);

	if (best.count === 0) {
		return { placements: [], columns: 0, rows: 0, count: 0, rotated: false, margin, gap };
	}

	const gridWidth = best.columns * best.width + (best.columns - 1) * gap;
	const gridHeight = best.rows * best.height + (best.rows - 1) * gap;
	const startX = Math.round((paper.widthPx - gridWidth) / 2);
	const startY = Math.round((paper.heightPx - gridHeight) / 2);
	const placements: Placement[] = [];

	for (let row = 0; row < best.rows; row += 1) {
		for (let column = 0; column < best.columns; column += 1) {
			placements.push({
				x: startX + column * (best.width + gap),
				y: startY + row * (best.height + gap),
				width: best.width,
				height: best.height,
			});
		}
	}

	return {
		placements,
		columns: best.columns,
		rows: best.rows,
		count: best.count,
		rotated: best.rotated,
		margin,
		gap,
	};
}
