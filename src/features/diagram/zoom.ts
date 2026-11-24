export function diagramScale(action: string, current: number, available: number, width: number): number {
	if (!Number.isFinite(width) || width <= 0 || available <= 0) return 1;
	const fit = Math.min(1, available / width);
	if (action === 'fit') return fit;
	if (action === 'initial') return Math.max(0.75, fit);
	if (action === 'reset') return 1;
	return Math.min(4, Math.max(0.1, current * (action === 'in' ? 1.25 : 0.8)));
}
