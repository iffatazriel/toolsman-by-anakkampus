import { describe, expect, it } from 'vitest';
import {
	decodeBase64,
	decodeJwt,
	decodeUrl,
	encodeBase64,
	encodeUrl,
	generateUuids,
	jwtExpiry,
	parseTimestamp,
} from './utils';

describe('Base64', () => {
	it('bolak-balik teks ASCII dan Unicode', () => {
		const text = 'Halo, dunia! 👋';
		expect(decodeBase64(encodeBase64(text))).toBe(text);
	});

	it('menerima Base64 URL-safe dan tanpa padding', () => {
		expect(decodeBase64('SGVsbG8_Pz8')).toBe('Hello???');
	});

	it('mengabaikan spasi dan baris baru', () => {
		expect(decodeBase64('SGVs\nbG8=')).toBe('Hello');
	});

	it('menolak teks yang bukan Base64', () => {
		expect(() => decodeBase64('bukan base64!')).toThrow();
	});
});

describe('URL encode', () => {
	it('bolak-balik teks dengan karakter khusus', () => {
		const text = 'cari=a&b? #tag/ruang';
		expect(decodeUrl(encodeUrl(text))).toBe(text);
	});

	it('menolak persen encoding yang rusak', () => {
		expect(() => decodeUrl('%E0%A4%A')).toThrow();
	});
});

function makeJwt(payload: object): string {
	const encode = (value: object) =>
		encodeBase64(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.tanda-tangan`;
}

describe('JWT', () => {
	it('membaca header dan payload', () => {
		const parts = decodeJwt(makeJwt({ sub: '123', nama: 'Budi' }));
		expect(parts.header).toEqual({ alg: 'HS256', typ: 'JWT' });
		expect(parts.payload).toEqual({ sub: '123', nama: 'Budi' });
	});

	it('menolak token dengan kurang dari tiga bagian', () => {
		expect(() => decodeJwt('abc.def')).toThrow('JWT butuh tiga bagian');
	});

	it('menandai token kedaluwarsa', () => {
		const payload = { exp: 1_700_000_000 };
		expect(jwtExpiry(payload, 1_700_000_001_000)?.expired).toBe(true);
		expect(jwtExpiry(payload, 1_600_000_000_000)?.expired).toBe(false);
	});

	it('mengembalikan null kalau payload tidak punya exp', () => {
		expect(jwtExpiry({ sub: '123' })).toBeNull();
		expect(jwtExpiry(null)).toBeNull();
	});
});

describe('generateUuids', () => {
	it('menghasilkan UUID unik sesuai jumlah', () => {
		const ids = generateUuids(5);
		expect(ids).toHaveLength(5);
		expect(new Set(ids).size).toBe(5);
		expect(ids[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
	});

	it('membatasi jumlah ke rentang 1 sampai 50', () => {
		expect(generateUuids(0)).toHaveLength(1);
		expect(generateUuids(999)).toHaveLength(50);
	});
});

describe('parseTimestamp', () => {
	it('membaca unix detik', () => {
		const info = parseTimestamp('1700000000');
		expect(info.unixSeconds).toBe(1_700_000_000);
		expect(info.iso).toBe('2023-11-14T22:13:20.000Z');
	});

	it('membaca unix milidetik', () => {
		const info = parseTimestamp('1700000000123');
		expect(info.unixMillis).toBe(1_700_000_000_123);
		expect(info.unixSeconds).toBe(1_700_000_000);
	});

	it('membaca tanggal ISO', () => {
		expect(parseTimestamp('2026-11-06T00:00:00.000Z').unixMillis).toBe(
			Date.parse('2026-11-06T00:00:00.000Z'),
		);
	});

	it('menolak input kosong atau tidak dikenali', () => {
		expect(() => parseTimestamp('  ')).toThrow('Isi timestamp');
		expect(() => parseTimestamp('kemarin sore')).toThrow('tidak dikenali');
	});
});
