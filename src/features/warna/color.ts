export interface Rgb {
	r: number;
	g: number;
	b: number;
}

export interface WcagResult {
	normalAA: boolean;
	normalAAA: boolean;
	largeAA: boolean;
	largeAAA: boolean;
}

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function normalizeHex(value: string): string | null {
	const match = HEX_PATTERN.exec(value.trim());
	if (!match?.[1]) return null;

	const raw =
		match[1].length === 3
			? match[1]
					.split('')
					.map((char) => `${char}${char}`)
					.join('')
			: match[1];

	return `#${raw.toLowerCase()}`;
}

export function hexToRgb(value: string): Rgb | null {
	const hex = normalizeHex(value);
	if (!hex) return null;

	return {
		r: Number.parseInt(hex.slice(1, 3), 16),
		g: Number.parseInt(hex.slice(3, 5), 16),
		b: Number.parseInt(hex.slice(5, 7), 16),
	};
}

export function rgbToHex({ r, g, b }: Rgb): string {
	const channel = (value: number) =>
		Math.min(255, Math.max(0, Math.round(value)))
			.toString(16)
			.padStart(2, '0');
	return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function channelLuminance(value: number): number {
	const normalized = value / 255;
	return normalized <= 0.03928
		? normalized / 12.92
		: ((normalized + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(rgb: Rgb): number {
	return (
		0.2126 * channelLuminance(rgb.r) +
		0.7152 * channelLuminance(rgb.g) +
		0.0722 * channelLuminance(rgb.b)
	);
}

export function contrastRatio(foreground: string, background: string): number | null {
	const a = hexToRgb(foreground);
	const b = hexToRgb(background);
	if (!a || !b) return null;

	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	const lighter = Math.max(la, lb);
	const darker = Math.min(la, lb);
	return (lighter + 0.05) / (darker + 0.05);
}

export function wcag(ratio: number): WcagResult {
	return {
		normalAA: ratio >= 4.5,
		normalAAA: ratio >= 7,
		largeAA: ratio >= 3,
		largeAAA: ratio >= 4.5,
	};
}

export function mix(from: string, to: string, amount: number): string {
	const a = hexToRgb(from) ?? { r: 0, g: 0, b: 0 };
	const b = hexToRgb(to) ?? { r: 0, g: 0, b: 0 };
	const t = Math.min(1, Math.max(0, amount));

	return rgbToHex({
		r: a.r + (b.r - a.r) * t,
		g: a.g + (b.g - a.g) * t,
		b: a.b + (b.b - a.b) * t,
	});
}

export const scaleLabels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

export function generateScale(hex: string): { label: number; hex: string }[] {
	const base = normalizeHex(hex) ?? '#000000';
	const tints = [0.9, 0.75, 0.6, 0.45, 0.25];
	const shades = [0.15, 0.3, 0.45, 0.6];

	const colors = [
		...tints.map((amount) => mix(base, '#ffffff', amount)),
		base,
		...shades.map((amount) => mix(base, '#000000', amount)),
	];

	return colors.map((value, index) => ({ label: scaleLabels[index]!, hex: value }));
}
