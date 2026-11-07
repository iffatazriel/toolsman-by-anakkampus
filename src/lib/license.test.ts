import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fillLicense, licenseOptions, type LicenseId } from './license';

const input = { id: 'MIT' as LicenseId, year: 2026, holder: 'Budi', project: 'alat-pdf' };

function templateFor(id: LicenseId): string {
	const option = licenseOptions.find((item) => item.id === id);
	if (!option) throw new Error(`Lisensi ${id} tidak ada.`);
	if (option.text) return option.text;
	const file = id === 'Apache-2.0' ? 'apache-2.0.txt' : 'gpl-3.0.txt';
	return readFileSync(new URL(`../../public/licenses/${file}`, import.meta.url), 'utf8');
}

describe('fillLicense', () => {
	it('mengisi tahun dan pemilik pada MIT', () => {
		const text = fillLicense(templateFor('MIT'), input);
		expect(text).toContain('Copyright (c) 2026 Budi');
		expect(text).not.toContain('{{');
	});

	it('mengisi tahun dan pemilik pada BSD-3-Clause', () => {
		const text = fillLicense(templateFor('BSD-3-Clause'), input);
		expect(text).toContain('Copyright (c) 2026, Budi');
		expect(text).not.toContain('{{');
	});

	it('mengisi placeholder Apache tanpa mengubah teks lain', () => {
		const template = templateFor('Apache-2.0');
		const text = fillLicense(template, input);
		expect(text).toContain('Copyright 2026 Budi');
		expect(text).not.toContain('[yyyy]');
		expect(text).not.toContain('[name of copyright owner]');
		expect(text).toContain('END OF TERMS AND CONDITIONS');
	});

	it('mengisi placeholder GPL pada bagian cara pakai', () => {
		const text = fillLicense(templateFor('GPL-3.0'), input);
		expect(text).toContain('alat-pdf');
		expect(text).toContain('Copyright (C) 2026  Budi');
		expect(text).not.toContain('<name of author>');
		expect(text).not.toContain('<program>');
	});

	it('memakai pemilik sebagai cadangan kalau nama proyek kosong', () => {
		const text = fillLicense(templateFor('GPL-3.0'), { ...input, project: '' });
		expect(text).not.toContain('<one line to give the program');
		expect(text).toContain('Budi');
	});

	it('menyediakan enam pilihan lisensi dengan id unik', () => {
		const ids = licenseOptions.map((option) => option.id);
		expect(ids).toHaveLength(6);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
