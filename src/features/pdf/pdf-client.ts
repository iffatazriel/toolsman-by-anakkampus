import type { OutputImage, PreviewImage, WorkerRequest, WorkerResponse } from './pdf.worker';

type Distribute<T> = T extends { id: number } ? Omit<T, 'id'> : never;

export interface PdfResult {
	bytes: Uint8Array;
	pageCount?: number;
	images?: OutputImage[];
	preview?: PreviewImage;
}

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<
	number,
	{
		resolve: (result: PdfResult) => void;
		reject: (error: Error) => void;
		onProgress?: (done: number, total: number) => void;
	}
>();

function getWorker(): Worker {
	if (worker) return worker;
	worker = new Worker(new URL('./pdf.worker.ts', import.meta.url), { type: 'module' });
	worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
		const message = event.data;
		const task = pending.get(message.id);
		if (!task) return;

		if (message.type === 'progress') {
			task.onProgress?.(message.done, message.total);
			return;
		}
		pending.delete(message.id);
		if (message.type === 'error') {
			task.reject(new Error(message.message));
		} else {
			task.resolve({
				bytes: message.bytes,
				pageCount: message.pageCount,
				images: message.images,
				preview: message.preview,
			});
		}
	};
	worker.onerror = () => {
		pending.forEach((task) => task.reject(new Error('Worker PDF berhenti tiba-tiba.')));
		pending.clear();
		worker?.terminate();
		worker = null;
	};
	return worker;
}

export function runPdfTask(
	request: Distribute<WorkerRequest>,
	onProgress?: (done: number, total: number) => void,
): { promise: Promise<PdfResult>; cancel: () => void } {
	const id = nextId;
	nextId += 1;

	const promise = new Promise<PdfResult>((resolve, reject) => {
		pending.set(id, { resolve, reject, onProgress });
		const message = { ...request, id } as WorkerRequest;
		getWorker().postMessage(message);
	});

	return {
		promise,
		cancel: () => {
			if (pending.delete(id)) {
				worker?.terminate();
				worker = null;
				pending.forEach((task) => task.reject(new Error('Dibatalkan.')));
				pending.clear();
			}
		},
	};
}
