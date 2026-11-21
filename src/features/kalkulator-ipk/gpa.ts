import { WorkspaceError } from '../../lib/i18n';
import dict from './i18n';
export const scales = {
	ab: { A: 4, AB: 3.5, B: 3, BC: 2.5, C: 2, D: 1, E: 0 },
	plus: { A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'B-': 2.7, 'C+': 2.3, C: 2, D: 1, E: 0 },
};
export interface Course { id: string; name: string; credits: number; grade: string }
export interface Semester { id: string; name: string; courses: Course[] }
export interface GpaData { version: 1; scale: 'ab' | 'plus'; values: Record<string, number>; semesters: Semester[] }
export interface Summary { credits: number; points: number; gpa: number | null }

export function summarize(courses: Course[], values: Record<string, number>): Summary {
	let credits = 0;
	let points = 0;
	for (const course of courses) {
		if (!Number.isFinite(course.credits) || course.credits < 0 || course.credits > 30) throw new WorkspaceError(dict, 'creditsError');
		if (course.grade === '' || course.credits === 0) continue;
		const value = values[course.grade];
		if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 4) throw new WorkspaceError(dict, 'gradeError');
		credits += course.credits; points += course.credits * value;
	}
	return { credits, points, gpa: credits === 0 ? null : points / credits };
}

export function cumulative(semesters: Semester[], values: Record<string, number>): Summary {
	return summarize(semesters.flatMap((semester) => semester.courses), values);
}

export function targetAverage(current: Summary, remaining: number, target: number, maxGrade = 4): { needed: number; possible: boolean; reached: boolean } {
	if (!Number.isFinite(remaining) || remaining <= 0 || remaining > 1000) throw new WorkspaceError(dict, 'remainingError');
	if (!Number.isFinite(target) || target < 0 || target > 4) throw new WorkspaceError(dict, 'targetError');
	if (!Number.isFinite(maxGrade) || maxGrade < 0 || maxGrade > 4) throw new WorkspaceError(dict, 'scaleError');
	const raw = (target * (current.credits + remaining) - current.points) / remaining;
	return { needed: Math.max(0, raw), possible: raw <= maxGrade + 1e-12, reached: raw <= 0 };
}

export function changeScale(data: GpaData, scale: GpaData['scale']): GpaData {
	const values = { ...scales[scale] };
	return { ...data, scale, values, semesters: data.semesters.map((semester) => ({ ...semester, courses: semester.courses.map((course) => ({ ...course, grade: Object.hasOwn(values, course.grade) ? course.grade : '' })) })) };
}

export function parseData(raw: string): GpaData {
	if (raw.length > 1_000_000) throw new WorkspaceError(dict, 'sizeError');
	const data = JSON.parse(raw);
	const invalid = () => { throw new WorkspaceError(dict, 'dataError'); };
	if (!data || data.version !== 1 || !['ab', 'plus'].includes(data.scale) || !data.values || typeof data.values !== 'object' || Array.isArray(data.values) || !Array.isArray(data.semesters) || data.semesters.length > 50) invalid();
	const expected = Object.keys(scales[data.scale as GpaData['scale']]);
	if (Object.keys(data.values).length !== expected.length || !expected.every((grade) => Object.hasOwn(data.values, grade) && typeof data.values[grade] === 'number' && Number.isFinite(data.values[grade]) && data.values[grade] >= 0 && data.values[grade] <= 4)) invalid();
	const ids = new Set<string>();
	const validId = (id: unknown) => { if (typeof id !== 'string' || id.length === 0 || id.length > 100 || ids.has(id)) invalid(); ids.add(id as string); };
	for (const semester of data.semesters) {
		if (!semester || typeof semester.name !== 'string' || semester.name.length > 200 || !Array.isArray(semester.courses) || semester.courses.length > 100) invalid();
		validId(semester.id);
		for (const course of semester.courses) {
			if (!course || typeof course.name !== 'string' || course.name.length > 200 || typeof course.credits !== 'number' || !Number.isFinite(course.credits) || course.credits < 0 || course.credits > 30 || typeof course.grade !== 'string' || (course.grade !== '' && !expected.includes(course.grade))) invalid();
			validId(course.id);
		}
	}
	return data as GpaData;
}

export function initialData(): GpaData {
	return { version: 1, scale: 'ab', values: { ...scales.ab }, semesters: [{ id: crypto.randomUUID(), name: 'Semester 1', courses: [{ id: crypto.randomUUID(), name: '', credits: 3, grade: '' }] }] };
}
