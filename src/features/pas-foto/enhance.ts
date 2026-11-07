export interface EnhanceSettings {
	brightness: number;
	feather: number;
}

export function enhancePixels(
	data: Uint8ClampedArray,
	width: number,
	height: number,
	settings: EnhanceSettings,
): void {
	const brightness = 1 + Math.min(50, Math.max(-50, settings.brightness)) / 100;

	if (brightness !== 1) {
		for (let index = 0; index < data.length; index += 4) {
			data[index] = data[index]! * brightness;
			data[index + 1] = data[index + 1]! * brightness;
			data[index + 2] = data[index + 2]! * brightness;
		}
	}

	const radius = Math.min(12, Math.max(0, Math.round(settings.feather)));
	if (radius > 0) featherAlpha(data, width, height, radius);
}

function featherAlpha(
	data: Uint8ClampedArray,
	width: number,
	height: number,
	radius: number,
): void {
	const total = width * height;
	const alpha = new Uint8ClampedArray(total);
	for (let index = 0; index < total; index += 1) alpha[index] = data[index * 4 + 3]!;

	const temporary = new Uint8ClampedArray(total);
	blurPass(alpha, temporary, width, height, radius, true);
	blurPass(temporary, alpha, width, height, radius, false);

	for (let index = 0; index < total; index += 1) data[index * 4 + 3] = alpha[index]!;
}

function blurPass(
	source: Uint8ClampedArray,
	target: Uint8ClampedArray,
	width: number,
	height: number,
	radius: number,
	horizontal: boolean,
): void {
	const outer = horizontal ? height : width;
	const inner = horizontal ? width : height;

	for (let line = 0; line < outer; line += 1) {
		for (let position = 0; position < inner; position += 1) {
			let sum = 0;
			let count = 0;
			for (let offset = -radius; offset <= radius; offset += 1) {
				const index = position + offset;
				if (index < 0 || index >= inner) continue;
				sum += horizontal
					? source[line * width + index]!
					: source[index * width + line]!;
				count += 1;
			}

			const value = sum / count;
			if (horizontal) target[line * width + position] = value;
			else target[position * width + line] = value;
		}
	}
}
