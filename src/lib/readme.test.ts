import { describe, expect, it } from 'vitest';
import { generateReadme, type ReadmeInput } from './readme';

function input(overrides: Partial<ReadmeInput> = {}): ReadmeInput {
	return {
		name: 'alat-pdf',
		description: '',
		features: '',
		install: '',
		usage: '',
		license: '',
		showLicenseBadge: false,
		...overrides,
	};
}

describe('generateReadme', () => {
	it('mengembalikan teks kosong tanpa nama proyek', () => {
		expect(generateReadme(input({ name: '   ' }))).toBe('');
	});

	it('menyusun semua bagian dengan urutan tetap', () => {
		const result = generateReadme(
			input({
				description: '  Gabung, pisah, dan kompres PDF di browser.  ',
				features: 'Gabung PDF\n\n- Pisah PDF',
				install: 'npm install\nnpm run build',
				usage: 'Buka halaman alat, lalu pilih berkas.',
				license: 'MIT',
				showLicenseBadge: true,
			}),
		);

		expect(result).toBe(
			[
				'# alat-pdf',
				'',
				'Gabung, pisah, dan kompres PDF di browser.',
				'',
				'[![Lisensi: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)',
				'',
				'## Fitur',
				'',
				'- Gabung PDF',
				'- Pisah PDF',
				'',
				'## Instalasi',
				'',
				'```bash',
				'npm install',
				'npm run build',
				'```',
				'',
				'## Cara pakai',
				'',
				'Buka halaman alat, lalu pilih berkas.',
				'',
				'## Lisensi',
				'',
				'MIT',
				'',
			].join('\n'),
		);
	});

	it('melewati bagian yang tidak diisi', () => {
		expect(generateReadme(input())).toBe('# alat-pdf\n');
	});

	it('tidak menaruh badge saat lisensi kosong', () => {
		const result = generateReadme(input({ license: '', showLicenseBadge: true }));
		expect(result).not.toContain('shields.io');
		expect(result).not.toContain('## Lisensi');
	});

	it('tidak menaruh badge saat kotak badge tidak dicentang', () => {
		const result = generateReadme(input({ license: 'GPL-3.0', showLicenseBadge: false }));
		expect(result).not.toContain('shields.io');
		expect(result).toContain('## Lisensi\n\nGPL-3.0');
	});

	it('membersihkan penanda daftar yang sudah diketik', () => {
		const result = generateReadme(input({ features: '* satu\n+ dua\n- tiga' }));
		expect(result).toContain('- satu\n- dua\n- tiga');
	});
});
