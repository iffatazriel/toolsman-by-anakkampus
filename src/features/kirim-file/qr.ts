import { toDataURL } from 'qrcode';

export function qrDataUrl(text: string): Promise<string> {
	return toDataURL(text, { width: 180, margin: 1 });
}
