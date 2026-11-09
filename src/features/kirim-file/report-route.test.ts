import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ env: null as unknown }));

vi.mock('cloudflare:workers', () => ({
	get env() {
		return state.env;
	},
}));

import { POST } from '../../pages/api/shares/[id]/report';

const ID = 'b'.repeat(32);

function installEnv(extra: Record<string, unknown> = {}) {
	const statements: string[] = [];
	const env = {
		DB: {
			prepare(sql: string) {
				statements.push(sql);
				const statement = {
					bind() {
						return statement;
					},
					async first() {
						if (sql.includes('COUNT(*)')) return { n: 2 };
						return null;
					},
					async all() {
						return { results: [] };
					},
					async run() {
						return {};
					},
				};
				return statement;
			},
		},
		...extra,
	};
	state.env = env;
	return { env, statements };
}

function reportRequest(reason = 'berisi malware') {
	return new Request(`https://toolsman.test/api/shares/${ID}/report`, {
		method: 'POST',
		headers: { 'CF-Connecting-IP': '1.1.1.1', 'Content-Type': 'application/json' },
		body: JSON.stringify({ reason }),
	});
}

async function callRoute(request: Request): Promise<Response> {
	return POST({ params: { id: ID }, request } as never);
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('POST /api/shares/:id/report', () => {
	it('meneruskan laporan ke webhook tanpa kata sandi atau isi berkas', async () => {
		installEnv({ ABUSE_WEBHOOK_URL: 'https://contoh.test/hook' });

		const response = await callRoute(reportRequest());

		expect(response.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('https://contoh.test/hook');
		const body = JSON.parse(String(init.body)) as Record<string, unknown>;
		expect(body.shareId).toBe(ID);
		expect(body.fileCount).toBe(2);
		expect(body.reason).toBe('berisi malware');
		expect(typeof body.reportedAt).toBe('number');
		expect(String(init.body).toLowerCase()).not.toContain('password');
	});

	it('tetap menyimpan laporan walau webhook belum diatur', async () => {
		const { statements } = installEnv();

		const response = await callRoute(reportRequest());

		expect(response.status).toBe(200);
		expect(fetchMock).not.toHaveBeenCalled();
		expect(statements.some((sql) => sql.startsWith('INSERT INTO reports'))).toBe(true);
	});

	it('tetap membalas sukses walau webhook gagal', async () => {
		installEnv({ ABUSE_WEBHOOK_URL: 'https://contoh.test/hook' });
		fetchMock.mockRejectedValueOnce(new Error('jaringan mati'));

		const response = await callRoute(reportRequest());

		expect(response.status).toBe(200);
	});
});
