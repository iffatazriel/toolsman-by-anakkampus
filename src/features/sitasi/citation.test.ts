import { describe, expect, it } from 'vitest';
import { bibtex, citation, orderedEntries, readEntries, validateEntry, type Entry } from './citation';

const book: Entry = { id: '1', type: 'book', authors: [{ first: 'John Ronald', last: 'Smith' }], year: '2024', title: 'A book', publisher: 'Press', volume: '', issue: '', pages: '', doi: '', url: '', accessed: '' };
const authors = (count: number) => Array.from({ length: count }, (_, i) => ({ first: 'Alex Bob', last: `Name${i + 1}` }));
describe('sitasi', () => {
	it('memformat buku APA dan IEEE serta kutipan teks', () => {
		expect(citation(book, 'apa')).toEqual({ html: 'Smith, J. R. (2024). <i>A book</i>. Press.', text: 'Smith, J. R. (2024). A book. Press.', inText: '(Smith, 2024)' });
		expect(citation(book, 'ieee', 2).text).toBe('[2] J. R. Smith, A book, Press, 2024.');
		expect(citation(book, 'ieee', 2).inText).toBe('[2]');
	});
	it('menangani 2, 3, 20, dan lebih dari 20 penulis APA', () => {
		expect(citation({ ...book, authors: authors(2) }, 'apa').text).toContain('Name1, A. B. & Name2, A. B.');
		expect(citation({ ...book, authors: authors(3) }, 'apa').text).toContain('Name2, A. B., & Name3, A. B.');
		expect(citation({ ...book, authors: authors(3) }, 'apa').inText).toBe('(Name1 et al., 2024)');
		expect(citation({ ...book, authors: authors(20) }, 'apa').text).toContain('& Name20, A. B.');
		const many = citation({ ...book, authors: authors(21) }, 'apa').text;
		expect(many).toContain('Name19, A. B., … Name21, A. B.'); expect(many).not.toContain('Name20,'); expect(many).not.toContain('&');
	});
	it('memakai semua 6 penulis IEEE lalu et al. untuk 7', () => {
		expect(citation({ ...book, authors: authors(6) }, 'ieee').text).toContain('and A. B. Name6');
		expect(citation({ ...book, authors: authors(7) }, 'ieee').text).toContain('A. B. Name1 et al.,');
		expect(citation({ ...book, authors: authors(7) }, 'ieee').text).not.toContain('Name2');
	});
	it('menangani nama tunggal, organisasi, tanpa penulis dan tahun', () => {
		expect(citation({ ...book, authors: [{ first: '', last: 'Sukarno' }] }, 'apa').text).toContain('Sukarno. (2024)');
		expect(citation({ ...book, authors: [], year: '' }, 'apa').text).toBe('A book. (n.d.). Press.');
		expect(citation({ ...book, authors: [{ first: '', last: 'World Health Organization' }] }, 'ieee').text).toContain('World Health Organization');
	});
	it('memformat jurnal lengkap dengan DOI dan rentang halaman', () => {
		const journal: Entry = { ...book, type: 'journal', title: 'Study', publisher: 'Journal', volume: '12', issue: '3', pages: '10-20', doi: 'https://doi.org/10.1234/test' };
		expect(citation(journal, 'apa').html).toBe('Smith, J. R. (2024). Study. <i>Journal, 12</i>(3), 10–20. https://doi.org/10.1234/test');
		expect(citation(journal, 'ieee').text).toBe('[1] J. R. Smith, “Study,” Journal, vol. 12, no. 3, pp. 10–20, 2024. doi: 10.1234/test.');
	});
	it('memformat web dan tanggal akses', () => {
		const web: Entry = { ...book, type: 'web', url: 'https://example.com', accessed: '2025-01-02' };
		expect(citation(web, 'apa').text).toContain('Retrieved January 2, 2025, from https://example.com');
		expect(citation(web, 'ieee').text).toContain('[Online]. Available: https://example.com. Accessed: January 2, 2025.');
		expect(citation({ ...web, accessed: '' }, 'apa').text).not.toContain('Retrieved');
	});
	it('mengurutkan APA menurut nama, tahun dan judul; IEEE tidak berubah', () => {
		const a = { ...book, id: 'a', authors: [{ first: 'A', last: 'Alpha' }] };
		const older = { ...a, id: 'b', year: '2020' };
		expect(orderedEntries([book, a, older], 'apa').map((e) => e.id)).toEqual(['b', 'a', '1']);
		expect(orderedEntries([book, a, older], 'ieee')).toEqual([book, a, older]);
	});
	it('mengamankan HTML tanpa mengubah teks asli', () => {
		const e = { ...book, title: '<img src=x onerror=alert(1)> & "x"' };
		expect(citation(e, 'apa').html).not.toContain('<img'); expect(citation(e, 'apa').text).toContain(e.title);
	});
	it('menolak input tidak valid dan menerima daftar kosong', () => {
		for (const change of [{ title: '' }, { year: 'abc' }, { doi: 'oops' }, { url: 'javascript:alert(1)' }, { accessed: '2025-02-30' }]) expect(() => validateEntry({ ...book, ...change })).toThrow();
		expect(readEntries('[]')).toEqual([]); expect(readEntries(JSON.stringify([book]))).toEqual([book]);
		for (const raw of ['null', '{}', '[{}]', 'bad']) expect(() => readEntries(raw)).toThrow();
	});
	it('mengekspor BibTeX dengan penulis lengkap dan escaping', () => {
		const out = bibtex({ ...book, title: 'A & {B}', authors: authors(2) }, 1);
		expect(out).toContain('@book{sumber1,'); expect(out).toContain('Name1, Alex Bob and Name2, Alex Bob'); expect(out).toContain('A \\& \\{B\\}');
		expect(bibtex({ ...book, type: 'journal', pages: '2-4' }, 2)).toContain('pages = {2--4}');
		expect(bibtex({ ...book, type: 'web' }, 3)).toContain('@misc{sumber3,');
	});
});
