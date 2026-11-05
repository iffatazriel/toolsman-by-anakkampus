import { PDFDocument } from 'pdf-lib';

export type Orientation = 'portrait' | 'landscape' | 'auto';
export type Margin = 'none' | 'small' | 'large';
export type CompressLevel = 'ringan' | 'sedang' | 'maksimal';

const marginPoints: Record<Margin, number> = { none: 0, small: 24, large: 48 };

const compressProfile: Record<CompressLevel, { scale: number; quality: number }> = {
	ringan: { scale: 1.5, quality: 0.85 },
	sedang: { scale: 1.2, quality: 0.7 },
	maksimal: { scale: 1, quality: 0.5 },
};

export async function mergePdfs(files: ArrayBuffer[]): Promise<Uint8Array> {
	const out = await PDFDocument.create();
	for (const bytes of files) {
		const source = await PDFDocument.load(bytes, { ignoreEncryption: false });
		const pages = await out.copyPages(source, source.getPageIndices());
		pages.forEach((page) => out.addPage(page));
	}
	return out.save();
}

export async function splitPdf(bytes: ArrayBuffer, pages: number[]): Promise<Uint8Array> {
	const source = await PDFDocument.load(bytes);
	const out = await PDFDocument.create();
	const copied = await out.copyPages(
		source,
		pages.map((page) => page - 1),
	);
	copied.forEach((page) => out.addPage(page));
	return out.save();
}

export async function imagesToPdf(
	images: { bytes: ArrayBuffer; type: 'jpg' | 'png' }[],
	options: { orientation: Orientation; margin: Margin },
): Promise<Uint8Array> {
	const out = await PDFDocument.create();
	const pad = marginPoints[options.margin];

	for (const image of images) {
		const embedded =
			image.type === 'png' ? await out.embedPng(image.bytes) : await out.embedJpg(image.bytes);
		const naturalLandscape = embedded.width > embedded.height;
		const landscape =
			options.orientation === 'auto' ? naturalLandscape : options.orientation === 'landscape';

		const pageWidth = landscape ? 842 : 595;
		const pageHeight = landscape ? 595 : 842;
		const page = out.addPage([pageWidth, pageHeight]);

		const maxW = pageWidth - pad * 2;
		const maxH = pageHeight - pad * 2;
		const scale = Math.min(maxW / embedded.width, maxH / embedded.height);
		const w = embedded.width * scale;
		const h = embedded.height * scale;

		page.drawImage(embedded, {
			x: (pageWidth - w) / 2,
			y: (pageHeight - h) / 2,
			width: w,
			height: h,
		});
	}

	return out.save();
}

export interface RenderedPage {
	width: number;
	height: number;
	jpeg: Uint8Array;
}

export async function rebuildCompressed(
	pages: RenderedPage[],
): Promise<Uint8Array> {
	const out = await PDFDocument.create();
	for (const page of pages) {
		const image = await out.embedJpg(page.jpeg);
		const pdfPage = out.addPage([page.width, page.height]);
		pdfPage.drawImage(image, { x: 0, y: 0, width: page.width, height: page.height });
	}
	return out.save();
}

export function compressSettings(level: CompressLevel) {
	return compressProfile[level];
}
