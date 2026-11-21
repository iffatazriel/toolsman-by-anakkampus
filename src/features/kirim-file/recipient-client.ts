import { tr, currentLang, WorkspaceError, workspaceErrorMessage } from '../../lib/i18n';
import { localizedText } from '../../lib/i18n-client';
import { apiErrorKey } from './client-errors';
import { formatRemaining } from './format';
import dict from './i18n';

const page = document.querySelector<HTMLElement>('[data-share-id]');
const shareId = page?.dataset.shareId ?? '';
const dialog = document.getElementById('report-modal') as HTMLDialogElement | null;
const form = document.querySelector<HTMLFormElement>('[data-report-form]');
const status = document.querySelector<HTMLElement>('[data-report-status]');
localizedText(document.querySelector('title'), () => tr(dict, page?.dataset.available === 'true' ? 'recipientTitle' : 'unavailableTitle'));

document.querySelector('[data-report-open]')?.addEventListener('click', () => dialog?.showModal());
document.querySelector('[data-report-close]')?.addEventListener('click', () => dialog?.close());

form?.addEventListener('submit', async (event) => {
	event.preventDefault();
	if (!status || !shareId) return;
	localizedText(status, () => tr(dict, 'reportSending'));
	try {
		const reason = (document.getElementById('report-reason') as HTMLTextAreaElement).value;
		const response = await fetch(`/api/shares/${shareId}/report`, {
			method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }),
		});
		if (!response.ok) throw new WorkspaceError(dict, apiErrorKey(response.status), { status: response.status });
		localizedText(status, () => tr(dict, 'reportSent'));
		form.reset();
	} catch (error) {
		localizedText(status, () => workspaceErrorMessage(error, tr(dict, 'reportFailed')));
	}
});

document.querySelectorAll<HTMLFormElement>('[data-download-form]').forEach((downloadForm) => {
	downloadForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		const button = downloadForm.querySelector<HTMLButtonElement>('button')!;
		const note = document.querySelector<HTMLElement>('[data-download-status]');
		button.disabled = true;
		localizedText(note, () => tr(dict, 'downloading'));
		try {
			const response = await fetch(downloadForm.action, { method: 'POST', body: new FormData(downloadForm) });
			if (!response.ok) throw new WorkspaceError(dict, apiErrorKey(response.status, 'download'), { status: response.status });
			const url = URL.createObjectURL(await response.blob());
			const link = document.createElement('a');
			link.href = url;
			link.download = downloadForm.dataset.fileName ?? 'download';
			link.click();
			window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
			localizedText(note, () => tr(dict, 'downloadStarted'));
		} catch (error) {
			localizedText(note, () => workspaceErrorMessage(error, tr(dict, 'downloadFailed')));
		} finally {
			button.disabled = false;
		}
	});
});

document.querySelectorAll<HTMLElement>('[data-download-remaining]').forEach((node) => {
	const count = Number(node.dataset.downloadRemaining);
	localizedText(node, () => ` · ${tr(dict, count > 0 ? 'remainingDownloads' : 'downloaded', { count })}`);
});
document.querySelectorAll<HTMLElement>('[data-download-limit]').forEach((node) => {
	localizedText(node, () => tr(dict, 'limitDownloads', { count: node.dataset.downloadLimit ?? '' }));
});
const tick = () => localizedText(document.querySelector<HTMLElement>('[data-countdown]'), () => `${formatRemaining(Number(page?.dataset.expiresAt) - Date.now(), currentLang())}.`);
tick();
const timer = window.setInterval(tick, 30_000);
window.addEventListener('pagehide', () => window.clearInterval(timer), { once: true });
