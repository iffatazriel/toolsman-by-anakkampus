import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'tabel-latex', name: 'Tabel Markdown ke LaTeX', category: 'dokumen', icon: 'table', status: 'siap', privacy: 'lokal',
	tagline: 'Ubah tabel Markdown, CSV, atau TSV dari spreadsheet menjadi LaTeX dengan pratinjau, perataan, dan escape otomatis.',
	keywords: ['tabel', 'markdown', 'latex', 'tabular', 'csv', 'tsv', 'excel', 'sheets', 'booktabs'],
	usage: ['Tempel tabel Markdown, CSV, atau TSV. Baris pertama dipakai sebagai header.', 'Atur garis, caption, label, dan kolom sambil memeriksa pratinjau.', 'Salin atau unduh .tex. Pilih arah balik untuk mengubah tabular sederhana ke Markdown.'],
	privacyDetail: 'Tabel diproses hanya di browser kamu, tanpa unggahan, penyimpanan otomatis, atau kompilasi LaTeX di server.',
	faq: [{ q: 'Apa batasan konversinya?', a: 'Maksimal 200.000 karakter, 2.000 baris data, 100 kolom, dan 10.000 sel. CSV/TSV mendukung kutip ganda dan baris baru di dalam sel. Teks Markdown tidak dirender sebagai HTML; baris baru sel dijadikan spasi pada output. Reverse hanya mendukung tabular sederhana, bukan rumus, multicolumn, atau macro khusus.' }],
};
