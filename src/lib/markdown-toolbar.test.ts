import { describe, expect, it } from 'vitest';
import { applyToolbar, type EditState } from './markdown-toolbar';

function state(value: string, start: number, end = start): EditState {
	return { value, start, end };
}

function selected(next: EditState): string {
	return next.value.slice(next.start, next.end);
}

describe('applyToolbar', () => {
	it('membungkus teks terpilih dengan tebal', () => {
		const next = applyToolbar(state('halo dunia', 5, 10), 'bold');
		expect(next.value).toBe('halo **dunia**');
		expect(selected(next)).toBe('dunia');
	});

	it('mengisi placeholder saat tidak ada pilihan', () => {
		const next = applyToolbar(state('', 0), 'bold');
		expect(next.value).toBe('**teks tebal**');
		expect(selected(next)).toBe('teks tebal');
	});

	it('membungkus teks terpilih dengan miring', () => {
		const next = applyToolbar(state('kata', 0, 4), 'italic');
		expect(next.value).toBe('*kata*');
		expect(selected(next)).toBe('kata');
	});

	it('memberi awalan judul ke setiap baris', () => {
		const next = applyToolbar(state('satu\ndua', 0, 8), 'heading');
		expect(next.value).toBe('## satu\n## dua');
		expect(next.start).toBe(3);
	});

	it('melewati baris kosong saat memberi awalan daftar', () => {
		const next = applyToolbar(state('\nsatu', 0, 5), 'list');
		expect(next.value).toBe('\n- satu');
		expect(next.start).toBe(0);
	});

	it('memakai kutip satu untuk kode sebaris', () => {
		const next = applyToolbar(state('npm install', 0, 11), 'code');
		expect(next.value).toBe('`npm install`');
		expect(selected(next)).toBe('npm install');
	});

	it('memakai blok kode untuk pilihan multi baris', () => {
		const next = applyToolbar(state('baris 1\nbaris 2', 0, 15), 'code');
		expect(next.value).toBe('```\nbaris 1\nbaris 2\n```');
		expect(selected(next)).toBe('baris 1\nbaris 2');
	});

	it('menaruh kursor di alamat tautan', () => {
		const next = applyToolbar(state('lihat dokumen', 6, 13), 'link');
		expect(next.value).toBe('lihat [dokumen](url)');
		expect(selected(next)).toBe('url');
	});

	it('memberi label bawaan saat tautan tanpa pilihan', () => {
		const next = applyToolbar(state('', 0), 'link');
		expect(next.value).toBe('[teks tautan](url)');
		expect(selected(next)).toBe('url');
	});

	it('menyisipkan tabel dan memilih sel pertama', () => {
		const next = applyToolbar(state('', 0), 'table');
		expect(next.value.startsWith('| Kolom 1 | Kolom 2 | Kolom 3 |')).toBe(true);
		expect(next.value).toContain('| --- | --- | --- |');
		expect(selected(next)).toBe('Kolom 1');
	});

	it('memberi jarak sebelum tabel saat sudah ada teks', () => {
		const next = applyToolbar(state('catatan', 7), 'table');
		expect(next.value.startsWith('catatan\n\n| Kolom 1 |')).toBe(true);
	});
});
