const SCRIPT_SRC_BASE = [
	"'self'",
	'blob:',
	"'wasm-unsafe-eval'",
	'https://challenges.cloudflare.com',
	'https://plausible.io',
].join(' ');

// 'unsafe-eval' hanya dibutuhkan backend ONNX Runtime Web di
// @imgly/background-removal (Pas Foto): runtime mengevaluasi string JavaScript
// saat menyiapkan WASM. Rute lain tidak memakainya.
const SCRIPT_SRC_PAS_FOTO = [
	"'self'",
	'blob:',
	"'wasm-unsafe-eval'",
	"'unsafe-eval'",
	'https://challenges.cloudflare.com',
	'https://plausible.io',
].join(' ');

function buildCsp(scriptSrc: string): string {
	return [
		"default-src 'self'",
		"base-uri 'self'",
		"object-src 'none'",
		"form-action 'self'",
		"frame-ancestors 'none'",
		`script-src ${scriptSrc}`,
		// Excalidraw dan Mermaid menyuntikkan <style> saat runtime, jadi 'unsafe-inline' diperlukan di style-src.
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: blob: https://img.shields.io",
		"font-src 'self' data:",
		"connect-src 'self' blob: https://*.r2.cloudflarestorage.com https://*.r2.dev https://staticimgly.com https://challenges.cloudflare.com https://plausible.io",
		"worker-src 'self' blob:",
		"frame-src https://challenges.cloudflare.com https://embed.diagrams.net",
		"media-src 'self' blob:",
		"manifest-src 'self'",
	].join('; ');
}

export const CONTENT_SECURITY_POLICY = buildCsp(SCRIPT_SRC_BASE);
export const PAS_FOTO_CONTENT_SECURITY_POLICY = buildCsp(SCRIPT_SRC_PAS_FOTO);

export const BASE_PERMISSIONS_POLICY =
	'camera=(), microphone=(), geolocation=(), payment=()';
export const CAMERA_PERMISSIONS_POLICY =
	'camera=(self), microphone=(), geolocation=(), payment=()';

export const SECURITY_HEADERS: Record<string, string> = {
	'Content-Security-Policy': CONTENT_SECURITY_POLICY,
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': BASE_PERMISSIONS_POLICY,
	'X-Frame-Options': 'DENY',
};

export function isPasFotoPath(pathname: string): boolean {
	return pathname === '/tools/pas-foto' || pathname === '/tools/pas-foto/';
}

// Kamera dan 'unsafe-eval' hanya diizinkan di halaman Pas Foto.
export function securityHeadersFor(pathname: string): Record<string, string> {
	const headers = { ...SECURITY_HEADERS };
	if (isPasFotoPath(pathname)) {
		headers['Permissions-Policy'] = CAMERA_PERMISSIONS_POLICY;
		headers['Content-Security-Policy'] = PAS_FOTO_CONTENT_SECURITY_POLICY;
	}
	return headers;
}
