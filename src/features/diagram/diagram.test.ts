import { describe, expect, it } from 'vitest';
import { diagramTemplates, getTemplate } from './templates';
import { extractLineFromMermaidError } from './error-line';

describe('templates', () => {
	it('menyediakan enam jenis diagram sesuai PRD', () => {
		expect(diagramTemplates.map((item) => item.id)).toEqual([
			'flowchart',
			'sequence',
			'erd',
			'class',
			'gantt',
			'state',
		]);
	});

	it('setiap template dimulai dengan kata kunci diagram', () => {
		const keywords = ['flowchart', 'sequenceDiagram', 'erDiagram', 'classDiagram', 'gantt', 'stateDiagram-v2'];
		diagramTemplates.forEach((item, index) => {
			expect(item.code.startsWith(keywords[index]!)).toBe(true);
		});
	});

	it('mencari template berdasarkan id', () => {
		expect(getTemplate('erd')?.label).toBe('ERD');
		expect(getTemplate('tidak-ada')).toBeUndefined();
	});
});

describe('extractLineFromMermaidError', () => {
	const source = 'flowchart TD\n  A --> B\n  B --> ?';

	it('memakai hash.line dari Mermaid (berbasis nol)', () => {
		const error = Object.assign(new Error('Ada yang salah'), { hash: { line: 2 } });
		expect(extractLineFromMermaidError(error, source).line).toBe(3);
	});

	it('membaca nomor baris dari teks pesan', () => {
		const result = extractLineFromMermaidError(new Error('Parse error on line 2:\n  A --> B'), source);
		expect(result.line).toBe(2);
	});

	it('membatasi nomor baris ke jumlah baris sumber', () => {
		const error = Object.assign(new Error('x'), { hash: { line: 99 } });
		expect(extractLineFromMermaidError(error, source).line).toBe(3);
	});

	it('jatuh ke baris 1 kalau tidak ada informasi', () => {
		expect(extractLineFromMermaidError(new Error('gagal'), source).line).toBe(1);
	});

	it('mengambil pesan pertama yang bermakna', () => {
		const result = extractLineFromMermaidError(
			new Error('Parse error on line 3:\n---\nExpecting ARROW, got ?'),
			source,
		);
		expect(result.message).toBe('Expecting ARROW, got ?');
	});

	it('menerjemahkan jenis diagram yang tidak dikenali', () => {
		const result = extractLineFromMermaidError(
			new Error('No diagram type detected matching given configuration for text: halo'),
			'halo',
		);
		expect(result.message).toContain('Jenis diagram tidak dikenali');
	});
});
