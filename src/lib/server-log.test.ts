import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logEvent } from './server-log';

const ID = 'a'.repeat(32);
const ray = 'abcdef0123456789-SIN';

beforeEach(() => {
	vi.spyOn(console, 'info').mockImplementation(() => undefined);
	vi.spyOn(console, 'warn').mockImplementation(() => undefined);
	vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

describe('structured server logs', () => {
	it('emits one JSON string per event with bounded request context', () => {
		const request = new Request(`https://toolsman.test/api/shares/${ID}/download/3?index=3`, { method: 'POST', headers: { 'cf-ray': ray } });
		logEvent('info', 'shares.download', { request });
		expect(console.info).toHaveBeenCalledTimes(1);
		const args = vi.mocked(console.info).mock.calls[0]!;
		expect(args).toHaveLength(1);
		expect(JSON.parse(args[0])).toEqual({ level: 'info', event: 'shares.download', route: '/api/shares/:id/download/:index', method: 'POST', requestId: ray, shareId: ID });
		expect(args[0]).not.toContain('\n');
	});
	it('never logs credentials, query strings, body, presigned URLs, arbitrary error data or contents', () => {
		const secret = 'super-secret-value';
		const request = new Request(`https://example.test/api/shares/${ID}/complete?X-Amz-Signature=${secret}#t=${secret}`, { method: 'POST', headers: { Authorization: `Bearer ${secret}`, Cookie: `session=${secret}` }, body: `FILE CONTENTS ${secret}` });
		const error = new Error(`password=${secret} token=${secret} https://bucket.example/file?X-Amz-Signature=${secret}\nFILE CONTENTS ${secret}`);
		Object.assign(error, { cause: { password: secret }, token: secret, contents: secret });
		logEvent('error', 'shares.complete_failed', { request }, error);
		const line = vi.mocked(console.error).mock.calls[0]![0];
		expect(line).not.toContain(secret); expect(line).not.toContain('https:'); expect(line).not.toContain('FILE CONTENTS'); expect(line).not.toContain('X-Amz');
		expect(JSON.parse(line).error.message).toBe('[REDACTED]');
	});
	it('keeps safe classifications and stack positions but not dynamic stack text', () => {
		const error = new Error('D1_ERROR SQL query with token=secret');
		error.stack = 'Error: secret\n    at privateSecret (/repo/src/pages/api/shares/index.ts:12:34)\n    at secret (/untrusted/secret.js:56:78)\n    secret';
		logEvent('warn', 'shares.db_failed', {}, error);
		const entry = JSON.parse(vi.mocked(console.warn).mock.calls[0]![0]);
		expect(entry.error).toEqual({ name: 'Error', message: 'D1_ERROR [REDACTED]', stack: 'at index.ts:12:34\nat [frame]:56:78' });
	});
	it('truncates oversized stacks and rejects unbounded metadata', () => {
		const error = new TypeError('secret'.repeat(20000));
		error.stack = 'TypeError: secret\n' + '    at unsafe (/repo/index.ts:12345:67890)\n'.repeat(300);
		logEvent('error', 'x'.repeat(10000), { route: '/api/unknown/secret?token=secret', shareId: 'secret' }, error);
		const entry = JSON.parse(vi.mocked(console.error).mock.calls[0]![0]);
		expect(entry.event).toBe('invalid_event'); expect(entry.route).toBe('/api/*'); expect(entry.shareId).toBeUndefined();
		expect(entry.error.name).toBe('TypeError'); expect(entry.error.stack.length).toBeLessThanOrEqual(1024); expect(entry.error.stack).toContain('[truncated]'); expect(entry.error.message.length).toBeLessThanOrEqual(200);
	});
	it('ignores arbitrary thrown objects and invalid correlation headers', () => {
		logEvent('warn', 'test.failure', { request: new Request('https://example.test/api/unknown/secret', { method: 'CUSTOM', headers: { 'cf-ray': 'Bearer secret' } }) }, { token: 'secret', toString: () => { throw new Error('no'); } });
		const entry = JSON.parse(vi.mocked(console.warn).mock.calls[0]![0]);
		expect(entry).toMatchObject({ method: 'OTHER', requestId: null, error: { name: 'NonError', message: '[REDACTED]', stack: '' } });
		expect(JSON.stringify(entry)).not.toContain('secret');
	});
	it('supports cleanup context and does not fail when console throws', () => {
		logEvent('info', 'cleanup.started', { route: 'cleanup', method: 'SCHEDULED', shareId: ID });
		expect(JSON.parse(vi.mocked(console.info).mock.calls[0]![0])).toMatchObject({ route: 'cleanup', method: 'SCHEDULED', shareId: ID, requestId: null });
		vi.mocked(console.error).mockImplementation(() => { throw new Error('console'); });
		expect(() => logEvent('error', 'test.failure', {}, new Error('secret'))).not.toThrow();
	});
});
