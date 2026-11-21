export type LogLevel = 'info' | 'warn' | 'error';
export interface LogContext {
	request?: Request;
	route?: string;
	method?: 'SCHEDULED';
	shareId?: string;
}

const MAX_STACK = 1024;
const ERROR_NAMES = new Set(['Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError', 'URIError', 'AbortError', 'TimeoutError', 'AggregateError']);
const FILE_NAMES = new Set(['index.ts', 'cleanup.ts', 'r2.ts', 'complete.ts', 'start.ts', 'part.ts', 'abort.ts', 'report.ts', 'health.ts', 'middleware.ts', 'complete-share.ts', 'quota.ts', 'turnstile.ts', 'abuse-webhook.ts', 'password.ts']);

function routeName(value: string): string {
	if (value === 'cleanup' || value === 'internal') return value;
	const path = value.split(/[?#]/, 1)[0]!.replace(/\/$/, '');
	if (path === '/api/health' || path === '/api/shares') return path;
	if (/^\/api\/shares\/[^/]+\/(?:complete|report)$/.test(path)) return path.replace(/\/shares\/[^/]+\//, '/shares/:id/');
	if (/^\/api\/shares\/[^/]+\/multipart\/(?:start|part|complete|abort)$/.test(path)) return path.replace(/\/shares\/[^/]+\//, '/shares/:id/');
	if (/^\/api\/shares\/[^/]+\/download\/[^/]+$/.test(path)) return '/api/shares/:id/download/:index';
	return path.startsWith('/api/') || path === '/api' ? '/api/*' : 'internal';
}

function safeError(error: unknown): { name: string; message: string; stack: string } {
	if (!(error instanceof Error)) return { name: 'NonError', message: '[REDACTED]', stack: '' };
	try {
		const name = ERROR_NAMES.has(error.name) ? error.name : 'Error';
		const raw = error.message.slice(0, 4096);
		let message = '[REDACTED]';
		if (/\bD1_ERROR\b/.test(raw)) message = 'D1_ERROR [REDACTED]';
		else if (/\bSQLITE_ERROR\b/.test(raw)) message = 'SQLITE_ERROR [REDACTED]';
		else if (raw === 'fetch failed' || raw === 'Invalid URL') message = raw;
		const frames = (error.stack ?? '').slice(0, 16000).split('\n').slice(1).filter((line) => /^\s+at /.test(line)).map((line) => {
			const position = /:(\d{1,7}):(\d{1,7})\)?$/.exec(line);
			if (!position) return 'at [REDACTED]';
			const candidate = /[/\\]([^/\\():\s]+):\d+:\d+\)?$/.exec(line)?.[1] ?? '';
			return `at ${FILE_NAMES.has(candidate) ? candidate : '[frame]'}:${position[1]}:${position[2]}`;
		}).join('\n');
		return { name, message, stack: frames.length > MAX_STACK ? `${frames.slice(0, MAX_STACK - 14)}...[truncated]` : frames };
	} catch { return { name: 'Error', message: '[REDACTED]', stack: '' }; }
}

export function logEvent(level: LogLevel, event: string, context: LogContext = {}, error?: unknown): void {
	try {
		const request = context.request;
		const url = request ? new URL(request.url) : null;
		const method = context.method ?? request?.method ?? 'UNKNOWN';
		const ray = request?.headers.get('cf-ray') ?? '';
		const id = context.shareId ?? url?.pathname.match(/^\/api\/shares\/([0-9a-f]{32})(?:\/|$)/)?.[1];
		const entry = {
			level, event: /^[a-z][a-z0-9_.-]{0,79}$/.test(event) ? event : 'invalid_event',
			route: routeName(context.route ?? url?.pathname ?? 'internal'),
			method: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'SCHEDULED', 'UNKNOWN'].includes(method) ? method : 'OTHER',
			requestId: /^[0-9a-f]{16,32}(?:-[A-Z]{3})?$/i.test(ray) ? ray : null,
			...(/^[0-9a-f]{32}$/.test(id ?? '') ? { shareId: id } : {}),
			...(error !== undefined ? { error: safeError(error) } : {}),
		};
		console[level](JSON.stringify(entry));
	} catch { /* pelaporan tidak boleh menggagalkan request */ }
}
