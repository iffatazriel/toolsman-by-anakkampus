type ToastTone = 'neutral' | 'success' | 'error';

type ToastOptions = {
	action?: { label: string; onClick: () => void };
	duration?: number;
	tone?: ToastTone;
};

const iconPaths: Record<ToastTone, string> = {
	neutral: '<path d="M12 8v5M12 16h.01"/>',
	success: '<path d="m5 12 5 5L20 7"/>',
	error: '<path d="M18 6 6 18M6 6l12 12"/>',
};

export function toast(message: string, options: ToastOptions = {}): void {
	const region = document.querySelector<HTMLElement>('[data-toast-region]');
	if (!region) return;

	const tone = options.tone ?? 'neutral';
	const node = document.createElement('div');
	node.className = 'toast';
	node.dataset.tone = tone;

	const icon = document.createElement('span');
	icon.className = 'toast__icon';
	icon.setAttribute('aria-hidden', 'true');
	icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${iconPaths[tone]}</svg>`;
	node.append(icon);

	const text = document.createElement('span');
	text.className = 'toast__text';
	text.textContent = message;
	node.append(text);

	if (options.action) {
		const action = document.createElement('button');
		action.type = 'button';
		action.className = 'toast__action';
		action.textContent = options.action.label;
		action.addEventListener('click', () => {
			options.action?.onClick();
			node.remove();
		});
		node.append(action);
	}

	const close = document.createElement('button');
	close.type = 'button';
	close.className = 'icon-button';
	close.setAttribute('aria-label', 'Tutup notifikasi');
	close.innerHTML =
		'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
	close.addEventListener('click', () => node.remove());
	node.append(close);

	region.append(node);

	window.setTimeout(() => node.remove(), options.duration ?? 4000);
}
