import { defineWorkspaceDictionary } from '../../lib/i18n';
export default defineWorkspaceDictionary({
	input: 'Masukan', inputType: 'Jenis masukan', text: 'Teks', file: 'Berkas', source: 'Teks yang akan di-hash', placeholder: 'Tempel teks di sini',
	choose: 'Pilih berkas', hint: 'Semua jenis berkas, maks. 50 MB. Berkas tidak diunggah.', algorithm: 'Algoritme', compare: 'Bandingkan dengan hash', comparePlaceholder: 'Tempel hash pembanding', compareHint: 'Spasi dan besar-kecil huruf diabaikan saat membandingkan.',
	initial: 'Masukkan teks atau pilih berkas.', copy: 'Salin', empty: 'Hash muncul di sini setelah ada masukan.', match: 'Cocok', mismatch: 'Tidak cocok', characters: '{algorithm} · {n} karakter', chooseFirst: 'Pilih berkas dulu.', failed: 'Hash gagal dihitung. Coba lagi.', tooLarge: 'Berkas lebih dari 50 MB. Pilih berkas lain.', copied: 'Hash disalin.', copyFailed: 'Gagal menyalin. Pilih teksnya lalu tekan Ctrl+C.',
}, {
	input: 'Input', inputType: 'Input type', text: 'Text', file: 'File', source: 'Text to hash', placeholder: 'Paste text here',
	choose: 'Choose a file', hint: 'Any file type, up to 50 MB. Files are not uploaded.', algorithm: 'Algorithm', compare: 'Compare with a hash', comparePlaceholder: 'Paste the expected hash', compareHint: 'Comparison ignores spaces and letter case.',
	initial: 'Enter text or choose a file.', copy: 'Copy', empty: 'Your hash appears here once you add input.', match: 'Match', mismatch: 'No match', characters: '{algorithm} · {n} characters', chooseFirst: 'Choose a file first.', failed: 'Could not calculate the hash. Try again.', tooLarge: 'File exceeds 50 MB. Choose another file.', copied: 'Hash copied.', copyFailed: 'Could not copy. Select the text and press Ctrl+C.',
});
