export interface ResultFile {
	name: string;
	mime: string;
	bytes: Uint8Array;
}

export interface WorkspaceResult {
	signature: string;
	name: string;
	pages: number;
	files: ResultFile[];
	before?: number;
}

export function currentResult(result: WorkspaceResult | undefined, signature: string) {
	return result?.signature === signature ? result : undefined;
}

export function compareSizes(before: number, after: number) {
	return {
		smaller: after < before,
		percent: before > 0 ? Math.round(Math.abs(before - after) / before * 1000) / 10 : 0,
		direction: after < before ? 'smaller' : after > before ? 'larger' : 'equal',
	} as const;
}
