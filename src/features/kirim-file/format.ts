import { fill, type Lang } from '../../lib/i18n';
import dict from './i18n';

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatRemaining(ms: number, lang: Lang = 'id'): string {
	const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
	const days = Math.floor(totalMinutes / (60 * 24));
	const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
	const minutes = totalMinutes % 60;
	if (days > 0) return fill(dict[lang].days, { days, hours });
	if (hours > 0) return fill(dict[lang].hours, { hours, minutes });
	return fill(dict[lang].minutes, { minutes });
}
