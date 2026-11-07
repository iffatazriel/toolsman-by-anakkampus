import { describe, expect, it } from 'vitest';
import { qrFilename, qrOptions } from './qr-options';

describe('qrOptions', () => {
	it('meneruskan ukuran, koreksi, dan margin', () => {
		expect(qrOptions({ size: 512, correction: 'Q', margin: 2 })).toEqual({
			width: 512,
			margin: 2,
			errorCorrectionLevel: 'Q',
			color: { dark: '#000000', light: '#ffffff' },
		});
	});

	it('membatasi margin ke 0 sampai 8', () => {
		expect(qrOptions({ size: 256, correction: 'M', margin: -4 }).margin).toBe(0);
		expect(qrOptions({ size: 256, correction: 'M', margin: 99 }).margin).toBe(8);
		expect(qrOptions({ size: 256, correction: 'M', margin: 3.6 }).margin).toBe(4);
	});

	it('memberi nama berkas sesuai ukuran dan ekstensi', () => {
		expect(qrFilename(1024, 'png')).toBe('qr-1024.png');
		expect(qrFilename(256, 'svg')).toBe('qr-256.svg');
	});
});
