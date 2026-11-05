import { purgeExhaustedFiles, removeExpiredShares, type CleanupEnv } from '../../src/features/kirim-file/cleanup';

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
				await purgeExhaustedFiles(env);
				await removeExpiredShares(env);
			})(),
		);
	},
};
