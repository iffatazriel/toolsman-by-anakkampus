import { PROMPT_FAVORITES_KEY, readKeyedList, toggleKeyedItem } from '../../lib/favorites';
import { readLang, type Lang } from '../../lib/i18n';
import type { PromptIndexItem } from '../../lib/prompt-schema';
import { promptAiLabel, promptCategoryLabel, promptLevelLabel } from '../../lib/prompt-taxonomy';
import { matches } from '../../lib/search';
import { fillPromptText, promptText } from './strings';

const PAGE_SIZE = 12;

const STAR =
	'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z"/></svg>';

interface State {
	query: string;
	kategori: string;
	ai: string;
	level: string;
	favoritesOnly: boolean;
	shown: number;
}

function makeCard(item: PromptIndexItem, lang: Lang, favorites: string[]): HTMLLIElement {
	const saved = favorites.includes(item.id);
	const card = document.createElement('li');
	card.className = 'prompt-card';
	card.dataset.promptId = item.id;

	const link = document.createElement('a');
	link.className = 'prompt-card__link';
	link.href = `/tools/prompt/${item.id}/`;

	const top = document.createElement('span');
	top.className = 'prompt-card__top';
	const category = document.createElement('span');
	category.className = 'prompt-card__cat';
	category.textContent = promptCategoryLabel(item.kategori, lang);
	const level = document.createElement('span');
	level.className = 'badge';
	level.textContent = promptLevelLabel(item.level, lang);
	top.append(category, level);

	const title = document.createElement('span');
	title.className = 'prompt-card__title';
	title.textContent = item.judul;

	const desc = document.createElement('span');
	desc.className = 'prompt-card__desc';
	desc.textContent = item.cuplikan;

	const meta = document.createElement('span');
	meta.className = 'prompt-card__meta';
	const ai = item.ai.map((id) => promptAiLabel(id, lang)).join(' · ');
	meta.textContent = `${item.tag.join(' · ')} — ${ai}`;

	link.append(top, title, desc, meta);

	const favorite = document.createElement('button');
	favorite.type = 'button';
	favorite.className = 'prompt-card__fav';
	favorite.dataset.promptFav = item.id;
	favorite.setAttribute('aria-pressed', saved ? 'true' : 'false');
	favorite.setAttribute(
		'aria-label',
		fillPromptText(promptText(lang, saved ? 'card.unfavorite' : 'card.favorite'), {
			name: item.judul,
		}),
	);
	favorite.innerHTML = STAR;

	card.append(link, favorite);
	return card;
}

/** Memasang pencarian, filter, dan daftar bertahap di halaman /tools/prompt/. */
export function initPromptList(root: HTMLElement): void {
	const search = root.querySelector<HTMLInputElement>('[data-prompt-search]');
	const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-prompt-kategori]'));
	const aiSelect = root.querySelector<HTMLSelectElement>('[data-prompt-ai]');
	const levelSelect = root.querySelector<HTMLSelectElement>('[data-prompt-level]');
	const favoriteChip = root.querySelector<HTMLButtonElement>('[data-prompt-favorites]');
	const results = root.querySelector<HTMLUListElement>('[data-prompt-results]');
	const count = root.querySelector<HTMLElement>('[data-prompt-count]');
	const loading = root.querySelector<HTMLElement>('[data-prompt-loading]');
	const error = root.querySelector<HTMLElement>('[data-prompt-error]');
	const empty = root.querySelector<HTMLElement>('[data-prompt-empty]');
	const emptyBody = root.querySelector<HTMLElement>('[data-prompt-empty-body]');
	const reset = root.querySelector<HTMLButtonElement>('[data-prompt-reset]');
	const more = root.querySelector<HTMLButtonElement>('[data-prompt-more]');
	const suggestions = root.querySelectorAll<HTMLButtonElement>('[data-prompt-suggestion]');

	if (
		!search ||
		!aiSelect ||
		!levelSelect ||
		!favoriteChip ||
		!results ||
		!count ||
		!loading ||
		!error ||
		!empty ||
		!more
	) {
		return;
	}

	let items: PromptIndexItem[] = [];
	let favorites = readKeyedList(PROMPT_FAVORITES_KEY, localStorage);
	let visible: PromptIndexItem[] = [];
	let loaded = false;
	const state: State = {
		query: '',
		kategori: 'semua',
		ai: 'semua',
		level: 'semua',
		favoritesOnly: false,
		shown: PAGE_SIZE,
	};

	const valid = (value: string | null, allowed: string[]): boolean =>
		value !== null && allowed.includes(value);

	const categoryIds = chips.map((chip) => chip.dataset.promptKategori ?? '').filter(Boolean);
	const aiIds = Array.from(aiSelect.options).map((option) => option.value);
	const levelIds = Array.from(levelSelect.options).map((option) => option.value);

	const readUrl = (): void => {
		const params = new URLSearchParams(location.search);
		const kategori = params.get('kategori');
		const ai = params.get('ai');
		const level = params.get('level');
		state.query = (params.get('q') ?? '').trim();
		state.kategori = valid(kategori, categoryIds) ? (kategori as string) : 'semua';
		state.ai = valid(ai, aiIds) ? (ai as string) : 'semua';
		state.level = valid(level, levelIds) ? (level as string) : 'semua';
		state.favoritesOnly = params.get('favorit') === '1';
		search.value = state.query;
		aiSelect.value = state.ai;
		levelSelect.value = state.level;
	};

	const writeUrl = (): void => {
		const params = new URLSearchParams();
		if (state.query !== '') params.set('q', state.query);
		if (state.kategori !== 'semua') params.set('kategori', state.kategori);
		if (state.ai !== 'semua') params.set('ai', state.ai);
		if (state.level !== 'semua') params.set('level', state.level);
		if (state.favoritesOnly) params.set('favorit', '1');
		const query = params.toString();
		history.replaceState(null, '', query === '' ? location.pathname : `${location.pathname}?${query}`);
	};

	const syncControls = (): void => {
		chips.forEach((chip) => {
			chip.setAttribute(
				'aria-pressed',
				chip.dataset.promptKategori === state.kategori ? 'true' : 'false',
			);
		});
		favoriteChip.setAttribute('aria-pressed', state.favoritesOnly ? 'true' : 'false');
	};

	const paint = (): void => {
		const lang = readLang();
		const shownItems = visible.slice(0, state.shown);
		results.replaceChildren(...shownItems.map((item) => makeCard(item, lang, favorites)));

		count.textContent = !loaded
			? ''
			: state.query === '' &&
				  state.kategori === 'semua' &&
				  state.ai === 'semua' &&
				  state.level === 'semua' &&
				  !state.favoritesOnly
				? fillPromptText(promptText(lang, 'countAll'), { n: visible.length })
				: fillPromptText(promptText(lang, 'count'), {
						visible: visible.length,
						total: items.length,
					});

		const remaining = visible.length - shownItems.length;
		more.hidden = !loaded || remaining <= 0;
		more.textContent = fillPromptText(promptText(lang, 'loadMore'), {
			n: Math.min(PAGE_SIZE, Math.max(remaining, 0)),
		});
		root.dataset.shown = String(shownItems.length);

		const emptyNow = loaded && visible.length === 0;
		empty.hidden = !emptyNow;
		results.hidden = emptyNow;
		if (emptyNow && emptyBody) {
			emptyBody.textContent =
				state.favoritesOnly && favorites.length === 0
					? promptText(lang, 'filter.favoriteEmpty')
					: promptText(lang, 'empty.body');
		}
	};

	const apply = (resetPage = true): void => {
		if (resetPage) state.shown = PAGE_SIZE;
		visible = items.filter((item) => {
			if (state.kategori !== 'semua' && item.kategori !== state.kategori) return false;
			if (state.ai !== 'semua' && !item.ai.includes(state.ai)) return false;
			if (state.level !== 'semua' && item.level !== state.level) return false;
			if (state.favoritesOnly && !favorites.includes(item.id)) return false;
			return matches([item.judul, item.kategori, item.cuplikan, ...item.tag, ...item.ai], state.query);
		});
		syncControls();
		writeUrl();
		paint();
	};

	readUrl();
	syncControls();
	apply(false);

	search.addEventListener('input', () => {
		state.query = search.value.trim();
		apply();
	});

	chips.forEach((chip) => {
		chip.addEventListener('click', () => {
			state.kategori = chip.dataset.promptKategori ?? 'semua';
			apply();
		});
	});

	aiSelect.addEventListener('change', () => {
		state.ai = aiSelect.value;
		apply();
	});

	levelSelect.addEventListener('change', () => {
		state.level = levelSelect.value;
		apply();
	});

	favoriteChip.addEventListener('click', () => {
		state.favoritesOnly = !state.favoritesOnly;
		apply();
	});

	more.addEventListener('click', () => {
		state.shown += PAGE_SIZE;
		paint();
	});

	reset?.addEventListener('click', () => {
		state.query = '';
		state.kategori = 'semua';
		state.ai = 'semua';
		state.level = 'semua';
		state.favoritesOnly = false;
		search.value = '';
		aiSelect.value = 'semua';
		levelSelect.value = 'semua';
		apply();
	});

	suggestions.forEach((button) => {
		button.addEventListener('click', () => {
			state.query = button.dataset.promptSuggestion ?? '';
			search.value = state.query;
			apply();
			search.focus();
		});
	});

	results.addEventListener('click', (event) => {
		const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-prompt-fav]');
		if (!button) return;
		const id = button.dataset.promptFav ?? '';
		if (id === '') return;
		const saved = toggleKeyedItem(PROMPT_FAVORITES_KEY, localStorage, id);
		favorites = readKeyedList(PROMPT_FAVORITES_KEY, localStorage);
		button.setAttribute('aria-pressed', saved ? 'true' : 'false');
		const item = items.find((entry) => entry.id === id);
		if (item) {
			button.setAttribute(
				'aria-label',
				fillPromptText(promptText(readLang(), saved ? 'card.unfavorite' : 'card.favorite'), {
					name: item.judul,
				}),
			);
		}
		if (state.favoritesOnly) apply(false);
	});

	document.addEventListener('lang:change', () => {
		paint();
		apply(false);
	});

	fetch('/prompts/index.json', { headers: { Accept: 'application/json' } })
		.then((response) => {
			if (!response.ok) throw new Error(String(response.status));
			return response.json() as Promise<PromptIndexItem[]>;
		})
		.then((data) => {
			items = data;
			loaded = true;
			loading.hidden = true;
			apply(false);
		})
		.catch(() => {
			loading.hidden = true;
			error.hidden = false;
		});
}
