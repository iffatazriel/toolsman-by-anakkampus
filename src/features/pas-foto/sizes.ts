export interface PhotoSize {
	id: '2x3' | '3x4' | '4x6';
	label: string;
	widthCm: number;
	heightCm: number;
}

export const photoSizes: PhotoSize[] = [
	{ id: '2x3', label: '2×3 cm', widthCm: 2, heightCm: 3 },
	{ id: '3x4', label: '3×4 cm', widthCm: 3, heightCm: 4 },
	{ id: '4x6', label: '4×6 cm', widthCm: 4, heightCm: 6 },
];

export const PRINT_DPI = 300;

const CM_PER_INCH = 2.54;

export function cmToPixels(cm: number, dpi = PRINT_DPI): number {
	return Math.round((cm / CM_PER_INCH) * dpi);
}

export function outputPixels(size: PhotoSize, dpi = PRINT_DPI): { width: number; height: number } {
	return { width: cmToPixels(size.widthCm, dpi), height: cmToPixels(size.heightCm, dpi) };
}

export interface FaceBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface CropRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export function cropForFace(
	face: FaceBox,
	size: PhotoSize,
	imageWidth: number,
	imageHeight: number,
	zoom = 1,
): CropRect {
	const aspect = size.widthCm / size.heightCm;
	const faceCenterX = face.x + face.width / 2;

	const headHeight = face.height * 1.8;
	let cropHeight = headHeight / 0.6;
	let cropWidth = cropHeight * aspect;

	cropHeight /= zoom;
	cropWidth /= zoom;

	cropHeight = Math.min(cropHeight, imageHeight);
	cropWidth = cropHeight * aspect;
	if (cropWidth > imageWidth) {
		cropWidth = imageWidth;
		cropHeight = cropWidth / aspect;
	}

	const top = face.y + face.height / 2 - cropHeight * 0.45;
	const x = clamp(faceCenterX - cropWidth / 2, 0, imageWidth - cropWidth);
	const y = clamp(top, 0, imageHeight - cropHeight);

	return { x, y, width: cropWidth, height: cropHeight };
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), Math.max(min, max));
}
