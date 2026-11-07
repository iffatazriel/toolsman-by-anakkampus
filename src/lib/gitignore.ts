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
		label: 'Rahasia dan env',
		rules: ['.env', '.env.*', '!.env.example'],
	},
	{
		id: 'logs',
		label: 'Log dan cache',
		rules: ['*.log', '.cache/'],
	},
	{
		id: 'coverage',
		label: 'Hasil uji',
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

export function buildGitignore(selectedIds: string[]): string {
	const selected = new Set(selectedIds);
	const blocks = gitignoreGroups
		.filter((group) => selected.has(group.id))
		.map((group) => [`# ${group.label}`, ...group.rules].join('\n'));

	return blocks.length === 0 ? '' : `${blocks.join('\n\n')}\n`;
}
