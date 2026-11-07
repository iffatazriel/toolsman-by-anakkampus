import { Cron } from 'croner';

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

const monthNames = [
	'Januari',
	'Februari',
	'Maret',
	'April',
	'Mei',
	'Juni',
	'Juli',
	'Agustus',
	'September',
	'Oktober',
	'November',
	'Desember',
];

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export type CronPreview =
	| { ok: true; expression: string; explanation: string; runs: Date[] }
	| { ok: false; error: string };

export function normalizeCronExpression(expression: string): string {
	return expression.trim().split(/\s+/).filter(Boolean).join(' ');
}

function pad(value: string): string {
	return value.padStart(2, '0');
}

function timeLabel(hour: string, minute: string): string {
	return `${pad(hour)}.${pad(minute)}`;
}

function describeDays(field: string): string | null {
	if (field === '1-5') return 'setiap hari kerja';
	if (field === '*' || field === '') return null;

	const names = field
		.split(',')
		.map((part) => {
			const range = /^(\d)-(\d)$/.exec(part);
			if (range) {
				const start = dayNames[Number(range[1]) % 7];
				const end = dayNames[Number(range[2]) % 7];
				return start && end ? `${start} sampai ${end}` : null;
			}
			if (/^\d$/.test(part)) return dayNames[Number(part) % 7] ?? null;
			return null;
		})
		.filter((name): name is string => Boolean(name));

	if (names.length === 0) return null;
	if (names.length === 1) return `setiap ${names[0]}`;
	return `setiap ${names.slice(0, -1).join(', ')} dan ${names[names.length - 1]}`;
}

function describeMonth(field: string): string | null {
	if (field === '*') return null;
	const parts = field.split(',').map((part) => /^\d+$/.test(part) ? monthNames[Number(part) - 1] : null);
	if (parts.some((part) => !part)) return null;
	return parts.join(', ');
}

export function explainCron(expression: string): string {
	const fields = normalizeCronExpression(expression).split(' ');
	if (fields.length !== 5) return 'Ekspresi cron harus terdiri dari 5 bagian.';

	const [minute, hour, dayOfMonth, month, dayOfWeek] = fields as [
		string,
		string,
		string,
		string,
		string,
	];

	if ([minute, hour, dayOfMonth, month, dayOfWeek].every((field) => field === '*')) {
		return 'Jadwal berjalan setiap menit.';
	}

	const minuteStep = /^\*\/(\d+)$/.exec(minute);
	if (minuteStep && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
		return `Jadwal berjalan setiap ${minuteStep[1]} menit.`;
	}

	if (hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
		if (minute === '*') return 'Jadwal berjalan setiap menit.';
		return `Jadwal berjalan setiap jam pada menit ${minute}.`;
	}

	const days = describeDays(dayOfWeek);
	const monthLabel = describeMonth(month);
	const fixedTime = /^\d+$/.test(hour) && /^\d+$/.test(minute);
	const timePart = fixedTime ? ` pukul ${timeLabel(hour, minute)}` : '';

	if (dayOfMonth === '*' && dayOfWeek !== '*' && days && (fixedTime || hour === '*')) {
		return `Jadwal berjalan ${days}${timePart}${hour === '*' ? ' setiap jam' : ''}.`;
	}

	if (dayOfWeek === '*' && dayOfMonth === '*' && (fixedTime || hour === '*')) {
		return `Jadwal berjalan setiap hari${monthLabel ? ` pada bulan ${monthLabel}` : ''}${timePart}${hour === '*' ? ' setiap jam' : ''}.`;
	}

	if (dayOfWeek === '*' && dayOfMonth !== '*' && fixedTime) {
		return `Jadwal berjalan setiap tanggal ${dayOfMonth}${monthLabel ? ` bulan ${monthLabel}` : ' setiap bulan'}${timePart}.`;
	}

	return `Jadwal khusus: menit ${minute}, jam ${hour}, tanggal ${dayOfMonth}, bulan ${month}, hari ${dayOfWeek}.`;
}

export function previewCron(
	expression: string,
	timezone: string,
	count = 5,
	from: Date = new Date(),
): CronPreview {
	const normalized = normalizeCronExpression(expression);
	if (normalized.split(' ').length !== 5) {
		return { ok: false, error: 'Ekspresi cron harus terdiri dari 5 bagian.' };
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
			return { ok: false, error: 'Tidak ada jadwal berikutnya untuk ekspresi ini.' };
		}

		return {
			ok: true,
			expression: normalized,
			explanation: explainCron(normalized),
			runs,
		};
	} catch {
		return {
			ok: false,
			error: 'Ekspresi atau zona waktu tidak valid. Periksa nilai tiap bagian.',
		};
	}
}
