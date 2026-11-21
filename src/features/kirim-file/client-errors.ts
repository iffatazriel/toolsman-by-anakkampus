import type dict from './i18n';

export function apiErrorKey(status: number, operation: 'upload' | 'download' = 'upload'): keyof typeof dict.id {
	if (status === 400 || status === 413 || status === 422) return 'apiBadRequest';
	if (status === 401) return 'apiUnauthorized';
	if (status === 403) return 'apiForbidden';
	if (status === 404) return 'apiNotFound';
	if (status === 409) return 'apiConflict';
	if (status === 410) return operation === 'download' ? 'downloadGone' : 'apiGone';
	if (status === 429) return 'apiRate';
	if (status >= 500) return 'apiUnavailable';
	return 'apiFailed';
}
