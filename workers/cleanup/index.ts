import { purgeExhaustedFiles, removeExpiredShares, type CleanupEnv } from '../../src/features/kirim-file/cleanup';
import { logEvent } from '../../src/lib/server-log';

interface ScheduledController {
	scheduledTime: number;
	cron: string;
}

interface ExecutionContext {
	waitUntil: (promise: Promise<unknown>) => void;
}

export default {
	scheduled(_controller: ScheduledController, env: CleanupEnv, ctx: ExecutionContext) {
		ctx.waitUntil(
			(async () => {
				logEvent('info', 'cleanup.started', { route: 'cleanup', method: 'SCHEDULED' });
				try { await purgeExhaustedFiles(env); }
				catch (error) { logEvent('error', 'cleanup.exhausted_batch_failed', { route: 'cleanup', method: 'SCHEDULED' }, error); }
				try { await removeExpiredShares(env); }
				catch (error) { logEvent('error', 'cleanup.expired_batch_failed', { route: 'cleanup', method: 'SCHEDULED' }, error); }
				logEvent('info', 'cleanup.finished', { route: 'cleanup', method: 'SCHEDULED' });
			})(),
		);
	},
};
