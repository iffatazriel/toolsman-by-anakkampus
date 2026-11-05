export interface RateLimitBinding {
	limit: (options: { key: string }) => Promise<{ success: boolean }>;
}

export async function allowRequest(
	binding: RateLimitBinding | undefined,
	key: string,
): Promise<boolean> {
	if (!binding) return true;
	const result = await binding.limit({ key });
	return result.success;
}

export async function allowPasswordAttempt(
	binding: RateLimitBinding | undefined,
	ip: string,
	shareId: string,
): Promise<boolean> {
	if (!binding) return true;
	const [byIp, byLink] = await Promise.all([
		binding.limit({ key: `ip:${ip}` }),
		binding.limit({ key: `link:${shareId}` }),
	]);
	return byIp.success && byLink.success;
}

export function clientIp(request: Request): string {
	return request.headers.get('CF-Connecting-IP') ?? 'unknown';
}
