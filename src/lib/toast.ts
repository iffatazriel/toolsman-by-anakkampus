type ToastOptions = {
	action?: { label: string; onClick: () => void };
	duration?: number;
};

export function toast(message: string, options: ToastOptions = {}): void {
	const region = document.querySelector<HTMLElement>('[data-toast-region]');
	if (!region) return;

	const node = document.createElement('div');
	node.className = 'toast';

	const text = document.createElement('span');
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
