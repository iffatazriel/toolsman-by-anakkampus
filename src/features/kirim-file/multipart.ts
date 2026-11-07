export const PART_SIZE = 8 * 1024 * 1024;
export const MULTIPART_THRESHOLD = PART_SIZE;

export function shouldUseMultipart(size: number): boolean {
	return size > MULTIPART_THRESHOLD;
}

export function partCount(size: number): number {
	return Math.max(1, Math.ceil(size / PART_SIZE));
}

export function partRange(size: number, partNumber: number): { start: number; end: number } {
	if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > partCount(size)) {
		throw new Error('Nomor bagian di luar jangkauan.');
	}

	const start = (partNumber - 1) * PART_SIZE;
	return { start, end: Math.min(size, start + PART_SIZE) };
}

export function partSize(size: number, partNumber: number): number {
	const range = partRange(size, partNumber);
	return range.end - range.start;
}

export function completeXml(parts: { partNumber: number; etag: string }[]): string {
	const items = [...parts]
		.sort((a, b) => a.partNumber - b.partNumber)
		.map(
			(part) =>
				`<Part><PartNumber>${part.partNumber}</PartNumber><ETag>${escapeXml(part.etag)}</ETag></Part>`,
		)
		.join('');

	return `<CompleteMultipartUpload>${items}</CompleteMultipartUpload>`;
}

export function parseUploadId(xml: string): string | null {
	const match = /<UploadId>([\s\S]*?)<\/UploadId>/i.exec(xml);
	if (!match?.[1]) return null;
	return unescapeXml(match[1].trim());
}

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function unescapeXml(value: string): string {
	return value
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&amp;/g, '&');
}
