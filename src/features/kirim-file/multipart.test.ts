import { describe, expect, it } from 'vitest';
import {
	MULTIPART_THRESHOLD,
	PART_SIZE,
	completeXml,
	partCount,
	partRange,
	partSize,
	parseUploadId,
	shouldUseMultipart,
} from './multipart';

describe('pemilihan multipart', () => {
	it('hanya memakai multipart untuk berkas di atas batas', () => {
		expect(shouldUseMultipart(MULTIPART_THRESHOLD)).toBe(false);
		expect(shouldUseMultipart(MULTIPART_THRESHOLD + 1)).toBe(true);
	});

	it('menghitung jumlah bagian', () => {
		expect(partCount(1)).toBe(1);
		expect(partCount(PART_SIZE)).toBe(1);
		expect(partCount(PART_SIZE + 1)).toBe(2);
		expect(partCount(PART_SIZE * 3)).toBe(3);
	});
});

describe('rentang bagian', () => {
	it('membagi berkas menjadi potongan 8 MB', () => {
		const size = PART_SIZE + 100;
		expect(partRange(size, 1)).toEqual({ start: 0, end: PART_SIZE });
		expect(partRange(size, 2)).toEqual({ start: PART_SIZE, end: size });
		expect(partSize(size, 1)).toBe(PART_SIZE);
		expect(partSize(size, 2)).toBe(100);
	});

	it('menolak nomor bagian di luar jangkauan', () => {
		expect(() => partRange(100, 0)).toThrow();
		expect(() => partRange(100, 2)).toThrow();
		expect(() => partRange(100, 1.5)).toThrow();
	});
});

describe('XML multipart', () => {
	it('mengurutkan bagian dan meng-escape ETag', () => {
		const xml = completeXml([
			{ partNumber: 2, etag: '"dua"' },
			{ partNumber: 1, etag: '"satu"' },
		]);
		expect(xml.indexOf('<PartNumber>1</PartNumber>')).toBeLessThan(
			xml.indexOf('<PartNumber>2</PartNumber>'),
		);
		expect(xml).toContain('&quot;dua&quot;');
	});

	it('membaca UploadId dari respons R2', () => {
		const xml =
			'<?xml version="1.0"?><InitiateMultipartUploadResult><UploadId>abc+123/def=</UploadId></InitiateMultipartUploadResult>';
		expect(parseUploadId(xml)).toBe('abc+123/def=');
	});

	it('mengembalikan null kalau UploadId tidak ada', () => {
		expect(parseUploadId('<Error/>')).toBeNull();
	});
});
