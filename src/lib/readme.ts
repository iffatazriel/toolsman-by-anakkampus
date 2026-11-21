import type { Lang } from './i18n';
import dict from '../features/generator/i18n';
export type ReadmeLicense = 'MIT' | 'Apache-2.0' | 'GPL-3.0';

export interface ReadmeInput {
	name: string;
	description: string;
	features: string;
	install: string;
	usage: string;
	license: ReadmeLicense | '';
	showLicenseBadge: boolean;
}

const badges: Record<ReadmeLicense, { image: string; link: string }> = {
	MIT: {
		image: 'https://img.shields.io/badge/License-MIT-yellow.svg',
		link: 'https://opensource.org/licenses/MIT',
	},
	'Apache-2.0': {
		image: 'https://img.shields.io/badge/License-Apache%202.0-blue.svg',
		link: 'https://www.apache.org/licenses/LICENSE-2.0',
	},
	'GPL-3.0': {
		image: 'https://img.shields.io/badge/License-GPLv3-blue.svg',
		link: 'https://www.gnu.org/licenses/gpl-3.0.html',
	},
};

function toLines(text: string): string[] {
	return text
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line !== '');
}

function toBullets(text: string): string[] {
	return toLines(text).map((line) => `- ${line.replace(/^[-*+]\s+/, '')}`);
}

export function generateReadme(input: ReadmeInput, lang: Lang = 'id'): string {
	const name = input.name.trim();
	if (name === '') return '';

	const parts: string[] = [`# ${name}`];

	const description = input.description.trim();
	if (description !== '') parts.push(description);

	if (input.showLicenseBadge && input.license !== '') {
		const badge = badges[input.license];
		parts.push(`[![${dict[lang].license}: ${input.license}](${badge.image})](${badge.link})`);
	}

	const features = toBullets(input.features);
	if (features.length > 0) {
		parts.push([`## ${dict[lang].features}`, '', ...features].join('\n'));
	}

	const install = toLines(input.install);
	if (install.length > 0) {
		parts.push([`## ${dict[lang].readmeInstallHeading}`, '', '```bash', ...install, '```'].join('\n'));
	}

	const usage = input.usage.trim();
	if (usage !== '') parts.push([`## ${dict[lang].usage}`, '', usage].join('\n'));

	if (input.license !== '') parts.push([`## ${dict[lang].license}`, '', input.license].join('\n'));

	return parts.join('\n\n') + '\n';
}
