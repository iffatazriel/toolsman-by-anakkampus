const MAX_SIDE = 16384;
const MAX_PIXELS = 16_777_216;

export function pngSize(width: number, height: number): { width: number; height: number } {
	if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error('Invalid diagram dimensions');
	const scale = Math.min(2, MAX_SIDE / width, MAX_SIDE / height, Math.sqrt(MAX_PIXELS / width / height));
	return { width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)) };
}
