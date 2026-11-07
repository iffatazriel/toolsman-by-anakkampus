export const mockFields = [
	{ id: 'id', label: 'ID' },
	{ id: 'nama', label: 'Nama' },
	{ id: 'email', label: 'Email' },
	{ id: 'telepon', label: 'Telepon' },
	{ id: 'kota', label: 'Kota' },
	{ id: 'tanggal', label: 'Tanggal' },
	{ id: 'angka', label: 'Angka' },
	{ id: 'aktif', label: 'Aktif' },
] as const;

export type MockField = (typeof mockFields)[number]['id'];

export type MockRow = Record<string, string | number | boolean>;

export interface MockOptions {
	count: number;
	fields: MockField[];
	seed: number;
}

export const MAX_MOCK_ROWS = 200;
export const DEFAULT_MOCK_FIELDS: MockField[] = ['id', 'nama', 'email', 'kota'];

const firstNames = [
	'Budi',
	'Sari',
	'Rizky',
	'Nadia',
	'Agus',
	'Dewi',
	'Fajar',
	'Intan',
	'Hendra',
	'Maya',
	'Reza',
	'Putri',
];

const lastNames = [
	'Santoso',
	'Wijaya',
	'Pratama',
	'Lestari',
	'Nugroho',
	'Saputra',
	'Hidayat',
	'Kusuma',
];

const cities = [
	'Bandung',
	'Jakarta',
	'Surabaya',
	'Yogyakarta',
	'Medan',
	'Semarang',
	'Makassar',
	'Malang',
];

const domains = ['contoh.id', 'mail.test', 'kampus.ac.id'];

function createRandom(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state += 0x6d2b79f5;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

function pick<T>(items: readonly T[], random: () => number): T {
	return items[Math.floor(random() * items.length)] ?? items[0]!;
}

export function generateMockData(options: MockOptions): MockRow[] {
	const count = Math.min(
		MAX_MOCK_ROWS,
		Math.max(1, Math.trunc(Number(options.count)) || 1),
	);
	const fields = mockFields
		.map((field) => field.id)
		.filter((field) => options.fields.includes(field));
	const random = createRandom(options.seed);

	return Array.from({ length: count }, (_, index) => {
		const first = pick(firstNames, random);
		const last = pick(lastNames, random);
		const row: MockRow = {};

		for (const field of fields) {
			if (field === 'id') row.id = index + 1;
			if (field === 'nama') row.nama = `${first} ${last}`;
			if (field === 'email') {
				row.email = `${first}.${last}${index + 1}@${pick(domains, random)}`.toLowerCase();
			}
			if (field === 'telepon') {
				row.telepon = `08${Array.from({ length: 10 }, () => Math.floor(random() * 10)).join('')}`;
			}
			if (field === 'kota') row.kota = pick(cities, random);
			if (field === 'tanggal') {
				const start = Date.UTC(2024, 0, 1);
				const end = Date.UTC(2026, 11, 31);
				row.tanggal = new Date(start + Math.floor(random() * (end - start)))
					.toISOString()
					.slice(0, 10);
			}
			if (field === 'angka') row.angka = Math.floor(random() * 1000) + 1;
			if (field === 'aktif') row.aktif = random() >= 0.5;
		}

		return row;
	});
}

function csvEscape(value: string): string {
	if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
	return value;
}

export function mockToCsv(rows: MockRow[]): string {
	if (rows.length === 0) return '';
	const headers = Object.keys(rows[0]!);
	const lines = [headers.map(csvEscape).join(',')];

	for (const row of rows) {
		lines.push(
			headers
				.map((header) => csvEscape(String(row[header] ?? '')))
				.join(','),
		);
	}

	return `${lines.join('\n')}\n`;
}

export function mockToJson(rows: MockRow[]): string {
	return JSON.stringify(rows, null, 2);
}
