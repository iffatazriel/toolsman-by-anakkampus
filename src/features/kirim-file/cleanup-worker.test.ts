import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./cleanup', () => ({ purgeExhaustedFiles: vi.fn(async () => 0), removeExpiredShares: vi.fn(async () => 0) }));
import worker from '../../../workers/cleanup';
import { purgeExhaustedFiles, removeExpiredShares } from './cleanup';

beforeEach(() => {
	vi.resetAllMocks();
	vi.spyOn(console, 'info').mockImplementation(() => undefined);
	vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

describe('cleanup scheduled logging', () => {
	it('records start and finish for an empty successful run', async () => {
		let pending: Promise<unknown> | undefined;
		worker.scheduled({ scheduledTime: 0, cron: '0 * * * *' }, {} as never, { waitUntil: (promise) => { pending = promise; } });
		await pending;
		expect(purgeExhaustedFiles).toHaveBeenCalledTimes(1); expect(removeExpiredShares).toHaveBeenCalledTimes(1);
		expect(vi.mocked(console.info).mock.calls.map(([line]) => JSON.parse(line).event)).toEqual(['cleanup.started', 'cleanup.finished']);
		expect(console.error).not.toHaveBeenCalled();
	});
	it('logs a failed batch without leaking its data and still attempts the other batch', async () => {
		vi.mocked(purgeExhaustedFiles).mockRejectedValue(new Error('password=secret'));
		vi.mocked(removeExpiredShares).mockRejectedValue(new Error('https://secret.example/?token=secret'));
		let pending: Promise<unknown> | undefined;
		worker.scheduled({ scheduledTime: 0, cron: '0 * * * *' }, {} as never, { waitUntil: (promise) => { pending = promise; } });
		await pending;
		const errors = vi.mocked(console.error).mock.calls.map(([line]) => JSON.parse(line));
		expect(errors.map((entry) => entry.event)).toEqual(['cleanup.exhausted_batch_failed', 'cleanup.expired_batch_failed']);
		expect(JSON.stringify(errors)).not.toContain('secret');
	});
});
