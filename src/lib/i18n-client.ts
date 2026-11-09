import {
	categoryText,
	fill,
	localizedTool,
	normalizeLang,
	readLang,
	t,
	writeLang,
	type Lang,
} from './i18n';

function categoryName(lang: Lang, id: string): string {
	return (categoryText[lang] as Record<string, string>)[id] ?? id;
}

function translateElement(element: HTMLElement, lang: Lang, total: number): void {
	const key = element.dataset.i18n;
	if (!key) return;

	const values: Record<string, string | number> = {
		year: element.dataset.year ?? String(new Date().getFullYear()),
		n: element.dataset.countValue ?? total,
		name: element.dataset.nameValue ?? '',
		query: document.querySelector<HTMLElement>('[data-empty-query]')?.textContent ?? '',
		visible: element.dataset.visible ?? total,
		total,
	};

	element.textContent = fill(t(lang, key), values);
}

export function applyLanguage(lang: Lang): void {
	document.documentElement.lang = lang;
	const total = document.querySelectorAll('[data-tool-grid] [data-tool]').length;

	document.querySelectorAll<HTMLElement>('[data-tool-meta]').forEach((container) => {
		const slug = container.dataset.toolMeta ?? '';
		const text = localizedTool(slug, lang);
		if (!text) return;

		container.querySelectorAll<HTMLElement>('[data-tool-name]').forEach((title) => {
			title.textContent = text.name;
		});

		const tagline = container.querySelector<HTMLElement>('[data-tool-tagline]');
		if (tagline) tagline.textContent = text.tagline;

		container.querySelectorAll<HTMLElement>('[data-tool-usage-index]').forEach((item) => {
			const index = Number(item.dataset.toolUsageIndex);
			const value = text.usage[index];
			if (value) item.textContent = value;
		});

		const notReady = container.querySelector<HTMLElement>('[data-i18n="tool.notReadyBody"]');
		if (notReady) notReady.dataset.nameValue = text.name;
		const plansHint = container.querySelector<HTMLElement>('[data-i18n="tool.plansHint"]');
		if (plansHint) plansHint.dataset.nameValue = text.name;
	});

	document.querySelectorAll<HTMLElement>('[data-tool-card]').forEach((card) => {
		const slug = card.dataset.toolCard ?? '';
		const text = localizedTool(slug, lang);
		if (!text) return;

		const name = card.querySelector<HTMLElement>('.tool-card__name');
		if (name) name.textContent = text.name;
		const desc = card.querySelector<HTMLElement>('.tool-card__desc');
		if (desc) desc.textContent = text.tagline;

		const item = card.closest<HTMLElement>('[data-tool]');
		if (item) item.dataset.name = text.name;
	});

	document.querySelectorAll<HTMLElement>('[data-palette-slug]').forEach((item) => {
		const slug = item.dataset.paletteSlug ?? '';
		const text = localizedTool(slug, lang);
		const name = item.querySelector<HTMLElement>('.palette__name');
		if (name && text) name.textContent = text.name;

		const cat = item.querySelector<HTMLElement>('.palette__cat');
		if (cat && item.dataset.category) cat.textContent = categoryName(lang, item.dataset.category);
		// Judul kelompok palet dibaca ulang CommandPalette saat bahasa berganti.
		if (item.dataset.category) item.dataset.paletteCat = categoryName(lang, item.dataset.category);

		const base = item.dataset.baseSearch ?? item.dataset.search ?? '';
		item.dataset.baseSearch = base;
		if (text) item.dataset.search = `${base} ${text.name} ${text.tagline}`;
	});

	document.querySelectorAll<HTMLElement>('[data-category-label]').forEach((element) => {
		element.textContent = categoryName(lang, element.dataset.categoryLabel ?? '');
	});

	document.querySelectorAll<HTMLElement>('[data-footer-slug]').forEach((element) => {
		const text = localizedTool(element.dataset.footerSlug ?? '', lang);
		if (text) element.textContent = text.name;
	});

	document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((element) => {
		const value = element.dataset.filter ?? '';
		const label = element.querySelector<HTMLElement>('[data-filter-label]');
		const text = value === 'semua' ? t(lang, 'catalog.all') : categoryName(lang, value);
		if (label) label.textContent = text;
		else element.textContent = text;
	});

	document.querySelectorAll<HTMLElement>('[data-status-label]').forEach((element) => {
		element.textContent =
			element.dataset.statusLabel === 'siap' ? t(lang, 'tool.ready') : t(lang, 'tool.notReadyStatus');
	});

	document.querySelectorAll<HTMLElement>('[data-privacy-label]').forEach((element) => {
		element.textContent =
			element.dataset.privacyLabel === 'server' ? t(lang, 'privacy.server') : t(lang, 'privacy.lokal');
	});

	document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
		translateElement(element, lang, total);
	});

	document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((element) => {
		const key = element.dataset.i18nPlaceholder;
		if (key) (element as HTMLInputElement).placeholder = t(lang, key);
	});

	document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((element) => {
		const key = element.dataset.i18nAria;
		if (key) element.setAttribute('aria-label', t(lang, key));
	});

	document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((element) => {
		const key = element.dataset.i18nTitle;
		if (key) element.setAttribute('title', t(lang, key));
	});

	document.querySelectorAll<HTMLElement>('[data-lang-toggle]').forEach((element) => {
		element.textContent = lang.toUpperCase();
		element.setAttribute('aria-label', t(lang, 'lang.label'));
		element.setAttribute('title', t(lang, 'lang.label'));
	});

	document.dispatchEvent(new CustomEvent('lang:change', { detail: { lang } }));
}

export function initLanguage(): void {
	const initial = readLang();
	applyLanguage(initial);

	document.querySelectorAll<HTMLElement>('[data-lang-toggle]').forEach((button) => {
		button.addEventListener('click', () => {
			const current = normalizeLang(document.documentElement.lang);
			const next: Lang = current === 'en' ? 'id' : 'en';
			writeLang(next);
			applyLanguage(next);
		});
	});
}
