import { WorkspaceError, type Lang } from '../../lib/i18n';
import dict from './i18n';
const digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function parseInteger(source: string, base: number): bigint {
	if (!Number.isInteger(base) || base < 2 || base > 36) throw new WorkspaceError(dict, 'baseError');
	let value = source.trim().replace(/[ _]/g, '');
	if (!value || value.length > 4096) throw new WorkspaceError(dict, 'emptyError');
	const negative = value.startsWith('-');
	if (/^[+-]/.test(value)) value = value.slice(1);
	const prefix = ({ 2: /^0b/i, 8: /^0o/i, 16: /^0x/i } as Record<number, RegExp>)[base];
	if (prefix) value = value.replace(prefix, '');
	if (!value) throw new WorkspaceError(dict, 'digitMissing');
	let result = 0n;
	for (const char of value.toUpperCase()) {
		const digit = digits.indexOf(char);
		if (digit < 0 || digit >= base) throw new WorkspaceError(dict, 'digitError', { char, base });
		result = result * BigInt(base) + BigInt(digit);
	}
	return negative ? -result : result;
}

export function grouped(value: string, size = 4): string {
	if (!Number.isInteger(size) || size < 1 || size > 16) throw new WorkspaceError(dict, 'groupError');
	const sign = value.startsWith('-') ? '-' : '';
	const raw = sign ? value.slice(1) : value;
	const groups: string[] = [];
	for (let i = raw.length; i > 0; i -= size) groups.unshift(raw.slice(Math.max(0, i - size), i));
	return sign + groups.join(' ');
}

export function convertInteger(source: string, base: number, custom: number, group = false): { base: number; value: string }[] {
	if (!Number.isInteger(custom) || custom < 2 || custom > 36) throw new WorkspaceError(dict, 'customError');
	const number = parseInteger(source, base);
	return [...new Set([2, 8, 10, 16, custom])].map((target) => {
		const value = number.toString(target).toUpperCase();
		return { base: target, value: group ? grouped(value, target === 10 ? 3 : 4) : value };
	});
}

export function twosComplement(value: bigint, bits: number): { binary: string; hex: string } {
	if (![8, 16, 32, 64].includes(bits)) throw new WorkspaceError(dict, 'bitsError');
	const width = BigInt(bits);
	if (value < -(1n << (width - 1n)) || value >= (1n << (width - 1n))) throw new WorkspaceError(dict, 'rangeError', { bits });
	const encoded = BigInt.asUintN(bits, value);
	return { binary: encoded.toString(2).padStart(bits, '0'), hex: encoded.toString(16).toUpperCase().padStart(bits / 4, '0') };
}

export function ipNumber(ip: string): number {
	const parts = ip.trim().split('.');
	if (parts.length !== 4 || parts.some((p) => !/^(0|[1-9]\d{0,2})$/.test(p) || Number(p) > 255)) throw new WorkspaceError(dict, 'ipError');
	return parts.reduce((value, part) => value * 256 + Number(part), 0);
}

export function dotted(value: number): string {
	return [24, 16, 8, 0].map((shift) => Math.floor(value / 2 ** shift) % 256).join('.');
}

export function prefixLength(mask: string): number {
	const raw = mask.trim().replace(/^\//, '');
	if (/^\d{1,2}$/.test(raw) && Number(raw) <= 32) return Number(raw);
	const inverse = 0xffffffff - ipNumber(raw);
	const hostBits = Math.log2(inverse + 1);
	if (!Number.isInteger(hostBits)) throw new WorkspaceError(dict, 'maskError');
	return 32 - hostBits;
}

export function addressKind(ip: number, lang: Lang = 'id'): { ipClass: string; scope: string } {
	const a = Math.floor(ip / 2 ** 24);
	const inRange = (start: string, prefix: number) => Math.floor(ip / 2 ** (32 - prefix)) === Math.floor(ipNumber(start) / 2 ** (32 - prefix));
	const ipClass = a < 128 ? 'A' : a < 192 ? 'B' : a < 224 ? 'C' : a < 240 ? 'D (multicast)' : dict[lang].classE;
	let scope: string = dict[lang].publicScope;
	if (inRange('10.0.0.0', 8) || inRange('172.16.0.0', 12) || inRange('192.168.0.0', 16)) scope = dict[lang].privateScope;
	else if (a === 127) scope = 'Loopback';
	else if (inRange('169.254.0.0', 16)) scope = 'Link-local';
	else if (inRange('100.64.0.0', 10)) scope = 'Shared / CGNAT';
	else if (a === 0 || a >= 224 || inRange('192.0.0.0', 24) || inRange('192.0.2.0', 24) || inRange('198.51.100.0', 24) || inRange('203.0.113.0', 24) || inRange('198.18.0.0', 15)) scope = dict[lang].specialScope;
	return { ipClass, scope };
}

export function subnet(source: string, mask = '', lang: Lang = 'id') {
	const parts = source.trim().split('/');
	if (parts.length > 2 || (parts.length === 2 && mask.trim())) throw new WorkspaceError(dict, 'mixedMask');
	const ip = ipNumber(parts[0]!);
	const cidr = parts[1] ?? mask;
	if (!cidr.trim()) throw new WorkspaceError(dict, 'missingMask');
	const prefix = prefixLength(cidr);
	const size = 2 ** (32 - prefix);
	const network = Math.floor(ip / size) * size;
	const broadcast = network + size - 1;
	const netmask = 2 ** 32 - size;
	return {
		prefix, network: dotted(network), broadcast: dotted(broadcast),
		first: dotted(prefix >= 31 ? network : network + 1), last: dotted(prefix >= 31 ? broadcast : broadcast - 1),
		hosts: prefix >= 31 ? size : size - 2,
		mask: dotted(netmask), wildcard: dotted(size - 1),
		binary: netmask.toString(2).padStart(32, '0').match(/.{8}/g)!.join('.'), ...addressKind(ip, lang),
	};
}

export function splitSubnet(source: string, mask: string, mode: 'count' | 'hosts', amount: number) {
	const parent = subnet(source, mask);
	if (!Number.isSafeInteger(amount) || amount < 1) throw new WorkspaceError(dict, 'amountError');
	let prefix: number;
	if (mode === 'count') {
		if (!Number.isInteger(Math.log2(amount))) throw new WorkspaceError(dict, 'powerError');
		prefix = parent.prefix + Math.log2(amount);
	} else {
		prefix = amount <= 2 ? 33 - amount : 32 - Math.ceil(Math.log2(amount + 2));
	}
	if (prefix < parent.prefix || prefix > 32) throw new WorkspaceError(dict, 'fitError');
	const count = 2 ** (prefix - parent.prefix);
	if (count > 256) throw new WorkspaceError(dict, 'tooMany', { count });
	const start = ipNumber(parent.network);
	return Array.from({ length: count }, (_, i) => subnet(`${dotted(start + i * 2 ** (32 - prefix))}/${prefix}`));
}
