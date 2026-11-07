import { describe, expect, it } from 'vitest';
import { buildGitignore, defaultGitignoreGroups, gitignoreGroups } from './gitignore';

describe('buildGitignore', () => {
	it('mengembalikan teks kosong kalau tidak ada pilihan', () => {
		expect(buildGitignore([])).toBe('');
	});

	it('menulis header dan aturan sesuai urutan grup', () => {
		const text = buildGitignore(['node', 'macos']);
		expect(text).toBe(
			'# Node.js\nnode_modules/\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\npnpm-debug.log*\n\n# macOS\n.DS_Store\n',
		);
	});

	it('mengabaikan id yang tidak dikenal', () => {
		expect(buildGitignore(['tidak-ada'])).toBe('');
	});

	it('memberi id unik untuk setiap grup', () => {
		const ids = gitignoreGroups.map((group) => group.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('pilihan bawaan semuanya ada di daftar grup', () => {
		const ids = new Set(gitignoreGroups.map((group) => group.id));
		for (const id of defaultGitignoreGroups) expect(ids.has(id)).toBe(true);
	});
});
