export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatRemaining(ms: number): string {
	const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
	const days = Math.floor(totalMinutes / (60 * 24));
	const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
	const minutes = totalMinutes % 60;
	if (days > 0) return `${days} hari ${hours} jam lagi`;
	if (hours > 0) return `${hours} jam ${minutes} menit lagi`;
	return `${minutes} menit lagi`;
}
