export type QrSize = 256 | 512 | 1024;
export type QrCorrection = 'L' | 'M' | 'Q' | 'H';

export interface QrSettings {
	size: QrSize;
	correction: QrCorrection;
	margin: number;
}

export interface QrRenderOptions {
	width: number;
	margin: number;
	errorCorrectionLevel: QrCorrection;
	color: { dark: string; light: string };
}

export function qrOptions(settings: QrSettings): QrRenderOptions {
	return {
		width: settings.size,
		margin: Math.min(8, Math.max(0, Math.round(settings.margin))),
		errorCorrectionLevel: settings.correction,
		color: { dark: '#000000', light: '#ffffff' },
	};
}

export function qrFilename(size: QrSize, extension: 'png' | 'svg'): string {
	return `qr-${size}.${extension}`;
}
