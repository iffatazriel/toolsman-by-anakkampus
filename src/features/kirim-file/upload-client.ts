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

export function putWithProgress(
	url: string,
	file: File,
	contentType: string,
	onProgress: (loaded: number, total: number) => void,
): UploadHandle {
	let xhr!: XMLHttpRequest;

	const promise = new Promise<void>((resolve, reject) => {
		xhr = new XMLHttpRequest();
		xhr.open('PUT', url);
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
		xhr.send(file);
	});

	return { promise, abort: () => xhr.abort() };
}

export { formatBytes, formatRemaining } from './format';
