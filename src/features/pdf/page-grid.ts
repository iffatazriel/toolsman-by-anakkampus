import { tr } from '../../lib/i18n';
import dict from './i18n';
import { runPdfTask } from './pdf-client';
import { PAGE_WINDOW } from './page-selection';

interface GridState { selected: Set<number>; rotations: number[]; removed: boolean[] }
interface GridActions {
	toggle?: (page: number) => void;
	rotate?: (index: number, delta: number) => void;
	remove?: (index: number) => void;
}

export class PageGrid {
	private file: File | null = null;
	private fileId = '';
	private count = 0;
	private start = 0;
	private generation = 0;
	private active = 0;
	private queue: HTMLElement[] = [];
	private urls = new Map<number, string>();
	private state: GridState = { selected: new Set(), rotations: [], removed: [] };
	private observer: IntersectionObserver;
	private list: HTMLOListElement;
	private prev: HTMLButtonElement;
	private next: HTMLButtonElement;

	constructor(private host: HTMLElement, private actions: GridActions) {
		this.list = host.querySelector('[data-grid-list]')!;
		this.prev = host.querySelector('[data-grid-prev]')!;
		this.next = host.querySelector('[data-grid-next]')!;
		this.observer = new IntersectionObserver((entries) => {
			for (const entry of entries) if (entry.isIntersecting) {
				this.observer.unobserve(entry.target);
				this.queue.push(entry.target as HTMLElement);
			}
			this.pump();
		}, { rootMargin: '100px 0px' });
		this.prev.addEventListener('click', () => this.navigate(-PAGE_WINDOW));
		this.next.addEventListener('click', () => this.navigate(PAGE_WINDOW));
	}

	setFile(file: File | null, count: number) {
		if (this.file === file && this.count === count) return;
		if (this.fileId) void runPdfTask({ op: 'release-thumbnails', fileId: this.fileId }).promise.catch(() => {});
		this.urls.forEach((url) => URL.revokeObjectURL(url));
		this.urls.clear();
		this.file = file;
		this.fileId = file ? crypto.randomUUID() : '';
		this.count = count;
		this.start = 0;
		this.host.hidden = !file || !count;
		this.render();
	}

	update(state: GridState) {
		this.state = state;
		this.refresh();
	}

	private navigate(delta: number) {
		this.start = Math.max(0, Math.min(this.start + delta, Math.floor((this.count - 1) / PAGE_WINDOW) * PAGE_WINDOW));
		this.render();
		this.refresh();
	}

	private render() {
		this.generation++;
		this.queue = [];
		this.observer.disconnect();
		this.list.replaceChildren();
		if (!this.file) return;
		for (let index = this.start; index < Math.min(this.count, this.start + PAGE_WINDOW); index++) {
			const tile = document.createElement('li');
			tile.className = 'page-tile';
			tile.dataset.page = String(index + 1);
			const frame = document.createElement('span');
			frame.className = 'page-thumb-frame';
			const status = document.createElement('span');
			status.className = 'thumb-status';
			frame.append(status);
			const overlay = document.createElement('span');
			overlay.className = 'page-deleted';
			overlay.hidden = true;
			frame.append(overlay);
			const caption = document.createElement('span');
			caption.className = 'page-caption';
			if (this.actions.toggle) {
				const pick = document.createElement('button');
				pick.type = 'button';
				pick.className = 'page-pick';
				pick.addEventListener('click', () => this.actions.toggle!(index + 1));
				pick.append(frame, caption);
				tile.append(pick);
			} else {
				tile.append(frame, caption);
				const controls = document.createElement('div');
				controls.className = 'page-controls';
				for (const action of ['left', 'right', 'remove'] as const) {
					const button = document.createElement('button');
					button.type = 'button';
					button.className = 'btn btn--secondary';
					button.dataset.pageAction = action;
					button.addEventListener('click', () => action === 'remove' ? this.actions.remove!(index) : this.actions.rotate!(index, action === 'left' ? -90 : 90));
					controls.append(button);
				}
				tile.append(controls);
			}
			const retry = document.createElement('button');
			retry.type = 'button';
			retry.className = 'btn btn--secondary';
			retry.dataset.thumbRetry = '';
			retry.hidden = true;
			retry.addEventListener('click', () => { frame.dataset.state = ''; retry.hidden = true; this.queue.push(frame); this.pump(); });
			tile.append(retry);
			this.list.append(tile);
			const url = this.urls.get(index + 1);
			if (url) this.show(frame, url);
			else this.observer.observe(frame);
		}
		this.refresh();
	}

	private show(frame: HTMLElement, url: string) {
		const image = document.createElement('img');
		image.alt = '';
		image.src = url;
		image.decoding = 'async';
		frame.prepend(image);
		frame.dataset.state = 'ready';
		frame.querySelector<HTMLElement>('.thumb-status')!.hidden = true;
		this.refresh();
	}

	private pump() {
		while (this.active < 2 && this.queue.length && this.file) {
			const frame = this.queue.shift()!;
			if (!frame.isConnected) continue;
			const page = Number(frame.closest<HTMLElement>('[data-page]')!.dataset.page);
			const generation = this.generation;
			this.active++;
			void runPdfTask({ op: 'thumbnail', file: this.file, fileId: this.fileId, page }).promise.then((result) => {
				if (generation !== this.generation || !result.preview) return;
				const url = URL.createObjectURL(new Blob([result.preview.bytes as BlobPart], { type: result.preview.mime }));
				this.urls.set(page, url);
				while (this.urls.size > 36) {
					const first = this.urls.keys().next().value!;
					URL.revokeObjectURL(this.urls.get(first)!);
					this.urls.delete(first);
				}
				this.show(frame, url);
			}).catch(() => {
				if (generation !== this.generation) return;
				frame.dataset.state = 'failed';
				frame.closest('li')!.querySelector<HTMLButtonElement>('[data-thumb-retry]')!.hidden = false;
				this.refresh();
			}).finally(() => { this.active--; this.pump(); });
		}
	}

	private refresh() {
		const kept = this.count - this.state.removed.filter(Boolean).length;
		this.host.querySelector('[data-grid-summary]')!.textContent = tr(dict, this.actions.toggle ? 'selectionCount' : 'summaryEdit', { selected: this.actions.toggle ? this.state.selected.size : kept, pages: this.count });
		this.host.querySelector<HTMLElement>('[data-grid-navigation]')!.hidden = this.count <= PAGE_WINDOW;
		this.prev.textContent = tr(dict, 'previousPages');
		this.next.textContent = tr(dict, 'nextPages');
		this.prev.disabled = this.start === 0;
		this.next.disabled = this.start + PAGE_WINDOW >= this.count;
		this.host.querySelector('[data-grid-window]')!.textContent = tr(dict, 'pageWindow', { from: this.start + 1, to: Math.min(this.count, this.start + PAGE_WINDOW), total: this.count });
		for (const tile of this.list.children as HTMLCollectionOf<HTMLElement>) {
			const page = Number(tile.dataset.page), index = page - 1;
			const removed = this.state.removed[index] ?? false;
			const rotation = this.state.rotations[index] ?? 0;
			tile.dataset.selected = String(this.state.selected.has(page));
			tile.dataset.removed = String(removed);
			const frame = tile.querySelector<HTMLElement>('.page-thumb-frame')!;
			const image = frame.querySelector('img');
			if (image) image.style.transform = `rotate(${rotation}deg)`;
			frame.querySelector('.thumb-status')!.textContent = tr(dict, frame.dataset.state === 'failed' ? 'thumbFailed' : 'thumbLoading');
			const overlay = tile.querySelector<HTMLElement>('.page-deleted')!;
			overlay.hidden = !removed;
			overlay.textContent = tr(dict, 'deletedPage');
			tile.querySelector('.page-caption')!.textContent = tr(dict, 'page', { page }) + (this.actions.toggle ? '' : ` · ${rotation}°`);
			tile.querySelector('[data-thumb-retry]')!.textContent = tr(dict, 'retryThumbnail');
			const pick = tile.querySelector('button.page-pick');
			if (pick) { pick.setAttribute('aria-pressed', String(this.state.selected.has(page))); pick.setAttribute('aria-label', tr(dict, 'togglePage', { page })); }
			for (const button of tile.querySelectorAll<HTMLButtonElement>('[data-page-action]')) {
				const action = button.dataset.pageAction;
				const key = action === 'left' ? 'rotateLeft' : action === 'right' ? 'rotateRight' : removed ? 'restorePage' : 'removePage';
				button.setAttribute('aria-label', tr(dict, key, { page }));
				button.textContent = action === 'left' ? '↶' : action === 'right' ? '↷' : tr(dict, removed ? 'restore' : 'remove');
				button.disabled = action === 'remove' ? !removed && kept <= 1 : removed;
				button.title = action === 'remove' && !removed && kept <= 1 ? tr(dict, 'keepPage') : tr(dict, key, { page });
				if (action === 'remove') button.setAttribute('aria-pressed', String(removed));
			}
		}
	}
}
