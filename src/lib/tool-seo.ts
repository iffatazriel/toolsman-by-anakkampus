import type { ToolMeta } from './tool-types';
import { absoluteUrl } from './site';

const applicationCategory: Record<ToolMeta['category'], string> = {
	gambar: 'DesignApplication',
	diagram: 'DesignApplication',
	dokumen: 'BusinessApplication',
	foto: 'MultimediaApplication',
	berbagi: 'UtilitiesApplication',
	generator: 'DeveloperApplication',
	utilitas: 'UtilitiesApplication',
	ai: 'EducationalApplication',
};

export function toolJsonLd(tool: ToolMeta): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: tool.name,
		description: tool.tagline,
		url: absoluteUrl(`/tools/${tool.slug}/`),
		applicationCategory: applicationCategory[tool.category],
		operatingSystem: 'Web',
		inLanguage: 'id-ID',
		isAccessibleForFree: true,
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' },
		privacyPolicy: absoluteUrl('/privasi/'),
	};
}
