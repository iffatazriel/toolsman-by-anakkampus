export interface UploadHandle {
	promise: Promise<void>;
	abort: () => void;
}

export class UploadError extends Error {
	status?: number;

	constructor(message: string, status?: number) {
		super(message);
		this.name = 'UploadError';
		this.status = status;
	}
}

function xhrUpload(
	method: 'PUT' | 'POST',
	url: string,
	body: XMLHttpRequestBodyInit,
	contentType: string,
	onProgress: (loaded: number, total: number) => void,
): UploadHandle {
	let xhr!: XMLHttpRequest;

	const promise = new Promise<void>((resolve, reject) => {
		xhr = new XMLHttpRequest();
		xhr.open(method, url);
		xhr.setRequestHeader('Content-Type', contentType);
		xhr.upload.addEventListener('progress', (event) => {
			if (event.lengthComputable) onProgress(event.loaded, event.total);
		});
		xhr.addEventListener('load', () => {
			if (xhr.status >= 200 && xhr.status < 300) resolve();
			else reject(new UploadError(`Unggah gagal (${xhr.status}).`, xhr.status));
		});
		xhr.addEventListener('error', () => reject(new UploadError('Koneksi terputus saat mengunggah.')));
		xhr.addEventListener('timeout', () => reject(new UploadError('Unggahan melewati batas waktu.')));
		xhr.addEventListener('abort', () => reject(new UploadError('Unggahan dibatalkan.')));
		xhr.send(body);
	});

	return { promise, abort: () => xhr.abort() };
}

export function putWithProgress(
	url: string,
	file: File,
	contentType: string,
	onProgress: (loaded: number, total: number) => void,
): UploadHandle {
	return xhrUpload('PUT', url, file, contentType, onProgress);
}

export function putPartWithProgress(
	url: string,
	chunk: Blob,
	onProgress: (loaded: number, total: number) => void,
): UploadHandle {
	return xhrUpload('PUT', url, chunk, 'application/octet-stream', onProgress);
}

export async function postJson<T>(
	url: string,
	body: unknown,
): Promise<T> {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	const data = (await response.json().catch(() => ({}))) as T & { error?: string };
	if (!response.ok) {
		throw new UploadError(data.error ?? `Permintaan gagal (${response.status}).`, response.status);
	}
	return data;
}

export { formatBytes, formatRemaining } from './format';
