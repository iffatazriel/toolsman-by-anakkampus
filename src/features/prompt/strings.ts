import { readLang, type Lang } from '../../lib/i18n';

// Teks khusus Bank Prompt sengaja tidak masuk src/lib/i18n.ts: modul itu ikut
// diunduh beranda, sedangkan modul ini hanya dimuat di halaman prompt.
type Strings = Record<string, string>;

const id: Strings = {
	'search.label': 'Cari prompt',
	'search.placeholder': 'mis. ringkas laporan, debug error, cv',
	'search.hint': 'Cari di judul, tag, dan cuplikan. Huruf besar-kecil dan aksen diabaikan.',
	'filter.category': 'Kategori',
	'filter.all': 'Semua',
	'filter.ai': 'AI',
	'filter.level': 'Level',
	'filter.favorite': 'Favorit',
	'filter.favoriteEmpty': 'Belum ada favorit. Tekan bintang di kartu untuk menyimpan.',
	'count': '{visible} dari {total} prompt',
	'countAll': '{n} prompt',
	'loading': 'Memuat indeks prompt…',
	'loadMore': 'Muat {n} lagi',
	'loadError': 'Indeks prompt gagal dimuat. Coba muat ulang halaman.',
	'empty.title': 'Tidak ada prompt yang cocok',
	'empty.body':
		'Belum ada hasil untuk pencarian atau filter ini. Coba kata yang lebih umum, hapus satu filter, atau pilih salah satu saran di bawah.',
	'empty.reset': 'Hapus semua filter',
	'empty.try': 'Coba:',
	'submit': 'Kirim prompt',
	'submitHint': 'Punya prompt bagus? Ikuti format di panduan kontribusi.',
	'privacy':
		'Semua pencarian dan isian diproses di browser ini. Tidak ada yang dikirim ke server.',
	'card.favorite': 'Simpan {name} ke favorit',
	'card.unfavorite': 'Hapus {name} dari favorit',
	'list.label': 'Daftar prompt',
	'filter.groupCategory': 'Saring menurut kategori',
	'filter.groupAi': 'Saring menurut AI',
	'filter.groupLevel': 'Saring menurut level',
	'filter.favoriteOnly': 'Tampilkan hanya favorit',
	'note.learning':
		'Gunakan untuk belajar, bukan menyalin mentah. Tulis ulang dengan kata-katamu dan sebutkan sumbernya.',
	'detail.variables': 'Isi variabel',
	'detail.variablesHint': 'Kosongkan yang belum kamu tahu. Pratinjau akan menandainya.',
	'detail.preview': 'Pratinjau prompt',
	'detail.copy': 'Salin',
	'detail.copied': 'Prompt tersalin.',
	'detail.copyFailed': 'Gagal menyalin. Blok teks lalu salin manual.',
	'detail.download': 'Unduh .md',
	'detail.missing': '{n} variabel masih kosong.',
	'detail.complete': 'Semua variabel terisi.',
	'detail.license': 'Lisensi',
	'detail.author': 'Penulis',
	'detail.created': 'Dibuat',
	'detail.language': 'Bahasa',
	'detail.level': 'Level',
	'detail.ai': 'Cocok untuk',
	'detail.category': 'Kategori',
	'detail.tags': 'Tag',
	'detail.about': 'Tentang prompt ini',
	'detail.all': 'Semua prompt',
	'detail.favorite': 'Simpan ke favorit',
	'detail.unfavorite': 'Hapus dari favorit',
	'detail.bahasa.id': 'Indonesia',
	'detail.bahasa.en': 'Inggris',
	'copy.aria': 'Salin prompt akhir',
	'download.aria': 'Unduh prompt sebagai berkas Markdown',
};

const en: Strings = {
	'search.label': 'Search prompts',
	'search.placeholder': 'e.g. summarize a report, debug an error, CV',
	'search.hint': 'Searches titles, tags, and snippets. Case and accents are ignored.',
	'filter.category': 'Category',
	'filter.all': 'All',
	'filter.ai': 'AI',
	'filter.level': 'Level',
	'filter.favorite': 'Favorites',
	'filter.favoriteEmpty': 'No favorites yet. Press the star on a card to save one.',
	'count': '{visible} of {total} prompts',
	'countAll': '{n} prompts',
	'loading': 'Loading the prompt index…',
	'loadMore': 'Load {n} more',
	'loadError': 'The prompt index failed to load. Try reloading the page.',
	'empty.title': 'No matching prompts',
	'empty.body':
		'No results for this search or filter. Try a broader word, remove one filter, or pick one of the suggestions below.',
	'empty.reset': 'Clear all filters',
	'empty.try': 'Try:',
	'submit': 'Submit a prompt',
	'submitHint': 'Have a good prompt? Follow the format in the contribution guide.',
	'privacy': 'Search and input stay in this browser. Nothing is sent to a server.',
	'card.favorite': 'Save {name} to favorites',
	'card.unfavorite': 'Remove {name} from favorites',
	'list.label': 'Prompt list',
	'filter.groupCategory': 'Filter by category',
	'filter.groupAi': 'Filter by AI',
	'filter.groupLevel': 'Filter by level',
	'filter.favoriteOnly': 'Show favorites only',
	'note.learning':
		'Use it to learn, not to copy raw. Rewrite it in your own words and cite the source.',
	'detail.variables': 'Fill the variables',
	'detail.variablesHint': 'Leave anything you do not know yet. The preview will mark it.',
	'detail.preview': 'Prompt preview',
	'detail.copy': 'Copy',
	'detail.copied': 'Prompt copied.',
	'detail.copyFailed': 'Copy failed. Select the text and copy it manually.',
	'detail.download': 'Download .md',
	'detail.missing': '{n} variables are still empty.',
	'detail.complete': 'All variables are filled.',
	'detail.license': 'License',
	'detail.author': 'Author',
	'detail.created': 'Created',
	'detail.language': 'Language',
	'detail.level': 'Level',
	'detail.ai': 'Works with',
	'detail.category': 'Category',
	'detail.tags': 'Tags',
	'detail.about': 'About this prompt',
	'detail.all': 'All prompts',
	'detail.favorite': 'Save to favorites',
	'detail.unfavorite': 'Remove from favorites',
	'detail.bahasa.id': 'Indonesian',
	'detail.bahasa.en': 'English',
	'copy.aria': 'Copy the final prompt',
	'download.aria': 'Download the prompt as a Markdown file',
};

export const promptStrings: Record<Lang, Strings> = { id, en };

export function promptText(lang: Lang, key: string): string {
	return promptStrings[lang][key] ?? promptStrings.id[key] ?? key;
}

export function fillPromptText(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
		name in values ? String(values[name]) : whole,
	);
}

/** Menerapkan teks ke elemen [data-p], [data-p-placeholder], dan [data-p-aria]. */
export function applyPromptStrings(lang: Lang): void {
	document.querySelectorAll<HTMLElement>('[data-p]').forEach((element) => {
		const key = element.dataset.p ?? '';
		const text = promptStrings[lang][key];
		if (text !== undefined) element.textContent = text;
	});
	document.querySelectorAll<HTMLElement>('[data-p-placeholder]').forEach((element) => {
		const key = element.dataset.pPlaceholder ?? '';
		const text = promptStrings[lang][key];
		if (text !== undefined) (element as HTMLInputElement).placeholder = text;
	});
	document.querySelectorAll<HTMLElement>('[data-p-aria]').forEach((element) => {
		const key = element.dataset.pAria ?? '';
		const text = promptStrings[lang][key];
		if (text !== undefined) element.setAttribute('aria-label', text);
	});
}

/** Dipanggil dari skrip halaman prompt; ikut berubah saat toggle bahasa ditekan. */
export function initPromptStrings(): void {
	applyPromptStrings(readLang());
	document.addEventListener('lang:change', () => applyPromptStrings(readLang()));
}
