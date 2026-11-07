import { describe, expect, it } from 'vitest';
import { stripJpegMetadata, stripMetadata, stripPngMetadata } from './strip';

function bytes(values: number[]): Uint8Array {
	return Uint8Array.from(values);
}

function jpegSegment(marker: number, payload: number[]): Uint8Array {
	const length = payload.length + 2;
	return bytes([0xff, marker, (length >> 8) & 0xff, length & 0xff, ...payload]);
}

function pngChunk(type: string, payload: number[]): Uint8Array {
	const length = payload.length;
	const header = [
		(length >>> 24) & 0xff,
		(length >>> 16) & 0xff,
		(length >>> 8) & 0xff,
		length & 0xff,
		...Array.from(type, (char) => char.charCodeAt(0)),
	];
	return bytes([...header, ...payload, 0, 0, 0, 0]);
}

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

describe('stripJpegMetadata', () => {
	const app1 = jpegSegment(0xe1, [
		...Array.from('Exif\0\0', (char) => char.charCodeAt(0)),
		1,
		2,
		3,
		4,
	]);
	const app0 = jpegSegment(0xe0, [
		...Array.from('JFIF\0', (char) => char.charCodeAt(0)),
		1,
		1,
		0,
		0,
	]);
	const sos = bytes([0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0x33]);
	const input = concat([bytes([0xff, 0xd8]), app1, app0, sos]);

	it('membuang APP1 EXIF dan menyisakan segmen lain', () => {
		const result = stripJpegMetadata(input);
		expect(result.ok).toBe(true);
		expect(result.bytes?.[0]).toBe(0xff);
		expect(result.bytes?.[1]).toBe(0xd8);
		expect(result.bytes?.[2]).toBe(0xff);
		expect(result.bytes?.[3]).toBe(0xe0);
		expect(result.bytes?.length).toBe(input.length - app1.length);
		expect(result.removedBytes).toBe(app1.length);
	});

	it('menyalin data setelah SOS tanpa mengubahnya', () => {
		const result = stripJpegMetadata(input);
		const tail = Array.from(result.bytes?.slice(-3) ?? []);
		expect(tail).toEqual([0x11, 0x22, 0x33]);
	});

	it('menolak berkas yang bukan JPEG', () => {
		expect(stripJpegMetadata(bytes([1, 2, 3])).ok).toBe(false);
	});
});

describe('stripPngMetadata', () => {
	const signature = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	const ihdr = pngChunk('IHDR', [0, 0, 0, 1, 0, 0, 0, 1, 8, 0, 0, 0, 0]);
	const text = pngChunk('tEXt', Array.from('Author\0Budi', (char) => char.charCodeAt(0)));
	const iend = pngChunk('IEND', []);
	const input = concat([signature, ihdr, text, iend]);

	it('membuang chunk teks dan mempertahankan IHDR/IEND', () => {
		const result = stripPngMetadata(input);
		expect(result.ok).toBe(true);
		expect(result.removedBytes).toBe(text.length);
		const output = result.bytes ?? new Uint8Array();
		expect(output.length).toBe(input.length - text.length);
		const asText = String.fromCharCode(...Array.from(output));
		expect(asText).toContain('IHDR');
		expect(asText).toContain('IEND');
		expect(asText).not.toContain('tEXt');
	});

	it('menolak berkas yang bukan PNG', () => {
		expect(stripPngMetadata(bytes([1, 2, 3])).ok).toBe(false);
	});
});

describe('stripMetadata', () => {
	it('memilih parser dari mime', () => {
		const input = concat([bytes([0xff, 0xd8]), bytes([0xff, 0xd9])]);
		expect(stripMetadata(input, 'image/jpeg').ok).toBe(true);
	});

	it('memberi pesan untuk format yang belum didukung', () => {
		const result = stripMetadata(bytes([1, 2, 3]), 'image/webp');
		expect(result.ok).toBe(false);
		expect(result.error).toContain('JPG atau PNG');
	});
});
