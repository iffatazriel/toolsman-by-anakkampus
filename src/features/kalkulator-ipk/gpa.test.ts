import { describe, expect, it } from 'vitest';
import { changeScale, cumulative, initialData, parseData, scales, summarize, targetAverage, type Course, type GpaData } from './gpa';

const course = (credits: number, grade: string): Course => ({ id: crypto.randomUUID(), name: 'Kuliah', credits, grade });
describe('perhitungan IPK', () => {
	it('memakai skala standar yang diminta', () => {
		expect(scales.ab).toEqual({ A: 4, AB: 3.5, B: 3, BC: 2.5, C: 2, D: 1, E: 0 });
		expect(scales.plus).toEqual({ A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'B-': 2.7, 'C+': 2.3, C: 2, D: 1, E: 0 });
	});
	it('menghasilkan kosong tanpa nilai dan mengabaikan SKS nol', () => {
		expect(summarize([], scales.ab)).toEqual({ credits: 0, points: 0, gpa: null });
		expect(summarize([course(3, ''), course(0, 'A')], scales.ab).gpa).toBeNull();
	});
	it('menghitung rata-rata berbobot dan tetap menghitung E', () => {
		expect(summarize([course(3, 'A'), course(1, 'E')], scales.ab)).toEqual({ credits: 4, points: 12, gpa: 3 });
		expect(summarize([course(2, 'AB'), course(2, 'BC')], scales.ab).gpa).toBe(3);
	});
	it('tidak membulatkan sebelum tampilan', () => {
		const result = summarize([course(1, 'A'), course(2, 'B')], scales.ab);
		expect(result.gpa).toBe(10 / 3); expect(result.gpa).not.toBe(3.33);
	});
	it('menggabungkan SKS bukan merata-ratakan IPS', () => {
		const semesters = [{ id: 'a', name: '1', courses: [course(3, 'A')] }, { id: 'b', name: '2', courses: [course(1, 'B')] }];
		expect(cumulative(semesters, scales.ab)).toEqual({ credits: 4, points: 15, gpa: 3.75 });
		expect(cumulative([], scales.ab).gpa).toBeNull();
	});
	it('mendukung bobot kustom dan SKS pecahan', () => {
		expect(summarize([course(1.5, 'A'), course(0.5, 'B')], { ...scales.ab, A: 3.9 })).toEqual({ credits: 2, points: 7.35, gpa: 3.675 });
	});
	it('menolak SKS dan bobot yang rusak', () => {
		for (const credits of [-1, 31, Infinity, NaN]) expect(() => summarize([course(credits, 'A')], scales.ab)).toThrow('SKS');
		for (const value of [-1, 5, Infinity, NaN]) expect(() => summarize([course(3, 'A')], { A: value })).toThrow('Nilai');
		expect(() => summarize([course(3, 'X')], scales.ab)).toThrow('Nilai');
	});
	it('menghitung target yang mungkin, tepat di batas, dan mustahil', () => {
		const current = { credits: 20, points: 60, gpa: 3 };
		expect(targetAverage(current, 20, 3.5)).toEqual({ needed: 4, possible: true, reached: false });
		expect(targetAverage(current, 10, 3.5).possible).toBe(false);
		expect(targetAverage(current, 20, 3.5, 3.9).possible).toBe(false);
		expect(targetAverage(current, 20, 1)).toEqual({ needed: 0, possible: true, reached: true });
	});
	it('menghitung target tanpa SKS lama dan membedakan target nol', () => {
		const empty = summarize([], scales.ab);
		expect(targetAverage(empty, 10, 3).needed).toBe(3);
		expect(targetAverage(empty, 10, 0)).toEqual({ needed: 0, possible: true, reached: true });
	});
	it('menolak sisa SKS dan target tidak valid', () => {
		const empty = summarize([], scales.ab);
		for (const n of [0, -1, NaN, Infinity, 1001]) expect(() => targetAverage(empty, n, 3)).toThrow('SKS');
		for (const n of [-1, 5, NaN, Infinity]) expect(() => targetAverage(empty, 10, n)).toThrow('Target');
	});
	it('mengganti skala tanpa memutasi data dan mengosongkan nilai yang hilang', () => {
		const data = initialData(); data.semesters[0]!.courses = [course(3, 'AB'), course(3, 'A')];
		const next = changeScale(data, 'plus');
		expect(next.values).toEqual(scales.plus); expect(next.semesters[0]!.courses.map((c) => c.grade)).toEqual(['', 'A']);
		expect(data.semesters[0]!.courses[0]!.grade).toBe('AB');
	});
	it('memulihkan JSON dan menerima semester kosong', () => {
		const data = initialData(); expect(parseData(JSON.stringify(data))).toEqual(data);
		expect(parseData(JSON.stringify({ ...data, semesters: [] })).semesters).toEqual([]);
	});
	it('menolak JSON rusak, versi lain, skala tidak cocok, duplikasi ID', () => {
		const data = initialData();
		for (const raw of ['bad', 'null', '{}', '[]', 'x'.repeat(1_000_001)]) expect(() => parseData(raw)).toThrow();
		const invalid: unknown[] = [{ ...data, version: 2 }, { ...data, scale: 'other' }, { ...data, values: { A: 4 } }, { ...data, values: { ...data.values, A: -1 } }, { ...data, semesters: [...data.semesters, ...data.semesters] }];
		for (const value of invalid) expect(() => parseData(JSON.stringify(value))).toThrow();
		const broken: GpaData = { ...data, semesters: [{ id: 's', name: 'Semester', courses: [{ id: 'c', name: '', credits: 3, grade: 'A-' }] }] };
		expect(() => parseData(JSON.stringify(broken))).toThrow();
	});
});
