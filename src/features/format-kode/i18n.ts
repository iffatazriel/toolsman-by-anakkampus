import { defineWorkspaceDictionary } from '../../lib/i18n';

export default defineWorkspaceDictionary({
	language: 'Bahasa', dialect: 'Dialek SQL', standard: 'Standar', indent: 'Indentasi', spaces2: '2 spasi', spaces4: '4 spasi',
	keywordCase: 'Kata kunci SQL', upper: 'HURUF BESAR', lower: 'huruf kecil', preserve: 'Pertahankan',
	hint: 'Maksimal 500.000 karakter. SQL dirapikan, bukan divalidasi penuh. Minify tersedia untuk JSON dan CSS.',
	input: 'Kode kamu', inputPlaceholder: 'Tempel kode kamu di sini', format: 'Format', minify: 'Minify', result: 'Hasil',
	outputPlaceholder: 'Hasil format muncul di sini', copy: 'Salin', download: 'Unduh .{extension}',
	empty: 'Tempel kode kamu dulu, lalu pilih Format atau Minify.', processing: 'Mengolah kode…', ready: 'Kode siap disalin atau diunduh.',
	errorFailed: 'Kode gagal diolah. Coba lagi.', copied: 'Hasil disalin.', copyFailed: 'Gagal menyalin. Pilih hasilnya lalu tekan Ctrl+C.',
	errorTooLong: 'Kode lebih dari 500.000 karakter. Pecah dulu menjadi bagian yang lebih kecil.',
	errorMinify: 'Minify tersedia untuk JSON dan CSS. Pilih Format untuk bahasa ini.',
	errorInvalid: 'Kode belum bisa diolah. Periksa sintaks dan pilihan bahasa atau dialek kamu. {detail}', errorUnknown: 'Kesalahan tidak dikenal.',
}, {
	language: 'Language', dialect: 'SQL dialect', standard: 'Standard', indent: 'Indentation', spaces2: '2 spaces', spaces4: '4 spaces',
	keywordCase: 'SQL keyword case', upper: 'UPPERCASE', lower: 'lowercase', preserve: 'Keep original',
	hint: 'Up to 500,000 characters. SQL is formatted, not fully validated. Minify is available for JSON and CSS.',
	input: 'Your code', inputPlaceholder: 'Paste your code here', format: 'Format', minify: 'Minify', result: 'Result',
	outputPlaceholder: 'Formatted code appears here', copy: 'Copy', download: 'Download .{extension}',
	empty: 'Paste some code, then choose Format or Minify.', processing: 'Formatting code…', ready: 'Your code is ready to copy or download.',
	errorFailed: 'Could not format the code. Try again.', copied: 'Result copied.', copyFailed: 'Could not copy. Select the result and press Ctrl+C.',
	errorTooLong: 'Code exceeds 500,000 characters. Split it into smaller sections.',
	errorMinify: 'Minify is available for JSON and CSS. Use Format for this language.',
	errorInvalid: 'Could not format the code. Check the syntax and selected language or dialect. {detail}', errorUnknown: 'Unknown error.',
});
