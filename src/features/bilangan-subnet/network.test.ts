import { describe, expect, it } from 'vitest';
import { addressKind, convertInteger, dotted, grouped, ipNumber, parseInteger, prefixLength, splitSubnet, subnet, twosComplement } from './network';

describe('konversi bilangan', () => {
	it('mengonversi basis standar, prefiks, dan basis khusus', () => {
		expect(parseInteger('0b1010', 2)).toBe(10n); expect(parseInteger('0o17', 8)).toBe(15n);
		expect(parseInteger('-0xFF', 16)).toBe(-255n); expect(parseInteger('z', 36)).toBe(35n);
		expect(convertInteger('10', 10, 3)).toEqual([{ base: 2, value: '1010' }, { base: 8, value: '12' }, { base: 10, value: '10' }, { base: 16, value: 'A' }, { base: 3, value: '101' }]);
		expect(convertInteger('0', 10, 10)).toHaveLength(4);
	});
	it('tidak kehilangan presisi BigInt dan mendukung tanda', () => {
		const large = '1234567890123456789012345678901234567890';
		expect(parseInteger(BigInt(large).toString(36), 36)).toBe(BigInt(large));
		expect(parseInteger('+1_000 000', 10)).toBe(1000000n); expect(parseInteger('-0', 2)).toBe(0n);
		expect(convertInteger('-15', 10, 36)[3]!.value).toBe('-F');
	});
	it('mengelompokkan digit dari kanan tanpa memindahkan tanda', () => {
		expect(grouped('-1234567', 3)).toBe('-1 234 567');
		expect(convertInteger('65535', 10, 16, true)[0]!.value).toBe('1111 1111 1111 1111');
	});
	it('menolak input kosong, digit salah, pecahan, dan basis di luar rentang', () => {
		for (const value of ['', ' ', '-', '+', '0x', '1.5', 'G']) expect(() => parseInteger(value, 16)).toThrow();
		expect(() => parseInteger('102', 2)).toThrow('Digit');
		for (const base of [1, 37, 2.5, NaN]) expect(() => parseInteger('1', base)).toThrow('Basis');
		expect(() => convertInteger('1', 10, 99)).toThrow(); expect(() => parseInteger('1'.repeat(4097), 10)).toThrow();
	});
	it('menghasilkan komplemen dua dan memeriksa rentang untuk semua lebar', () => {
		for (const bits of [8, 16, 32, 64]) {
			expect(twosComplement(-1n, bits).binary).toBe('1'.repeat(bits));
			expect(twosComplement(0n, bits).hex).toBe('0'.repeat(bits / 4));
			const min = -(1n << BigInt(bits - 1));
			expect(twosComplement(min, bits).binary).toBe(`1${'0'.repeat(bits - 1)}`);
			expect(() => twosComplement(min - 1n, bits)).toThrow('rentang');
			expect(() => twosComplement(-min, bits)).toThrow('rentang');
		}
		expect(twosComplement(-128n, 8).hex).toBe('80'); expect(() => twosComplement(1n, 7)).toThrow();
	});
});

describe('subnet IPv4', () => {
	it('menghitung /24 dan semua field mask', () => {
		expect(subnet('192.168.1.99/24')).toEqual({ prefix: 24, network: '192.168.1.0', broadcast: '192.168.1.255', first: '192.168.1.1', last: '192.168.1.254', hosts: 254, mask: '255.255.255.0', wildcard: '0.0.0.255', binary: '11111111.11111111.11111111.00000000', ipClass: 'C', scope: 'Privat (RFC 1918)' });
		expect(subnet('192.168.1.99', '255.255.255.0')).toEqual(subnet('192.168.1.99/24'));
	});
	it('menghitung /0 tanpa signed integer overflow', () => {
		const result = subnet('255.255.255.255/0');
		expect(result.network).toBe('0.0.0.0'); expect(result.broadcast).toBe('255.255.255.255');
		expect(result.hosts).toBe(4294967294); expect(result.first).toBe('0.0.0.1'); expect(result.last).toBe('255.255.255.254');
		expect(dotted(ipNumber('255.255.255.255'))).toBe('255.255.255.255');
	});
	it('menghitung /31 sesuai RFC 3021 dan /32', () => {
		const pair = subnet('10.0.0.3/31'); expect(pair.first).toBe('10.0.0.2'); expect(pair.last).toBe('10.0.0.3'); expect(pair.hosts).toBe(2);
		const single = subnet('8.8.8.8/32'); expect(single.first).toBe('8.8.8.8'); expect(single.last).toBe(single.first); expect(single.hosts).toBe(1); expect(single.wildcard).toBe('0.0.0.0');
	});
	it('menerima semua CIDR dan mask kontigu yang bersesuaian', () => {
		for (let prefix = 0; prefix <= 32; prefix++) {
			const result = subnet(`203.0.113.5/${prefix}`);
			expect(prefixLength(result.mask)).toBe(prefix);
		}
	});
	it('menolak IP, CIDR, dan mask tidak valid', () => {
		for (const ip of ['', '1.2.3', '256.1.2.3', '01.2.3.4', '-1.2.3.4', '1.2.3.x']) expect(() => ipNumber(ip)).toThrow();
		for (const input of ['1.2.3.4', '1.2.3.4/33', '1.2.3.4/-1', '1.2.3.4/24/8']) expect(() => subnet(input)).toThrow();
		expect(() => subnet('1.2.3.4', '255.0.255.0')).toThrow('berurutan');
		expect(() => subnet('1.2.3.4/24', '24')).toThrow('jangan keduanya');
	});
	it('membedakan privat, loopback, shared, publik dan dokumentasi', () => {
		for (const ip of ['10.0.0.1', '172.16.0.0', '172.31.255.255', '192.168.0.1']) expect(addressKind(ipNumber(ip)).scope).toContain('Privat');
		expect(addressKind(ipNumber('172.32.0.1')).scope).toContain('Publik');
		expect(addressKind(ipNumber('127.0.0.1')).scope).toBe('Loopback');
		expect(addressKind(ipNumber('100.64.0.1')).scope).toContain('CGNAT');
		expect(addressKind(ipNumber('169.254.1.2')).scope).toBe('Link-local');
		expect(addressKind(ipNumber('203.0.113.1')).scope).toContain('dokumentasi');
	});
	it('membagi subnet secara berurutan tanpa overlap', () => {
		const split = splitSubnet('192.168.1.10/24', '', 'count', 4);
		expect(split.map((s) => s.network)).toEqual(['192.168.1.0', '192.168.1.64', '192.168.1.128', '192.168.1.192']);
		expect(split.every((s) => s.prefix === 26 && s.hosts === 62)).toBe(true);
		expect(split.at(-1)!.broadcast).toBe('192.168.1.255');
		expect(splitSubnet('10.0.0.0/24', '', 'hosts', 30)).toHaveLength(8);
		expect(splitSubnet('10.0.0.0/30', '', 'hosts', 2)).toHaveLength(2);
		expect(splitSubnet('10.0.0.0/30', '', 'hosts', 1)).toHaveLength(4);
	});
	it('menolak pembagian tidak muat atau terlalu banyak', () => {
		for (const count of [0, 3, 1.5, NaN]) expect(() => splitSubnet('1.2.3.4/24', '', 'count', count)).toThrow();
		expect(() => splitSubnet('1.2.3.4/32', '', 'count', 2)).toThrow('tidak muat');
		expect(() => splitSubnet('1.2.3.4/24', '', 'hosts', 255)).toThrow('tidak muat');
		expect(() => splitSubnet('1.2.3.4/0', '', 'count', 512)).toThrow('Maksimal 256');
	});
});
