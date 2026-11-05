import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { imagesToPdf, mergePdfs, splitPdf } from './pdf-ops';

const PNG_1X1 = Uint8Array.from(
	atob(
		'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
	),
	(char) => char.charCodeAt(0),
);

async function makePdf(pages: number): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	for (let index = 0; index < pages; index += 1) doc.addPage([595, 842]);
	return doc.save();
}

function toBuffer(bytes: Uint8Array): ArrayBuffer {
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

describe('mergePdfs', () => {
	it('menggabungkan halaman sesuai urutan berkas', async () => {
		const merged = await mergePdfs([toBuffer(await makePdf(2)), toBuffer(await makePdf(3))]);
		const doc = await PDFDocument.load(merged);
		expect(doc.getPageCount()).toBe(5);
	});
});

describe('splitPdf', () => {
	it('mengambil halaman yang diminta saja', async () => {
		const split = await splitPdf(toBuffer(await makePdf(4)), [2, 4]);
		const doc = await PDFDocument.load(split);
		expect(doc.getPageCount()).toBe(2);
	});
});

describe('imagesToPdf', () => {
	it('membuat satu halaman per gambar dengan ukuran A4', async () => {
		const result = await imagesToPdf(
			[{ bytes: toBuffer(PNG_1X1), type: 'png' }],
			{ orientation: 'auto', margin: 'small' },
		);
		const doc = await PDFDocument.load(result);
		const page = doc.getPage(0);
		expect(doc.getPageCount()).toBe(1);
		expect(Math.round(page.getWidth())).toBe(595);
		expect(Math.round(page.getHeight())).toBe(842);
	});
});
