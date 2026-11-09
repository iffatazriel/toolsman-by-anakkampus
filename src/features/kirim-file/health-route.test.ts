import { afterEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ env: null as unknown }));

vi.mock('cloudflare:workers', () => ({
	get env() {
		return state.env;
	},
}));

import { GET } from '../../pages/api/health';

afterEach(() => {
	state.env = null;
});

describe('GET /api/health', () => {
	it('membalas ok kalau D1 bisa dibaca', async () => {
		state.env = {
			DB: {
				prepare: () => ({
					bind: () => ({ first: async () => ({ ok: 1 }) }),
					first: async () => ({ ok: 1 }),
				}),
			},
		};

		const response = await GET({} as never);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ ok: true });
	});

	it('membalas 503 tanpa detail internal kalau D1 gagal', async () => {
		state.env = {
			DB: {
				prepare: () => ({
					bind: () => ({ first: async () => Promise.reject(new Error('SQLITE_ERROR')) }),
					first: async () => Promise.reject(new Error('SQLITE_ERROR')),
				}),
			},
		};

		const response = await GET({} as never);

		expect(response.status).toBe(503);
		const body = (await response.json()) as Record<string, unknown>;
		expect(body).toEqual({ ok: false });
		expect(JSON.stringify(body)).not.toContain('SQLITE');
	});

	it('membalas 503 kalau binding tidak ada', async () => {
		state.env = undefined;

		const response = await GET({} as never);

		expect(response.status).toBe(503);
		await expect(response.json()).resolves.toEqual({ ok: false });
	});
});
