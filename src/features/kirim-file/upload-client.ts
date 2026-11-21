import { currentLang, WorkspaceError } from '../../lib/i18n';
import { apiErrorKey } from './client-errors';
import dict from './i18n';
import { formatRemaining as remaining } from './format';

export interface UploadHandle {
	promise: Promise<void>;
	abort: () => void;
}

export class UploadError extends WorkspaceError<typeof dict> {
	status?: number;

	constructor(key: keyof typeof dict.id, status?: number, values: Record<string, string | number> = {}) {
		super(dict, key, values);
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
			else reject(new UploadError('uploadHttp', xhr.status, { status: xhr.status }));
		});
		xhr.addEventListener('error', () => reject(new UploadError('network')));
		xhr.addEventListener('timeout', () => reject(new UploadError('timeout')));
		xhr.addEventListener('abort', () => reject(new UploadError('uploadCancelled')));
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
		throw new UploadError(apiErrorKey(response.status), response.status, { status: response.status });
	}
	return data;
}

export { formatBytes } from './format';
export function formatRemaining(ms: number): string {
	return remaining(ms, currentLang());
}
