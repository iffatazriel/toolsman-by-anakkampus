import type { ToolCategory } from './tool-types';

export type Lang = 'id' | 'en';
export const LANG_KEY = 'toolsman-lang';

export const ui: Record<Lang, Record<string, string>> = {
	id: {
		'nav.skip': 'Langsung ke konten',
		'nav.search': 'Cari alat',
		'nav.about': 'Tentang',
		'footer.tagline': 'Toolsman, kotak perkakas untuk kuliah dan koding.',
		'footer.catalog': 'Katalog alat',
		'footer.about': 'Tentang',
		'footer.privacy': 'Privasi',
		'footer.terms': 'Syarat',
		'footer.license': 'Lisensi',
		'footer.note':
			'Gratis, tanpa akun. File diproses di perangkatmu, kecuali Kirim File. {year}',
		'footer.privacyLine': 'File diproses di perangkatmu, kecuali Kirim File.',
		'footer.toolsLabel': 'Alat per kategori',
		'footer.project': 'Proyek',
		'footer.copyright': '© {year} Toolsman',
		'footer.made': 'Dibuat untuk anak kampus',
		'home.searchLabel': 'Cari alat',
		'home.searchPlaceholder': 'mis. gabung pdf atau flowchart',
		'home.searchHint': 'Tekan / atau Ctrl K untuk membuka pencarian dari halaman mana saja.',
		'home.heroTitle': 'Semua perkakas kuliahmu, satu kotak.',
		'home.heroLede':
			'{n} alat: kanvas gambar, diagram, PDF, pas foto, kirim file, generator teks, sampai penghitung hash. Gratis, tanpa akun.',
		'home.heroPrivacy': 'File diproses di perangkatmu, kecuali Kirim File.',
		'home.examplesLabel': 'Coba:',
		'home.favorites': 'Favoritmu',
		'home.recent': 'Terakhir dipakai',
		'home.saved': 'Disimpan di browser ini',
		'home.allTools': 'Semua alat',
		'home.principlesTitle': 'Aturan yang kami pakai',
		'home.principlesLede': 'Ini yang menentukan bentuk Toolsman.',
		'home.p1Title': 'Gratis dan tanpa akun',
		'home.p1Body':
			'Semua alat bisa dipakai tanpa daftar. Tidak ada batas harian yang ujungnya menyuruh kamu bikin akun.',
		'home.p2Title': 'File tetap di perangkatmu',
		'home.p2Body':
			'Draw, diagram, PDF, pas foto, generator, utilitas, dan QR memproses isi di browser. Kirim File memakai server karena link harus bisa dibuka orang lain.',
		'home.p3Title': 'Satu pola untuk semua alat',
		'home.p3Body':
			'Tiap halaman alat punya susunan yang sama: area kerja, panel opsi, satu tombol utama. Kamu tidak perlu belajar ulang tiap alat.',
		'catalog.title': 'Alat di daftar MVP',
		'catalog.meta': '{n} modul',
		'catalog.intro':
			'{n} alat di bawah ini bisa langsung dipakai. File diproses di browser, kecuali Kirim File yang memakai server dan ditandai di kartunya.',
		'catalog.all': 'Semua',
		'catalog.count': '{n} alat',
		'catalog.countFiltered': '{visible} dari {total} alat',
		'catalog.emptyTitle': 'Tidak ada alat yang cocok',
		'catalog.emptyBody':
			'Belum ada hasil untuk "{query}" di kategori yang dipilih. Coba kata lain seperti "pdf", "foto", atau "json", atau hapus filter kategori.',
		'catalog.reset': 'Hapus filter',
		'tool.home': 'Beranda',
		'tool.notReady': 'Alat ini belum jadi',
		'tool.notReadyBody':
			'{name} masuk daftar PRD dan akan muncul di sini setelah selesai. Tidak ada tombol unggah di halaman ini supaya kamu tidak mengira alatnya sudah jalan.',
		'tool.openCatalog': 'Buka katalog alat',
		'tool.usage': 'Cara pakai',
		'tool.plans': 'Yang direncanakan',
		'tool.plansHint': 'Diambil dari PRD v1.0, modul {name}.',
		'tool.related': 'Alat lain di daftar',
		'tool.faq': 'Pertanyaan umum',
		'tool.copyLink': 'Salin link',
		'tool.favorite': 'Favorit',
		'tool.ready': 'Siap dipakai',
		'tool.notReadyStatus': 'Belum jadi',
		'privacy.lokal': 'Di perangkatmu',
		'privacy.server': 'Pakai server',
		'palette.label': 'Cari alat',
		'palette.placeholder': 'mis. gabung pdf, flowchart, pas foto',
		'palette.empty':
			'Belum ada alat yang cocok. Coba kata lain seperti "pdf", "foto", atau "json".',
		'palette.updown': '↑ ↓ untuk pilih',
		'palette.enter': 'Enter untuk buka',
		'palette.recent': 'Terakhir dipakai',
		'theme.toDark': 'Ganti ke tema gelap',
		'theme.toLight': 'Ganti ke tema terang',
		'lang.label': 'Ganti bahasa',
		'favorite.save': 'Simpan {name} ke favorit',
		'favorite.remove': 'Hapus {name} dari favorit',
	},
	en: {
		'nav.skip': 'Skip to content',
		'nav.search': 'Search tools',
		'nav.about': 'About',
		'footer.tagline': 'Toolsman, a toolbox for study and coding.',
		'footer.catalog': 'Tool catalog',
		'footer.about': 'About',
		'footer.privacy': 'Privacy',
		'footer.terms': 'Terms',
		'footer.license': 'License',
		'footer.note': 'Free, no account. Files are processed on your device, except Send File. {year}',
		'footer.privacyLine': 'Files are processed on your device, except Send File.',
		'footer.toolsLabel': 'Tools by category',
		'footer.project': 'Project',
		'footer.copyright': '© {year} Toolsman',
		'footer.made': 'Made for campus kids',
		'home.searchLabel': 'Search tools',
		'home.searchPlaceholder': 'e.g. merge pdf or flowchart',
		'home.searchHint': 'Press / or Ctrl K to open search from any page.',
		'home.heroTitle': 'All your study tools, one box.',
		'home.heroLede':
			'{n} tools: drawing canvas, diagrams, PDF, ID photos, file sharing, text generators, and hash checks. Free, no account.',
		'home.heroPrivacy': 'Files are processed on your device, except Send File.',
		'home.examplesLabel': 'Try:',
		'home.favorites': 'Your favorites',
		'home.recent': 'Recently used',
		'home.saved': 'Saved in this browser',
		'home.allTools': 'All tools',
		'home.principlesTitle': 'Rules we follow',
		'home.principlesLede': 'These decisions shape Toolsman.',
		'home.p1Title': 'Free and no account',
		'home.p1Body':
			'Every tool works without signing up. There is no daily limit that ends with a request to create an account.',
		'home.p2Title': 'Files stay on your device',
		'home.p2Body':
			'Draw, diagrams, PDF, ID photos, generators, utilities, and QR process content in the browser. Send File uses a server because the link must open elsewhere.',
		'home.p3Title': 'One pattern for every tool',
		'home.p3Body':
			'Each tool page has the same shape: a workspace, an options panel, and one main action. You do not relearn the interface for each tool.',
		'catalog.title': 'Tools in the MVP list',
		'catalog.meta': '{n} modules',
		'catalog.intro':
			'The {n} tools below are ready to use. Files are processed in the browser, except Send File which uses a server and says so on its card.',
		'catalog.all': 'All',
		'catalog.count': '{n} tools',
		'catalog.countFiltered': '{visible} of {total} tools',
		'catalog.emptyTitle': 'No matching tools',
		'catalog.emptyBody':
			'No results for "{query}" in the selected category. Try another word such as "pdf", "photo", or "json", or clear the category filter.',
		'catalog.reset': 'Clear filters',
		'tool.home': 'Home',
		'tool.notReady': 'This tool is not ready',
		'tool.notReadyBody':
			'{name} is on the PRD list and will appear here when it is finished. There is no upload button on this page so you do not think it already works.',
		'tool.openCatalog': 'Open the tool catalog',
		'tool.usage': 'How to use',
		'tool.plans': 'Planned features',
		'tool.plansHint': 'From PRD v1.0, module {name}.',
		'tool.related': 'More tools',
		'tool.faq': 'Common questions',
		'tool.copyLink': 'Copy link',
		'tool.favorite': 'Favorite',
		'tool.ready': 'Ready to use',
		'tool.notReadyStatus': 'Not ready',
		'privacy.lokal': 'On your device',
		'privacy.server': 'Uses a server',
		'palette.label': 'Search tools',
		'palette.placeholder': 'e.g. merge pdf, flowchart, id photo',
		'palette.empty': 'No matching tools. Try another word such as "pdf", "photo", or "json".',
		'palette.updown': '↑ ↓ to select',
		'palette.enter': 'Enter to open',
		'palette.recent': 'Recently used',
		'theme.toDark': 'Switch to dark theme',
		'theme.toLight': 'Switch to light theme',
		'lang.label': 'Switch language',
		'favorite.save': 'Save {name} to favorites',
		'favorite.remove': 'Remove {name} from favorites',
	},
};

export const categoryText: Record<Lang, Record<ToolCategory, string>> = {
	id: {
		gambar: 'Gambar',
		diagram: 'Diagram',
		dokumen: 'Dokumen',
		foto: 'Foto',
		berbagi: 'Berbagi',
		generator: 'Generator',
		utilitas: 'Utilitas',
		ai: 'AI',
	},
	en: {
		gambar: 'Images',
		diagram: 'Diagrams',
		dokumen: 'Documents',
		foto: 'Photos',
		berbagi: 'Sharing',
		generator: 'Generators',
		utilitas: 'Utilities',
		ai: 'AI',
	},
};

export interface ToolText {
	name: string;
	tagline: string;
	usage: string[];
}

export const toolText: Record<string, Record<Lang, ToolText>> = {
	draw: {
		en: {
			name: 'Drawing Canvas',
			tagline:
				'Sketch freely, write notes, copy the image, or export PNG, SVG, and .excalidraw.',
			usage: [
				'Draw on the canvas. Changes are saved in this browser.',
				'Rename the file, then copy or download it as PNG, SVG, or .excalidraw.',
				'The canvas follows the site theme and updates when you switch.',
			],
		},
		id: {
			name: 'Kanvas Gambar',
			tagline:
				'Gambar bebas, tulis catatan, dan susun sketsa. Hasilnya bisa disalin ke clipboard atau diekspor jadi PNG dan SVG.',
			usage: [
				'Gambar di kanvas seperti biasa. Perubahan tersimpan otomatis di browser ini.',
				'Ubah nama berkas di atas kanvas, lalu pakai tombol unduh untuk PNG, SVG, atau .excalidraw.',
				'Tombol Salin gambar menyalin PNG ke clipboard, siap ditempel ke dokumen atau chat.',
				'Kanvas memakai tema yang sama dengan situs dan ikut berubah saat tema diganti.',
			],
		},
	},
	diagram: {
		en: {
			name: 'Mermaid Diagrams',
			tagline: 'Write flowcharts, ERDs, or sequence diagrams as text and see the result beside it.',
			usage: [
				'Pick a template, then edit the code. The preview updates with it.',
				'Syntax errors point to the line that needs fixing.',
				'Download PNG or SVG once the diagram is valid.',
				'The visual editor opens diagrams.net inside the page. Use Save & Exit to download a .drawio file.',
			],
		},
		id: {
			name: 'Diagram Mermaid',
			tagline:
				'Tulis flowchart, ERD, atau sequence dalam teks, diagramnya muncul di panel sebelah.',
			usage: [
				'Pilih template di atas editor, lalu ubah kodenya. Pratinjau ikut berubah.',
				'Kalau ada error sintaks, pesannya menunjuk baris yang bermasalah.',
				'Unduh PNG atau SVG setelah diagramnya valid.',
				'Editor Visual membuka diagrams.net di dalam halaman. Tekan Save & Exit di sana untuk mengunduh berkas .drawio.',
			],
		},
	},
	pdf: {
		en: {
			name: 'PDF Tools',
			tagline:
				'Merge, split, compress, convert images to PDF, export pages as images, rotate, or remove pages in your browser.',
			usage: [
				'Pick a tool tab. Files are read in this browser.',
				'Each file shows a first-page thumbnail and page count when ready.',
				'Run the action and download the result.',
			],
		},
		id: {
			name: 'Alat PDF',
			tagline:
				'Gabung, pisah, kompres, ubah gambar jadi PDF, ekspor halaman jadi gambar, putar, atau hapus halaman di browser.',
			usage: [
				'Pilih tab alat. Berkas dibaca di browser ini.',
				'Tiap berkas menampilkan thumbnail halaman pertama dan jumlah halaman setelah siap.',
				'Jalankan aksi lalu unduh hasilnya.',
			],
		},
	},
	'pas-foto': {
		en: {
			name: 'ID Photo',
			tagline:
				'Remove the background, choose a color, set 2×3, 3×4, or 4×6 cm at 300 DPI, then print a 4R or A4 sheet.',
			usage: [
				'Upload a portrait or take one with the camera. The background model is cached in your browser.',
				'Pick a background color and photo size. Adjust zoom, brightness, and edge smoothing.',
				'Download PNG or JPG, or build a print sheet.',
			],
		},
		id: {
			name: 'Pas Foto',
			tagline:
				'Ganti latar pas foto jadi merah, biru, atau putih, haluskan tepi, atur ukuran 2×3 sampai 4×6, lalu susun lembar cetak 4R atau A4.',
			usage: [
				'Pilih foto wajah. Model penghapus latar diunduh sekali, setelah itu tersimpan di browser.',
				'Pilih warna latar dan ukuran cetak. Atur zoom, kecerahan, dan penghalusan tepi sesuai kebutuhan.',
				'Unduh PNG 300 DPI atau JPG, lalu cek ukuran cetaknya sebelum dicetak.',
				'Lembar cetak menyusun beberapa salinan di kertas 4R atau A4. Cetak tanpa penskalaan pada 300 DPI.',
			],
		},
	},
	'kirim-file': {
		en: {
			name: 'Send File',
			tagline:
				'Upload files and get a link that expires in 1 hour, 24 hours, or 7 days. Large files upload in resumable chunks.',
			usage: [
				'Pick files and choose an expiry.',
				'Add a password or one-time download if needed.',
				'Upload and share the link or QR code. Failed chunks resume from the last part.',
			],
		},
		id: {
			name: 'Kirim File',
			tagline:
				'Unggah file, dapat link yang hilang sendiri setelah 1 jam, 24 jam, atau 7 hari. Berkas besar diunggah per bagian dan bisa dilanjutkan.',
			usage: [
				'Pilih berkas, atur masa berlaku, lalu nyalakan kata sandi atau sekali unduh per berkas kalau perlu.',
				'Tekan Unggah dan buat link, lalu salin link atau tunjukkan QR-nya ke penerima.',
				'Berkas dan link dihapus otomatis saat masa berlakunya habis.',
				'Berkas di atas 8 MB diunggah per bagian. Kalau koneksi putus, tekan Ulangi unggahan dan proses lanjut dari bagian terakhir.',
			],
		},
	},
	generator: {
		en: {
			name: 'Text Generator',
			tagline:
				'Write Markdown, build a README, format JSON, convert JSON/CSV/YAML, create .gitignore and LICENSE files.',
			usage: [
				'Pick a tab and fill in the fields.',
				'The preview updates as you type.',
				'Copy or download the result.',
			],
		},
		id: {
			name: 'Generator Teks',
			tagline:
				'Tulis Markdown dengan pratinjau, susun README, rapikan JSON, konversi JSON/CSV/YAML, buat .gitignore, dan hasilkan berkas LICENSE.',
			usage: [
				'Pilih tab lalu isi kolomnya.',
				'Pratinjau diperbarui saat kamu mengetik.',
				'Salin atau unduh hasilnya.',
			],
		},
	},
	utilitas: {
		en: {
			name: 'Text Utilities',
			tagline:
				'Base64, URL encoding, JWT, UUID, timestamps, regex, and diff in one place.',
			usage: ['Pick a tab.', 'Paste text and run the action.', 'Copy the result.'],
		},
		id: {
			name: 'Utilitas Teks',
			tagline:
				'Base64, URL encode, JWT, UUID, timestamp, regex tester, dan diff checker dalam satu tempat.',
			usage: ['Pilih tab.', 'Tempel teks lalu jalankan aksinya.', 'Salin hasilnya.'],
		},
	},
	qr: {
		en: {
			name: 'QR Code',
			tagline: 'Turn text or a URL into a QR code and download it as PNG or SVG.',
			usage: ['Type text or paste a URL.', 'Set size, error correction, and margin.', 'Download the image.'],
		},
		id: {
			name: 'QR Code',
			tagline: 'Ubah teks atau tautan jadi QR code, lalu unduh sebagai PNG atau SVG.',
			usage: ['Tulis teks atau tempel URL.', 'Atur ukuran, koreksi error, dan margin.', 'Unduh gambarnya.'],
		},
	},
	'kompres-gambar': {
		en: {
			name: 'Image Compressor',
			tagline: 'Shrink photos, resize them, and convert to JPG, PNG, or WebP in your browser.',
			usage: ['Pick an image.', 'Choose format, quality, and a size limit.', 'Download the result.'],
		},
		id: {
			name: 'Kompres Gambar',
			tagline:
				'Perkecil ukuran foto, atur dimensi, dan ubah ke JPG, PNG, atau WebP di browser.',
			usage: ['Pilih gambar.', 'Atur format, kualitas, dan batas dimensi.', 'Unduh hasilnya.'],
		},
	},
	warna: {
		en: {
			name: 'Color & Contrast',
			tagline: 'Check text contrast against WCAG AA/AAA and build a color scale from one base color.',
			usage: [
				'Pick text and background colors.',
				'Read the contrast ratio and AA/AAA badges.',
				'Click a swatch to copy its HEX.',
			],
		},
		id: {
			name: 'Warna & Kontras',
			tagline:
				'Cek kontras teks terhadap latar sesuai WCAG AA/AAA, lalu buat palet turunan dari satu warna dasar.',
			usage: [
				'Pilih warna teks dan latar.',
				'Baca rasio kontras dan badge AA/AAA.',
				'Klik swatch untuk menyalin HEX.',
			],
		},
	},
	'mock-data': {
		en: {
			name: 'Mock Data',
			tagline: 'Generate JSON or CSV test data with repeatable seeds.',
			usage: ['Set row count, seed, and fields.', 'Press Generate.', 'Copy or download JSON or CSV.'],
		},
		id: {
			name: 'Data Palsu',
			tagline: 'Hasilkan data uji JSON atau CSV dengan seed yang bisa diulang.',
			usage: ['Atur jumlah baris, seed, dan field.', 'Tekan Buat data.', 'Salin atau unduh JSON atau CSV.'],
		},
	},
	hash: {
		en: {
			name: 'Text & File Hash',
			tagline:
				'Compute SHA-256, SHA-512, SHA-384, or SHA-1 for text and files, then compare against a known hash.',
			usage: ['Pick Text or File.', 'Choose an algorithm.', 'Paste a comparison hash to see if it matches.'],
		},
		id: {
			name: 'Hash Teks & Berkas',
			tagline:
				'Hitung SHA-256, SHA-512, SHA-384, atau SHA-1 dari teks dan berkas, lalu bandingkan dengan hash yang kamu punya.',
			usage: ['Pilih Teks atau Berkas.', 'Pilih algoritme.', 'Tempel hash pembanding untuk melihat cocok atau tidak.'],
		},
	},
	teks: {
		en: {
			name: 'Text Toolkit',
			tagline: 'Change letter case, build slugs and variable names, generate lorem ipsum, and count words.',
			usage: ['Paste text on the left.', 'Pick a transform to fill the result.', 'Copy or download the result.'],
		},
		id: {
			name: 'Toolkit Teks',
			tagline:
				'Ubah huruf besar-kecil, buat slug dan nama variabel, hasilkan lorem ipsum, serta hitung kata dan karakter.',
			usage: ['Tempel teks di kiri.', 'Pilih salah satu tombol ubah.', 'Salin atau unduh hasilnya.'],
		},
	},
	'hapus-exif': {
		en: {
			name: 'Photo Metadata Remover',
			tagline: 'Strip EXIF, GPS, XMP, and comments from JPG or PNG without re-encoding the image.',
			usage: ['Pick a JPG or PNG.', 'Review the size change and removed metadata.', 'Download the cleaned photo.'],
		},
		id: {
			name: 'Hapus Metadata Foto',
			tagline:
				'Buang EXIF, GPS, XMP, dan komentar dari JPG atau PNG sebelum fotonya dibagikan.',
			usage: ['Pilih JPG atau PNG.', 'Periksa perubahan ukuran dan metadata yang dibuang.', 'Unduh foto bersihnya.'],
		},
	},
	cron: {
		en: {
			name: 'Cron Builder',
			tagline:
				'Build a standard 5-field cron expression, preview the next 5 runs in your timezone, and read an explanation.',
			usage: ['Fill in minute, hour, day, month, and weekday.', 'Pick a timezone.', 'Copy the expression once the schedule looks right.'],
		},
		id: {
			name: 'Cron Builder',
			tagline:
				'Susun ekspresi cron 5 field, lihat 5 jadwal berikutnya di zona waktu pilihanmu, dan baca penjelasannya.',
			usage: ['Isi menit, jam, tanggal, bulan, dan hari.', 'Pilih zona waktu.', 'Salin ekspresi setelah jadwalnya cocok.'],
		},
	},
	'code-to-image': {
		en: {
			name: 'Code to Image',
			tagline: 'Turn a code snippet into a highlighted PNG with light or dark themes, padding, and rounded corners.',
			usage: ['Paste code and pick a language.', 'Choose theme, padding, and corner radius.', 'Download the PNG.'],
		},
		id: {
			name: 'Kode ke Gambar',
			tagline:
				'Ubah cuplikan kode jadi PNG dengan highlight, tema terang atau gelap, padding dan sudut yang bisa diatur.',
			usage: ['Tempel kode lalu pilih bahasa.', 'Atur tema, padding, dan sudut.', 'Unduh PNG.'],
		},
	},
	'json-schema': {
		en: {
			name: 'JSON Schema Validator',
			tagline: 'Validate JSON against a schema and read errors per path in plain language.',
			usage: ['Paste the schema and data.', 'Pick a draft and validate.', 'Fix the data using the path and message.'],
		},
		id: {
			name: 'JSON Schema Validator',
			tagline:
				'Validasi JSON terhadap JSON Schema dan baca error per path dalam bahasa Indonesia.',
			usage: ['Tempel schema dan data.', 'Pilih draft lalu validasi.', 'Perbaiki data sesuai path dan pesannya.'],
		},
	},
	prompt: {
		en: {
			name: 'Prompt Library',
			tagline:
				'Search ready-made AI prompts, fill in the blanks, and copy the final result. Everything stays in this browser.',
			usage: [
				'Search or filter by category, AI, and level. The filters are stored in the URL, so you can share them.',
				'Open a prompt, fill the variables, and watch the preview update as you type.',
				'Copy the result or download it as a .md file. Nothing is sent to a server.',
			],
		},
		id: {
			name: 'Bank Prompt',
			tagline:
				'Cari prompt AI siap pakai, isi bagian kosongnya, lalu salin hasil akhirnya. Semua proses di browser ini.',
			usage: [
				'Cari atau saring menurut kategori, AI, dan level. Filternya tersimpan di URL, jadi bisa dibagikan.',
				'Buka satu prompt, isi variabelnya, dan lihat pratinjau berubah saat kamu mengetik.',
				'Salin hasilnya atau unduh sebagai berkas .md. Tidak ada yang dikirim ke server.',
			],
		},
	},
};

export function normalizeLang(value: string | null | undefined): Lang {
	return value === 'en' ? 'en' : 'id';
}

export function readLang(storage: Storage | null = typeof localStorage === 'undefined' ? null : localStorage): Lang {
	try {
		return normalizeLang(storage?.getItem(LANG_KEY));
	} catch {
		return 'id';
	}
}

export function writeLang(lang: Lang, storage: Storage | null = typeof localStorage === 'undefined' ? null : localStorage): void {
	try {
		storage?.setItem(LANG_KEY, lang);
	} catch {
		/* penyimpanan bisa diblokir, bahasa tetap berlaku untuk sesi ini */
	}
}

export function t(lang: Lang, key: string): string {
	return ui[lang][key] ?? ui.id[key] ?? key;
}

export function fill(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (_, key: string) =>
		values[key] === undefined ? `{${key}}` : String(values[key]),
	);
}

export function localizedTool(slug: string, lang: Lang): ToolText | null {
	return toolText[slug]?.[lang] ?? null;
}
