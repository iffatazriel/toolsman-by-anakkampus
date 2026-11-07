export interface StripResult {
	ok: boolean;
	bytes?: Uint8Array;
	removedBytes?: number;
	error?: string;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PNG_METADATA_CHUNKS = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME']);

function concat(parts: Uint8Array[]): Uint8Array {
	const total = parts.reduce((sum, part) => sum + part.length, 0);
	const output = new Uint8Array(total);
	let offset = 0;
	for (const part of parts) {
		output.set(part, offset);
		offset += part.length;
	}
	return output;
}

function isPng(bytes: Uint8Array): boolean {
	return PNG_SIGNATURE.every((value, index) => bytes[index] === value);
}

function isJpeg(bytes: Uint8Array): boolean {
	return bytes[0] === 0xff && bytes[1] === 0xd8;
}

export function stripJpegMetadata(bytes: Uint8Array): StripResult {
	if (!isJpeg(bytes)) return { ok: false, error: 'Berkas ini bukan JPEG.' };

	const parts: Uint8Array[] = [bytes.slice(0, 2)];
	let removedBytes = 0;
	let index = 2;

	while (index < bytes.length) {
		const segmentStart = index;
		if (bytes[index] !== 0xff) {
			parts.push(bytes.slice(segmentStart));
			break;
		}

		while (index < bytes.length && bytes[index] === 0xff) index += 1;
		if (index >= bytes.length) {
			parts.push(bytes.slice(segmentStart));
			break;
		}

		const marker = bytes[index]!;
		index += 1;

		if (marker === 0xd9) {
			parts.push(bytes.slice(segmentStart, index));
			break;
		}

		if (marker === 0xda) {
			parts.push(bytes.slice(segmentStart));
			break;
		}

		if ((marker >= 0xd0 && marker <= 0xd8) || marker === 0x01) {
			parts.push(bytes.slice(segmentStart, index));
			continue;
		}

		if (index + 1 >= bytes.length) {
			parts.push(bytes.slice(segmentStart));
			break;
		}

		const length = (bytes[index]! << 8) | bytes[index + 1]!;
		const segmentEnd = index + length;
		if (length < 2 || segmentEnd > bytes.length) {
			parts.push(bytes.slice(segmentStart));
			break;
		}

		const isMetadata = marker === 0xe1 || marker === 0xed || marker === 0xfe;
		if (isMetadata) {
			removedBytes += segmentEnd - segmentStart;
		} else {
			parts.push(bytes.slice(segmentStart, segmentEnd));
		}

		index = segmentEnd;
	}

	return { ok: true, bytes: concat(parts), removedBytes };
}

export function stripPngMetadata(bytes: Uint8Array): StripResult {
	if (!isPng(bytes)) return { ok: false, error: 'Berkas ini bukan PNG.' };

	const parts: Uint8Array[] = [bytes.slice(0, 8)];
	let removedBytes = 0;
	let index = 8;

	while (index + 12 <= bytes.length) {
		const length =
			(bytes[index]! << 24) |
			(bytes[index + 1]! << 16) |
			(bytes[index + 2]! << 8) |
			bytes[index + 3]!;
		const type = String.fromCharCode(
			bytes[index + 4]!,
			bytes[index + 5]!,
			bytes[index + 6]!,
			bytes[index + 7]!,
		);
		const chunkEnd = index + 12 + length;
		if (length < 0 || chunkEnd > bytes.length) {
			parts.push(bytes.slice(index));
			break;
		}

		if (PNG_METADATA_CHUNKS.has(type)) {
			removedBytes += chunkEnd - index;
		} else {
			parts.push(bytes.slice(index, chunkEnd));
		}

		index = chunkEnd;
		if (type === 'IEND') break;
	}

	if (index < bytes.length) parts.push(bytes.slice(index));

	return { ok: true, bytes: concat(parts), removedBytes };
}

export function stripMetadata(bytes: Uint8Array, mime = ''): StripResult {
	if (mime.includes('png') || isPng(bytes)) return stripPngMetadata(bytes);
	if (mime.includes('jpeg') || mime.includes('jpg') || isJpeg(bytes)) {
		return stripJpegMetadata(bytes);
	}
	return { ok: false, error: 'Format ini belum didukung. Pakai JPG atau PNG.' };
}
