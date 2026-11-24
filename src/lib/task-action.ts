import { currentLang, localizedTool, t } from './i18n';

export function taskActionState(label: string, disabled: boolean, status: string, fallback: string) {
	return { label: label.trim(), disabled, status: status.trim() || fallback };
}

/** Opt in with data-task-action on an existing button; optionally mark its live status. */
export function mountTaskAction(root: HTMLElement, bar: HTMLElement, slug: string): void {
	const proxy = bar.querySelector<HTMLButtonElement>('[data-task-proxy]')!;
	const caption = bar.querySelector<HTMLElement>('[data-task-caption]')!;
	let target: HTMLButtonElement | null = null;
	const visible = (element: HTMLElement) => !element.closest('[hidden]') && getComputedStyle(element).display !== 'none';
	const sync = () => {
		const actions = [...root.querySelectorAll<HTMLButtonElement>('[data-task-action]')]
			.filter(element => !element.closest('[data-panel][hidden]'));
		target = actions.find(visible) ?? actions[0] ?? null;
		bar.toggleAttribute('data-task-bar', target !== null);
		proxy.hidden = !target;
		bar.querySelector<HTMLElement>('[data-copy-page]')!.hidden = target !== null;
		const name = localizedTool(slug, currentLang())?.name ?? slug;
		if (!target) { caption.textContent = name; return; }
		const status = [...root.querySelectorAll<HTMLElement>('[role="alert"]'), ...root.querySelectorAll<HTMLElement>('[data-task-status]'), ...root.querySelectorAll<HTMLElement>('[role="status"]')]
			.filter(visible).map(element => element.textContent?.trim() ?? '').find(Boolean) ?? '';
		const state = taskActionState(target.textContent ?? '', target.disabled, status, t(currentLang(), target.disabled ? 'tool.actionWaiting' : 'tool.actionReady'));
		proxy.textContent = state.label;
		proxy.disabled = state.disabled;
		proxy.setAttribute('aria-busy', target.getAttribute('aria-busy') ?? 'false');
		if (caption.textContent !== state.status) caption.textContent = state.status;
		caption.title = state.status;
	};
	proxy.addEventListener('click', () => { if (target && !target.disabled) target.click(); });
	new MutationObserver(sync).observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'disabled', 'aria-busy', 'class', 'style'] });
	document.addEventListener('lang:change', sync);
	new ResizeObserver(() => {
		document.body.style.setProperty('--tool-bar-height', `${bar.offsetHeight}px`);
	}).observe(bar);
	sync();
}
