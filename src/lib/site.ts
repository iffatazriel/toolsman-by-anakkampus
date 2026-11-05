export const SITE_NAME = 'Toolsman';
export const SITE_DESCRIPTION =
	'Kumpulan alat gratis untuk mahasiswa informatika dan developer pemula. Tanpa akun, dan sebagian besar file diproses di perangkatmu.';

const FALLBACK_SITE_URL = 'https://toolsman.anakkampus.workers.dev';

export const siteUrl = (import.meta.env.PUBLIC_SITE_URL || FALLBACK_SITE_URL).replace(/\/+$/, '');

export function absoluteUrl(path = '/'): string {
	return new URL(path, `${siteUrl}/`).toString();
}
