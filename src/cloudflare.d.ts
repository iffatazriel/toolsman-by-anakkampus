declare module 'cloudflare:workers' {
	/** Binding Worker yang sedang berjalan, termasuk secret dan D1. */
	export const env: Record<string, unknown>;
}
