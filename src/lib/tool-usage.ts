import english from './tool-usage.json';
import type { Lang } from './i18n';

export function localizedUsage(slug: string, steps: readonly string[], lang: Lang): string[] {
	const translations: Record<string, string[]> = english;
	return steps.map((step, index) => lang === 'en' ? translations[slug]?.[index] ?? step : step);
}
