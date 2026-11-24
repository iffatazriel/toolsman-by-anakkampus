import { expect, it } from 'vitest';
import { localizedUsage } from './tool-usage';
import type { ToolMeta } from './tool-types';

const metadata = import.meta.glob<{ meta: ToolMeta }>('../features/*/meta.ts', { eager: true });

it('preserves every metadata usage step in ID and EN for every tool', () => {
	for (const { meta } of Object.values(metadata)) {
		const source = meta.usage ?? [];
		const id = localizedUsage(meta.slug, source, 'id');
		const en = localizedUsage(meta.slug, source, 'en');
		expect(id, meta.slug).toEqual(source);
		expect(en, meta.slug).toHaveLength(source.length);
		en.forEach((step, index) => {
			expect(step, `${meta.slug}: ${index}`).not.toBe(source[index]);
			expect(step.length).toBeGreaterThan(0);
		});
	}
});

it('handles empty usage and unknown tools without dropping their source steps', () => {
	expect(localizedUsage('pdf', [], 'en')).toEqual([]);
	expect(localizedUsage('unknown', ['Source'], 'en')).toEqual(['Source']);
});
