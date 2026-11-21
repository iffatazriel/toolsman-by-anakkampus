import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('astro:middleware', () => ({ defineMiddleware: (handler: unknown) => handler }));

import { onRequest } from './middleware';

function context(path: string) {
	const url = new URL(path, 'https://toolsman.test');
	return { url, params: { id: 'a'.repeat(32) }, request: new Request(url, { method: 'POST', headers: { 'cf-ray': 'abcdef0123456789-SIN' } }) };
}

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => undefined));
afterEach(() => vi.restoreAllMocks());

describe('API middleware error boundary', () => {
	it('logs rejected API handlers and returns a no-store Indonesian JSON 500', async () => {
		const response = await onRequest(context(`/api/shares/${'a'.repeat(32)}/complete?token=secret`) as never, async () => { throw new Error('password=secret'); }) as Response;
		expect(response.status).toBe(500); expect(response.headers.get('content-type')).toContain('application/json'); expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual({ error: 'Server mengalami kendala. Coba lagi sebentar.' });
		expect(console.error).toHaveBeenCalledTimes(1);
		const line = vi.mocked(console.error).mock.calls[0]![0];
		expect(line).not.toContain('secret'); expect(JSON.parse(line)).toMatchObject({ level: 'error', event: 'api.unhandled', route: '/api/shares/:id/complete', method: 'POST', requestId: 'abcdef0123456789-SIN' });
	});
	it('also handles synchronous non-Error throws without serializing them', async () => {
		const response = await onRequest(context('/api/future') as never, () => { throw { token: 'secret' }; }) as Response;
		expect(response.status).toBe(500); expect(JSON.parse(vi.mocked(console.error).mock.calls[0]![0]).error.name).toBe('NonError');
	});
	it('preserves successful and handled error responses', async () => {
		for (const status of [200, 400, 404, 503]) {
			const original = Response.json({ status }, { status });
			const response = await onRequest(context('/api/health') as never, async () => original);
			expect(response).toBe(original);
		}
		expect(console.error).not.toHaveBeenCalled();
	});
	it('leaves non-API errors to Astro and does not match similar path prefixes', async () => {
		for (const path of ['/tools/teks/', '/apiculture/test']) {
			const error = new Error('page failure');
			await expect(onRequest(context(path) as never, async () => { throw error; })).rejects.toBe(error);
		}
		expect(console.error).not.toHaveBeenCalled();
	});
});
