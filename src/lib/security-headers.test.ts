import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
	CONTENT_SECURITY_POLICY,
	PAS_FOTO_CONTENT_SECURITY_POLICY,
	SECURITY_HEADERS,
	securityHeadersFor,
} from './security-headers';

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

	it('tidak memakai unsafe-eval di CSP dasar', () => {
		const scriptSrc =
			CONTENT_SECURITY_POLICY.split('; ').find((part) => part.startsWith('script-src')) ?? '';
		expect(scriptSrc).not.toContain("'unsafe-eval'");
		expect(scriptSrc).toContain("'wasm-unsafe-eval'");
	});

	it('membatasi unsafe-eval ke rute Pas Foto', () => {
		expect(securityHeadersFor('/tools/pas-foto/')['Content-Security-Policy']).toBe(
			PAS_FOTO_CONTENT_SECURITY_POLICY,
		);
		expect(PAS_FOTO_CONTENT_SECURITY_POLICY).toContain("'unsafe-eval'");
		expect(securityHeadersFor('/tools/pdf/')['Content-Security-Policy']).toBe(
			CONTENT_SECURITY_POLICY,
		);
		expect(securityHeadersFor('/')['Content-Security-Policy']).toBe(CONTENT_SECURITY_POLICY);
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
