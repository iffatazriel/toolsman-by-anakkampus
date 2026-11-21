import type { Lang } from './i18n';
import dict from '../features/generator/i18n';
export interface GitignoreGroup {
	id: string;
	label: string;
	rules: string[];
}

export const gitignoreGroups: GitignoreGroup[] = [
	{
		id: 'node',
		label: 'Node.js',
		rules: [
			'node_modules/',
			'npm-debug.log*',
			'yarn-debug.log*',
			'yarn-error.log*',
			'pnpm-debug.log*',
		],
	},
	{
		id: 'next',
		label: 'Next.js',
		rules: ['.next/', 'out/', '.vercel'],
	},
	{
		id: 'astro',
		label: 'Astro',
		rules: ['dist/', '.astro/'],
	},
	{
		id: 'vite',
		label: 'Vite',
		rules: ['dist-ssr/', '*.local'],
	},
	{
		id: 'python',
		label: 'Python',
		rules: [
			'__pycache__/',
			'*.py[cod]',
			'.venv/',
			'venv/',
			'*.egg-info/',
			'.pytest_cache/',
			'.mypy_cache/',
		],
	},
	{
		id: 'go',
		label: 'Go',
		rules: ['*.test', 'coverage.out'],
	},
	{
		id: 'rust',
		label: 'Rust',
		rules: ['target/'],
	},
	{
		id: 'java',
		label: 'Java / Gradle',
		rules: ['build/', '.gradle/', '*.class'],
	},
	{
		id: 'env',
		label: dict.id.groupSecrets,
		rules: ['.env', '.env.*', '!.env.example'],
	},
	{
		id: 'logs',
		label: dict.id.groupLogs,
		rules: ['*.log', '.cache/'],
	},
	{
		id: 'coverage',
		label: dict.id.groupTests,
		rules: ['coverage/', '.nyc_output/'],
	},
	{
		id: 'macos',
		label: 'macOS',
		rules: ['.DS_Store'],
	},
	{
		id: 'windows',
		label: 'Windows',
		rules: ['Thumbs.db', 'Desktop.ini'],
	},
	{
		id: 'vscode',
		label: 'VS Code',
		rules: ['.vscode/*', '!.vscode/extensions.json'],
	},
	{
		id: 'jetbrains',
		label: 'JetBrains',
		rules: ['.idea/'],
	},
];

export const defaultGitignoreGroups = ['node', 'env', 'logs', 'macos', 'windows', 'vscode'];

export function buildGitignore(selectedIds: string[], lang: Lang = 'id'): string {
	const selected = new Set(selectedIds);
	const blocks = gitignoreGroups
		.filter((group) => selected.has(group.id))
		.map((group) => [`# ${gitignoreLabel(group, lang)}`, ...group.rules].join('\n'));

	return blocks.length === 0 ? '' : `${blocks.join('\n\n')}\n`;
}

export function gitignoreLabel(group: GitignoreGroup, lang: Lang = 'id'): string {
	return group.id === 'env' ? dict[lang].groupSecrets : group.id === 'logs' ? dict[lang].groupLogs : group.id === 'coverage' ? dict[lang].groupTests : group.label;
}
