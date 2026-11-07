import { describe, expect, it } from 'vitest';
import {
	friendlyMessage,
	pathFromInstance,
	validateJsonSchema,
} from './schema-validator';

const schema = JSON.stringify({
	type: 'object',
	required: ['nama', 'email'],
	properties: {
		nama: { type: 'string', minLength: 2 },
		umur: { type: 'integer', minimum: 17 },
		email: { type: 'string' },
		tag: { type: 'array', items: { type: 'string' }, minItems: 1 },
	},
	additionalProperties: false,
});

const data = JSON.stringify({ nama: 'A', umur: 15, tag: [1], extra: true });

describe('pathFromInstance', () => {
	it('mengubah lokasi instance menjadi path yang mudah dibaca', () => {
		expect(pathFromInstance('#')).toBe('$');
		expect(pathFromInstance('#/user/email')).toBe('$.user.email');
		expect(pathFromInstance('#/tag/0')).toBe('$.tag[0]');
		expect(pathFromInstance('#/a~1b')).toBe('$.a/b');
	});
});

describe('friendlyMessage', () => {
	it('menerjemahkan pesan umum ke bahasa Indonesia', () => {
		expect(friendlyMessage('required', 'Instance does not have required property "email".')).toBe(
			'Properti wajib "email" belum ada.',
		);
		expect(
			friendlyMessage('type', 'Instance type "number" is invalid. Expected "string".'),
		).toBe('Tipe harus string, bukan number.');
		expect(friendlyMessage('minLength', 'String is too short (1 < 2).')).toBe(
			'Panjang minimal 2 karakter, sekarang 1.',
		);
		expect(friendlyMessage('minimum', '15 is less than 17.')).toBe(
			'Nilai minimal 17, sekarang 15.',
		);
		expect(
			friendlyMessage(
				'additionalProperties',
				'Property "extra" does not match additional properties schema.',
			),
		).toBe('Properti "extra" tidak diizinkan.');
	});
});

describe('validateJsonSchema', () => {
	it('menerima data yang sesuai schema', () => {
		const result = validateJsonSchema(
			JSON.stringify({ type: 'object', required: ['nama'], properties: { nama: { type: 'string' } } }),
			JSON.stringify({ nama: 'Budi' }),
		);
		expect(result).toEqual({ ok: true, valid: true, issues: [] });
	});

	it('mengumpulkan error per path tanpa pesan pembungkus', () => {
		const result = validateJsonSchema(schema, data);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.valid).toBe(false);
		expect(result.issues).toEqual(
			expect.arrayContaining([
				{ path: '$', message: 'Properti wajib "email" belum ada.' },
				{ path: '$.nama', message: 'Panjang minimal 2 karakter, sekarang 1.' },
				{ path: '$.umur', message: 'Nilai minimal 17, sekarang 15.' },
				{ path: '$.tag[0]', message: 'Tipe harus string, bukan number.' },
				{ path: '$', message: 'Properti "extra" tidak diizinkan.' },
			]),
		);
		expect(result.issues.some((issue) => issue.message.includes('does not match'))).toBe(false);
	});

	it('melaporkan JSON schema yang rusak dengan posisi baris', () => {
		const result = validateJsonSchema('{ "type": ', '{}');
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.kind).toBe('schema');
		expect(result.error).toContain('baris');
	});

	it('melaporkan JSON data yang rusak dengan posisi baris', () => {
		const result = validateJsonSchema('{ "type": "object" }', '{ "nama": }');
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.kind).toBe('data');
	});

	it('menolak schema yang bukan objek atau boolean', () => {
		const result = validateJsonSchema('"teks"', '{}');
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.kind).toBe('schema');
	});
});
