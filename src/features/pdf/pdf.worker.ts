import { WorkspaceError } from '../../lib/i18n';
import dict from './i18n';
import { classifyPdfError, type PdfErrorCode } from './file-errors';
import * as pdfjs from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
	compressSettings,
	editPdf,
	imagesToPdf,
	mergePdfs,
	rebuildCompressed,
	splitPdf,
	type CompressLevel,
	type Margin,
	type Orientation,
	type PageEdits,
	type RenderedPage,
} from './pdf-ops';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

class WorkerCanvasFactory {
	create(width: number, height: number) {
		if (width <= 0 || height <= 0) throw new WorkspaceError(dict,'canvasSize');
		const canvas = new OffscreenCanvas(width, height);
		const context = canvas.getContext('2d', { willReadFrequently: true });
		if (!context) throw new WorkspaceError(dict,'canvasUnavailable');
		return { canvas, context };
	}

	getNoAlphaContext(canvas: OffscreenCanvas) {
		return canvas.getContext('2d', { alpha: false, willReadFrequently: true });
	}

	reset(
		entry: { canvas: OffscreenCanvas; context: OffscreenCanvasRenderingContext2D | null },
		width: number,
		height: number,
	) {
		entry.canvas.width = Math.max(1, width);
		entry.canvas.height = Math.max(1, height);
	}

	destroy(entry: {
		canvas: OffscreenCanvas | null;
		context: OffscreenCanvasRenderingContext2D | null;
	}) {
		if (entry.canvas) {
			entry.canvas.width = 0;
			entry.canvas.height = 0;
		}
		entry.canvas = null;
		entry.context = null;
	}
}

export interface OutputImage {
	name: string;
	mime: 'image/png' | 'image/jpeg';
	bytes: Uint8Array;
}

export interface PreviewImage {
	mime: 'image/jpeg';
	bytes: Uint8Array;
}

export type WorkerRequest =
	| { id: number; op: 'thumbnail'; file: File; fileId: string; page: number }
	| { id: number; op: 'release-thumbnails'; fileId: string }
	| { id: number; op: 'merge'; files: ArrayBuffer[] }
	| { id: number; op: 'split'; file: ArrayBuffer; pages: number[] }
	| {
			id: number;
			op: 'images';
			images: { bytes: ArrayBuffer; type: 'jpg' | 'png' }[];
			orientation: Orientation;
			margin: Margin;
	  }
	| { id: number; op: 'compress'; file: ArrayBuffer; level: CompressLevel }
	| { id: number; op: 'edit'; file: ArrayBuffer; edits: PageEdits }
	| { id: number; op: 'to-images'; file: ArrayBuffer; format: 'png' | 'jpeg'; scale: number }
	| { id: number; op: 'preview'; file: ArrayBuffer };

export type WorkerResponse =
	| { id: number; type: 'progress'; done: number; total: number }
	| {
			id: number;
			type: 'result';
			bytes: Uint8Array;
			pageCount?: number;
			images?: OutputImage[];
			preview?: PreviewImage;
	  }
	| { id: number; type: 'error'; code: PdfErrorCode };

async function renderPages(bytes: ArrayBuffer, level: CompressLevel, id: number): Promise<RenderedPage[]> {
	const { scale, quality } = compressSettings(level);
	const loadingTask = pdfjs.getDocument({
		data: new Uint8Array(bytes),
		CanvasFactory: WorkerCanvasFactory,
	});
	const doc = await loadingTask.promise;
	const pages: RenderedPage[] = [];

	for (let index = 1; index <= doc.numPages; index += 1) {
		const page = await doc.getPage(index);
		const base = page.getViewport({ scale: 1 });
		const viewport = page.getViewport({ scale });
		const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
		const context = canvas.getContext('2d');
		if (!context) throw new WorkspaceError(dict,'canvasUnavailable');

		await page.render({
			canvasContext: context as unknown as CanvasRenderingContext2D,
			canvas: canvas as unknown as HTMLCanvasElement,
			viewport,
		}).promise;
		const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
		const jpeg = new Uint8Array(await blob.arrayBuffer());

		// Ukuran halaman tetap memakai ukuran asli dalam poin. Skala hanya
		// menambah resolusi gambar, bukan ukuran kertas.
		pages.push({ width: base.width, height: base.height, jpeg });
		postMessage({ id, type: 'progress', done: index, total: doc.numPages } satisfies WorkerResponse);
	}

	await loadingTask.destroy();
	return pages;
}

async function renderPageImages(
	bytes: ArrayBuffer,
	format: 'png' | 'jpeg',
	scale: number,
	id: number,
): Promise<OutputImage[]> {
	const mime = format === 'png' ? 'image/png' : 'image/jpeg';
	const extension = format === 'png' ? 'png' : 'jpg';
	const loadingTask = pdfjs.getDocument({
		data: new Uint8Array(bytes),
		CanvasFactory: WorkerCanvasFactory,
	});
	const doc = await loadingTask.promise;
	const images: OutputImage[] = [];

	for (let index = 1; index <= doc.numPages; index += 1) {
		const page = await doc.getPage(index);
		const viewport = page.getViewport({ scale });
		const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
		const context = canvas.getContext('2d');
		if (!context) throw new WorkspaceError(dict,'canvasUnavailable');

		if (format === 'jpeg') {
			context.fillStyle = '#ffffff';
			context.fillRect(0, 0, canvas.width, canvas.height);
		}

		await page.render({
			canvasContext: context as unknown as CanvasRenderingContext2D,
			canvas: canvas as unknown as HTMLCanvasElement,
			viewport,
		}).promise;

		const blob = await canvas.convertToBlob({
			type: mime,
			quality: format === 'jpeg' ? 0.92 : undefined,
		});
		const pageBytes = new Uint8Array(await blob.arrayBuffer());
		images.push({
			name: `halaman-${String(index).padStart(2, '0')}.${extension}`,
			mime,
			bytes: pageBytes,
		});
		postMessage({ id, type: 'progress', done: index, total: doc.numPages } satisfies WorkerResponse);
	}

	await loadingTask.destroy();
	return images;
}

async function previewPdf(
	bytes: ArrayBuffer,
): Promise<{ preview: PreviewImage; pageCount: number }> {
	const loadingTask = pdfjs.getDocument({
		data: new Uint8Array(bytes),
		CanvasFactory: WorkerCanvasFactory,
	});
	const doc = await loadingTask.promise;
	const pageCount = doc.numPages;
	const page = await doc.getPage(1);
	const base = page.getViewport({ scale: 1 });
	const scale = Math.min(0.6, 300 / base.width);
	const viewport = page.getViewport({ scale });
	const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
	const context = canvas.getContext('2d');
	if (!context) throw new WorkspaceError(dict,'canvasUnavailable');

	context.fillStyle = '#ffffff';
	context.fillRect(0, 0, canvas.width, canvas.height);
	await page.render({
		canvasContext: context as unknown as CanvasRenderingContext2D,
		canvas: canvas as unknown as HTMLCanvasElement,
		viewport,
	}).promise;

	const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.82 });
	const previewBytes = new Uint8Array(await blob.arrayBuffer());
	await loadingTask.destroy();

	return { preview: { mime: 'image/jpeg', bytes: previewBytes }, pageCount };
}

const thumbnailFiles = new Map<string, { task: ReturnType<typeof pdfjs.getDocument>; pages: Map<number, Uint8Array> }>();
let thumbnailQueue: Promise<unknown> = Promise.resolve();

function thumbnailJob<T>(job: () => Promise<T>): Promise<T> {
	const result = thumbnailQueue.then(job);
	thumbnailQueue = result.catch(() => {});
	return result;
}

async function releaseThumbnails(fileId: string) {
	const entry = thumbnailFiles.get(fileId);
	thumbnailFiles.delete(fileId);
	if (entry) await entry.task.destroy();
}

async function pageThumbnail(file: File, fileId: string, number: number) {
	let entry = thumbnailFiles.get(fileId);
	if (!entry) {
		while (thumbnailFiles.size >= 2) await releaseThumbnails(thumbnailFiles.keys().next().value!);
		entry = { task: pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), CanvasFactory: WorkerCanvasFactory }), pages: new Map() };
		thumbnailFiles.set(fileId, entry);
	}
	thumbnailFiles.delete(fileId);
	thumbnailFiles.set(fileId, entry);
	try {
		const doc = await entry.task.promise;
		let bytes = entry.pages.get(number);
		if (!bytes) {
			const page = await doc.getPage(number);
			const base = page.getViewport({ scale: 1 });
			const viewport = page.getViewport({ scale: Math.min(.3, 160 / Math.max(base.width, base.height)) });
			const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
			const context = canvas.getContext('2d');
			if (!context) throw new WorkspaceError(dict, 'canvasUnavailable');
			context.fillStyle = '#ffffff';
			context.fillRect(0, 0, canvas.width, canvas.height);
			await page.render({ canvasContext: context as unknown as CanvasRenderingContext2D, canvas: canvas as unknown as HTMLCanvasElement, viewport }).promise;
			bytes = new Uint8Array(await (await canvas.convertToBlob({ type: 'image/jpeg', quality: .7 })).arrayBuffer());
			entry.pages.set(number, bytes);
			if (entry.pages.size > 48) entry.pages.delete(entry.pages.keys().next().value!);
			page.cleanup();
			canvas.width = canvas.height = 0;
		}
		return { preview: { mime: 'image/jpeg' as const, bytes: bytes.slice() }, pageCount: doc.numPages };
	} catch (error) {
		await releaseThumbnails(fileId);
		throw error;
	}
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
	const request = event.data;
	try {
		let bytes: Uint8Array = new Uint8Array();
		let pageCount: number | undefined;
		let images: OutputImage[] | undefined;
		let preview: PreviewImage | undefined;

		if (request.op === 'thumbnail') {
			const result = await thumbnailJob(() => pageThumbnail(request.file, request.fileId, request.page));
			preview = result.preview;
			pageCount = result.pageCount;
		} else if (request.op === 'release-thumbnails') {
			await thumbnailJob(() => releaseThumbnails(request.fileId));
		} else if (request.op === 'merge') {
			bytes = await mergePdfs(request.files);
		} else if (request.op === 'split') {
			bytes = await splitPdf(request.file, request.pages);
			pageCount = request.pages.length;
		} else if (request.op === 'images') {
			bytes = await imagesToPdf(request.images, {
				orientation: request.orientation,
				margin: request.margin,
			});
		} else if (request.op === 'compress') {
			const pages = await renderPages(request.file, request.level, request.id);
			bytes = await rebuildCompressed(pages);
			pageCount = pages.length;
		} else if (request.op === 'edit') {
			bytes = await editPdf(request.file, request.edits);
		} else if (request.op === 'preview') {
			const info = await previewPdf(request.file);
			preview = info.preview;
			pageCount = info.pageCount;
		} else {
			images = await renderPageImages(request.file, request.format, request.scale, request.id);
			pageCount = images.length;
		}

		const response: WorkerResponse = {
			id: request.id,
			type: 'result',
			bytes,
			pageCount,
			images,
			preview,
		};
		const transfer: ArrayBuffer[] = [bytes.buffer as ArrayBuffer];
		images?.forEach((image) => transfer.push(image.bytes.buffer as ArrayBuffer));
		if (preview) transfer.push(preview.bytes.buffer as ArrayBuffer);
		postMessage(response, { transfer });
	} catch (error) {
		postMessage({ id: request.id, type: 'error', code: classifyPdfError(error) } satisfies WorkerResponse);
	}
};
