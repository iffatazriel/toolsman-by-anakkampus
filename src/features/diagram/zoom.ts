export function diagramScale(action: string, current: number, available: number, width: number): number {
	if (!Number.isFinite(width) || width <= 0 || available <= 0) return 1;
	const fit = Math.min(1, available / width);
	if (action === 'fit') return fit;
	if (action === 'initial') return 1;
	if (action === 'reset') return 1;
	const minimum = Math.min(fit, 0.1, current);
	return Math.min(4, Math.max(minimum, current * (action === 'in' ? 1.25 : 0.8)));
}
