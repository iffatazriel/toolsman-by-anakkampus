import {
	categoryText,
	fill,
	localizedTool,
	normalizeLang,
	currentLang,
	setCurrentLang,
	registerWorkspaceDictionary,
	readLang,
	t,
	writeLang,
	type Lang,
	type WorkspaceDictionary,
} from './i18n';
import { promptAiLabel, promptCategoryLabel, promptLevelLabel } from './prompt-taxonomy';
import { translateShellCopy } from './shell-copy';

const workspaceLoaders = import.meta.glob<{ default: WorkspaceDictionary }>('../features/*/i18n.ts');
const liveText = new WeakMap<HTMLElement, () => string>();
const liveValue = new WeakMap<HTMLInputElement | HTMLTextAreaElement, () => string>();

export function localizedValue(element: HTMLInputElement | HTMLTextAreaElement, render: () => string): void {
	const value = render();
	liveValue.set(element, render);
	element.dataset.i18nValue = '';
	element.value = value;
}

export function localizedText(element: HTMLElement | null, render: () => string): void {
	if (!element) return;
	liveText.set(element, render);
	element.dataset.i18nLive = '';
	element.textContent = render();
}

async function loadWorkspaceDictionaries(): Promise<void> {
	const slugs = new Set<string>();
	document.querySelectorAll<HTMLElement>('[data-i18n], [data-i18n-placeholder], [data-i18n-aria], [data-i18n-title], [data-i18n-alt]').forEach((element) => {
		for (const value of [element.dataset.i18n, element.dataset.i18nPlaceholder, element.dataset.i18nAria, element.dataset.i18nTitle, element.dataset.i18nAlt]) {
			const slug = value?.match(/^workspace\.([^.]+)\./)?.[1];
			if (slug) slugs.add(slug);
		}
	});
	await Promise.all([...slugs].map(async (slug) => {
		const load = workspaceLoaders[`../features/${slug}/i18n.ts`];
		if (load) registerWorkspaceDictionary(slug, (await load()).default);
	}));
}

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

	const translated = t(lang, key);
	if (translated !== key) element.textContent = fill(translated, values);
}

export function applyLanguage(lang: Lang): void {
	setCurrentLang(lang);
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
		const usage = container.querySelector<HTMLElement>('[data-tool-usage]');
		if (usage) {
			usage.replaceChildren(...text.usage.map((step, index) => {
				const item = document.createElement('li');
				const number = document.createElement('span'); number.textContent = `${index + 1}.`;
				const body = document.createElement('span'); body.textContent = step;
				item.append(number, body);
				return item;
			}));
		}

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
	document.querySelectorAll<HTMLElement>('[data-prompt-category-label]').forEach(element => {
		element.textContent = promptCategoryLabel(element.dataset.promptCategoryLabel ?? '', lang);
	});
	document.querySelectorAll<HTMLOptionElement>('[data-prompt-ai] option:not([value="semua"])').forEach(option => {
		option.textContent = promptAiLabel(option.value, lang);
	});
	document.querySelectorAll<HTMLOptionElement>('[data-prompt-level] option:not([value="semua"])').forEach(option => {
		option.textContent = promptLevelLabel(option.value, lang);
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
		if (key && t(lang, key) !== key) (element as HTMLInputElement).placeholder = t(lang, key);
	});

	document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((element) => {
		const key = element.dataset.i18nAria;
		if (key && t(lang, key) !== key) element.setAttribute('aria-label', t(lang, key));
	});

	document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((element) => {
		const key = element.dataset.i18nTitle;
		if (key && t(lang, key) !== key) element.setAttribute('title', t(lang, key));
	});
	document.querySelectorAll<HTMLElement>('[data-i18n-alt]').forEach((element) => {
		const key = element.dataset.i18nAlt;
		if (key && t(lang, key) !== key) element.setAttribute('alt', t(lang, key));
	});

	document.querySelectorAll<HTMLElement>('[data-lang-toggle]').forEach((element) => {
		element.textContent = lang.toUpperCase();
		element.setAttribute('aria-label', t(lang, 'lang.label'));
		element.setAttribute('title', t(lang, 'lang.label'));
	});
	document.querySelectorAll<HTMLElement>('[data-i18n-live]').forEach((element) => {
		const render = liveText.get(element);
		if (render) element.textContent = render();
	});

	document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-value]').forEach((element) => {
		const render = liveValue.get(element);
		if (render) element.value = render();
	});
	translateShellCopy(lang);
	document.dispatchEvent(new CustomEvent('lang:change', { detail: { lang } }));
}

export function initLanguage(): void {
	const initial = readLang();
	applyLanguage(initial);
	void loadWorkspaceDictionaries().then(() => applyLanguage(currentLang()));

	document.querySelectorAll<HTMLElement>('[data-lang-toggle]').forEach((button) => {
		button.addEventListener('click', () => {
			const current = normalizeLang(document.documentElement.lang);
			const next: Lang = current === 'en' ? 'id' : 'en';
			writeLang(next);
			applyLanguage(next);
		});
	});
}
