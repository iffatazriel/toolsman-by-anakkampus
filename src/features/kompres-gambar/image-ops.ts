export type OutputFormat = 'jpeg' | 'png' | 'webp';

export interface FitResult {
	width: number;
	height: number;
	scaled: boolean;
}

export function fitWithin(
	width: number,
	height: number,
	maxWidth: number,
	maxHeight: number,
): FitResult {
	if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
		return { width: 1, height: 1, scaled: false };
	}

	const safeWidth = Math.max(1, maxWidth);
	const safeHeight = Math.max(1, maxHeight);
	const scale = Math.min(1, safeWidth / width, safeHeight / height);

	if (scale >= 1) return { width: Math.round(width), height: Math.round(height), scaled: false };

	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale)),
		scaled: true,
	};
}

export function mimeFor(format: OutputFormat): string {
	if (format === 'png') return 'image/png';
	if (format === 'webp') return 'image/webp';
	return 'image/jpeg';
}

export function extensionFor(format: OutputFormat): string {
	return format === 'jpeg' ? 'jpg' : format;
}

export function outputFileName(original: string, format: OutputFormat): string {
	const base = original.replace(/\.[^.]+$/, '').trim() || 'gambar';
	return `${base}-kompres.${extensionFor(format)}`;
}

export function qualityFor(format: OutputFormat, quality: number): number | undefined {
	if (format === 'png') return undefined;
	return Math.min(1, Math.max(0.1, quality));
}
