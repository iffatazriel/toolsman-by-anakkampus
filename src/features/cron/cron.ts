import { Cron } from 'croner';
import { fill, type Lang } from '../../lib/i18n';
import dict from './i18n';

const say = (lang: Lang, key: keyof typeof dict.id, vars: Record<string, string | number> = {}) => fill(dict[lang][key], vars);

export const cronTimezones = [
	{ id: 'Asia/Jakarta', label: 'WIB (Asia/Jakarta)' },
	{ id: 'Asia/Makassar', label: 'WITA (Asia/Makassar)' },
	{ id: 'Asia/Jayapura', label: 'WIT (Asia/Jayapura)' },
	{ id: 'UTC', label: 'UTC' },
	{ id: 'Asia/Singapore', label: 'Asia/Singapore' },
	{ id: 'Asia/Tokyo', label: 'Asia/Tokyo' },
	{ id: 'Europe/London', label: 'Europe/London' },
	{ id: 'America/New_York', label: 'America/New_York' },
];

const monthNames = (lang: Lang) => Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, month, 1))));
const dayNames = (lang: Lang) => Array.from({ length: 7 }, (_, day) => new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 4 + day))));

export type CronPreview =
	| { ok: true; expression: string; explanation: string; runs: Date[] }
	| { ok: false; error: string };

export function normalizeCronExpression(expression: string): string {
	return expression.trim().split(/\s+/).filter(Boolean).join(' ');
}

function pad(value: string): string {
	return value.padStart(2, '0');
}

function timeLabel(hour: string, minute: string, lang: Lang): string {
	return `${pad(hour)}${lang === 'en' ? ':' : '.'}${pad(minute)}`;
}

function describeDays(field: string, lang: Lang): string | null {
	if (field === '1-5') return say(lang, 'workdays');
	if (field === '*' || field === '') return null;

	const days = dayNames(lang);
	const names = field
		.split(',')
		.map((part) => {
			const range = /^(\d)-(\d)$/.exec(part);
			if (range) {
				const start = days[Number(range[1]) % 7];
				const end = days[Number(range[2]) % 7];
				return start && end ? say(lang, 'range', { start, end }) : null;
			}
			if (/^\d$/.test(part)) return days[Number(part) % 7] ?? null;
			return null;
		})
		.filter((name): name is string => Boolean(name));

	if (names.length === 0) return null;
	return say(lang, 'each', { days: names.length === 1 ? names[0]! : `${names.slice(0, -1).join(', ')} ${say(lang, 'and')} ${names[names.length - 1]}` });
}

function describeMonth(field: string, lang: Lang): string | null {
	if (field === '*') return null;
	const months = monthNames(lang);
	const parts = field.split(',').map((part) => /^\d+$/.test(part) ? months[Number(part) - 1] : null);
	if (parts.some((part) => !part)) return null;
	return parts.join(', ');
}

export function explainCron(expression: string, lang: Lang = 'id'): string {
	const fields = normalizeCronExpression(expression).split(' ');
	if (fields.length !== 5) return say(lang, 'fiveParts');

	const [minute, hour, dayOfMonth, month, dayOfWeek] = fields as [
		string,
		string,
		string,
		string,
		string,
	];

	if ([minute, hour, dayOfMonth, month, dayOfWeek].every((field) => field === '*')) {
		return say(lang, 'everyMinute');
	}

	const minuteStep = /^\*\/(\d+)$/.exec(minute);
	if (minuteStep && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
		return say(lang, 'minuteStep', { n: minuteStep[1]! });
	}

	if (hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
		if (minute === '*') return say(lang, 'everyMinute');
		return say(lang, 'hourMinute', { minute });
	}

	const days = describeDays(dayOfWeek, lang);
	const monthLabel = describeMonth(month, lang);
	const fixedTime = /^\d+$/.test(hour) && /^\d+$/.test(minute);
	const timePart = fixedTime ? say(lang, 'time', { time: timeLabel(hour, minute, lang) }) : '';

	if (dayOfMonth === '*' && dayOfWeek !== '*' && days && (fixedTime || hour === '*')) {
		return say(lang, 'daysSchedule', { days, time: timePart, hourly: hour === '*' ? say(lang, 'hourly') : '' });
	}

	if (dayOfWeek === '*' && dayOfMonth === '*' && (fixedTime || hour === '*')) {
		return say(lang, 'daily', { month: monthLabel ? say(lang, 'inMonth', { month: monthLabel }) : '', time: timePart, hourly: hour === '*' ? say(lang, 'hourly') : '' });
	}

	if (dayOfWeek === '*' && dayOfMonth !== '*' && fixedTime) {
		return say(lang, 'monthly', { day: dayOfMonth, month: monthLabel ? say(lang, 'ofMonth', { month: monthLabel }) : say(lang, 'everyMonth'), time: timePart });
	}

	return say(lang, 'custom', { minute, hour, day: dayOfMonth, month, weekday: dayOfWeek });
}

export function previewCron(
	expression: string,
	timezone: string,
	count = 5,
	from: Date = new Date(),
	lang: Lang = 'id',
): CronPreview {
	const normalized = normalizeCronExpression(expression);
	if (normalized.split(' ').length !== 5) {
		return { ok: false, error: say(lang, 'fiveParts') };
	}

	try {
		const job = new Cron(normalized, {
			timezone,
			mode: '5-part',
			paused: true,
		});
		const runs = job.nextRuns(count, from);
		job.stop();

		if (runs.length === 0) {
			return { ok: false, error: say(lang, 'noRuns') };
		}

		return {
			ok: true,
			expression: normalized,
			explanation: explainCron(normalized, lang),
			runs,
		};
	} catch {
		return {
			ok: false,
			error: say(lang, 'invalid'),
		};
	}
}
