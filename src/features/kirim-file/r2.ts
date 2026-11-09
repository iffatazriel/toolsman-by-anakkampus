import { AwsClient } from 'aws4fetch';
import { completeXml, parseUploadId } from './multipart';

export interface R2Env {
	R2_ACCOUNT_ID: string;
	R2_ACCESS_KEY_ID: string;
	R2_SECRET_ACCESS_KEY: string;
	R2_BUCKET: string;
}

const PRESIGN_SECONDS = 15 * 60;

export function hasR2Config(
	env: Partial<R2Env> | null | undefined,
): env is R2Env {
	return Boolean(
		env?.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET,
	);
}

function client(env: R2Env): AwsClient {
	return new AwsClient({
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
		service: 's3',
		region: 'auto',
	});
}

function objectUrl(env: R2Env, key: string): string {
	return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${key}`;
}

function presignUrl(env: R2Env, key: string): string {
	const url = new URL(objectUrl(env, key));
	// aws4fetch memakai 24 jam kalau tidak diatur; unggahan cukup 15 menit.
	url.searchParams.set('X-Amz-Expires', String(PRESIGN_SECONDS));
	return url.toString();
}

// R2 tidak mendukung presigned POST (unggahan form multipart), jadi
// content-length-range tidak tersedia. Sebagai gantinya Content-Length ikut
// ditandatangani: R2 menolak PUT dengan ukuran lain, dan complete memeriksa
// ulang hasilnya dengan HeadObject.
export async function presignUpload(
	env: R2Env,
	key: string,
	contentType: string,
	size: number,
): Promise<string> {
	const signed = await client(env).sign(presignUrl(env, key), {
		method: 'PUT',
		aws: { signQuery: true, allHeaders: true },
		headers: { 'Content-Type': contentType, 'Content-Length': String(size) },
	});
	return signed.url;
}

// Nama lampiran ikut ditandatangani supaya tautan tidak bisa diubah menjadi
// inline. response-content-type memaksa octet-stream, jadi .html atau .svg yang
// diunggah tidak pernah dirender di domain penyimpanan.
export async function presignDownload(
	env: R2Env,
	key: string,
	filename: string,
): Promise<string> {
	const url = new URL(presignUrl(env, key));
	url.searchParams.set(
		'response-content-disposition',
		`attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
	);
	url.searchParams.set('response-content-type', 'application/octet-stream');

	const signed = await client(env).sign(url.toString(), {
		method: 'GET',
		aws: { signQuery: true },
	});
	return signed.url;
}

export async function headObject(env: R2Env, key: string): Promise<number | null> {
	const response = await client(env).fetch(objectUrl(env, key), { method: 'HEAD' });
	if (response.status === 404) return null;
	if (!response.ok) {
		throw new Error(`Gagal membaca ukuran objek ${key}: ${response.status}`);
	}

	const length = Number(response.headers.get('Content-Length'));
	if (!Number.isFinite(length) || length < 0) {
		throw new Error(`Penyimpanan tidak memberi ukuran objek ${key}.`);
	}
	return length;
}

export async function deleteObject(env: R2Env, key: string): Promise<void> {
	const response = await client(env).fetch(objectUrl(env, key), { method: 'DELETE' });
	if (!response.ok && response.status !== 404) {
		throw new Error(`Gagal menghapus objek ${key}: ${response.status}`);
	}
}

function multipartUrl(
	env: R2Env,
	key: string,
	query: Record<string, string | number>,
): string {
	const url = new URL(objectUrl(env, key));
	for (const [name, value] of Object.entries(query)) {
		url.searchParams.set(name, String(value));
	}
	return url.toString();
}

export async function createMultipartUpload(
	env: R2Env,
	key: string,
	contentType: string,
): Promise<string> {
	const response = await client(env).fetch(`${objectUrl(env, key)}?uploads`, {
		method: 'POST',
		headers: { 'Content-Type': contentType },
	});
	if (!response.ok) {
		throw new Error(`Gagal memulai unggahan multipart: ${response.status}`);
	}

	const uploadId = parseUploadId(await response.text());
	if (!uploadId) throw new Error('Penyimpanan tidak memberi UploadId.');
	return uploadId;
}

export async function uploadPart(
	env: R2Env,
	key: string,
	uploadId: string,
	partNumber: number,
	data: ArrayBuffer,
): Promise<string> {
	const response = await client(env).fetch(
		multipartUrl(env, key, { partNumber, uploadId }),
		{ method: 'PUT', body: data },
	);
	if (!response.ok) {
		throw new Error(`Bagian ${partNumber} gagal diunggah: ${response.status}`);
	}

	const etag = response.headers.get('ETag');
	if (!etag) throw new Error('Penyimpanan tidak mengirim ETag bagian.');
	return etag;
}

export async function completeMultipartUpload(
	env: R2Env,
	key: string,
	uploadId: string,
	parts: { partNumber: number; etag: string }[],
): Promise<void> {
	const response = await client(env).fetch(multipartUrl(env, key, { uploadId }), {
		method: 'POST',
		headers: { 'Content-Type': 'application/xml' },
		body: completeXml(parts),
	});
	if (!response.ok) {
		throw new Error(`Gagal menyelesaikan unggahan multipart: ${response.status}`);
	}

	const body = await response.text();
	if (/<Error>/i.test(body)) {
		throw new Error('Penyimpanan menolak penyelesaian unggahan multipart.');
	}
}

export async function abortMultipartUpload(
	env: R2Env,
	key: string,
	uploadId: string,
): Promise<void> {
	const response = await client(env).fetch(multipartUrl(env, key, { uploadId }), {
		method: 'DELETE',
	});
	if (!response.ok && response.status !== 404) {
		throw new Error(`Gagal membatalkan unggahan multipart: ${response.status}`);
	}
}
