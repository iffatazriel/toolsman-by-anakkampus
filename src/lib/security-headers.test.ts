import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SECURITY_HEADERS, securityHeadersFor } from './security-headers';

describe('header keamanan', () => {
	it('menjaga public/_headers sama dengan sumber TypeScript', () => {
		const file = readFileSync('public/_headers', 'utf8');
		for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
			expect(file).toContain(`${name}: ${value}`);
		}
	});

	it('tidak memakai unsafe-inline di script-src', () => {
		const csp = SECURITY_HEADERS['Content-Security-Policy'] ?? '';
		const scriptSrc = csp.split('; ').find((part) => part.startsWith('script-src')) ?? '';
		expect(scriptSrc).not.toContain("'unsafe-inline'");
	});

	it('mencatat pengecualian unsafe-eval untuk ONNX Runtime Web', () => {
		const csp = SECURITY_HEADERS['Content-Security-Policy'] ?? '';
		const scriptSrc = csp.split('; ').find((part) => part.startsWith('script-src')) ?? '';
		expect(scriptSrc).toContain("'unsafe-eval'");
		expect(scriptSrc).toContain("'wasm-unsafe-eval'");
	});

	it('hanya mengizinkan kamera di halaman Pas Foto', () => {
		expect(securityHeadersFor('/tools/pas-foto/')['Permissions-Policy']).toBe(
			'camera=(self), microphone=(), geolocation=(), payment=()',
		);
		expect(securityHeadersFor('/tools/pas-foto')['Permissions-Policy']).toBe(
			'camera=(self), microphone=(), geolocation=(), payment=()',
		);
		expect(securityHeadersFor('/tools/pdf/')['Permissions-Policy']).toBe(
			'camera=(), microphone=(), geolocation=(), payment=()',
		);
		expect(securityHeadersFor('/')['Permissions-Policy']).toBe(
			'camera=(), microphone=(), geolocation=(), payment=()',
		);
	});
});
