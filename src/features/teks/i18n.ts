import { defineWorkspaceDictionary } from '../../lib/i18n';

export default defineWorkspaceDictionary({
	text: 'Teks', source: 'Teks sumber', placeholder: 'Tempel atau tulis teks di sini',
	characters: 'Karakter', noSpaces: 'Tanpa spasi', words: 'Kata', lines: 'Baris', sentences: 'Kalimat',
	loremCount: 'Jumlah kalimat lorem', fillLorem: 'Isi lorem', result: 'Hasil', copy: 'Salin', download: 'Unduh .txt',
	transform: 'Ubah teks', upper: 'HURUF BESAR', lower: 'huruf kecil', empty: 'Pilih salah satu tombol ubah untuk melihat hasil.',
	copied: 'Hasil disalin.', copyFailed: 'Gagal menyalin. Pilih teksnya lalu tekan Ctrl+C.', downloaded: 'Berkas teks diunduh.',
}, {
	text: 'Text', source: 'Source text', placeholder: 'Paste or type your text here',
	characters: 'Characters', noSpaces: 'Without spaces', words: 'Words', lines: 'Lines', sentences: 'Sentences',
	loremCount: 'Lorem sentence count', fillLorem: 'Insert lorem', result: 'Result', copy: 'Copy', download: 'Download .txt',
	transform: 'Transform text', upper: 'UPPERCASE', lower: 'lowercase', empty: 'Choose a text transformation to see the result.',
	copied: 'Result copied.', copyFailed: 'Could not copy. Select the text and press Ctrl+C.', downloaded: 'Text file downloaded.',
});
