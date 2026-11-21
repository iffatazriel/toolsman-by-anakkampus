import { currentLang, tr, workspaceErrorMessage, WorkspaceError } from '../../lib/i18n';
import { localizedText } from '../../lib/i18n-client';
import dict from './i18n';
import { copyText } from '../../lib/clipboard';
import { toast } from '../../lib/toast';
import { formatBytes, formatRemaining } from './format';
import { MANAGE_TOKEN_PATTERN } from './manage-token';
import { managementChanges, type ManageSnapshot } from './manage-view';
import { qrDataUrl } from './qr';

const root = document.querySelector<HTMLElement>('[data-manage-id]')!;
const id = root.dataset.manageId ?? '';
const token = new URLSearchParams(location.hash.slice(1)).get('t') ?? '';
const node = (name: string) => document.getElementById(`manage-${name}`)!;
const errorNode = node('error');
const message = node('message');
localizedText(message, () => tr(dict, 'manageLoading'));
const deleteButton = node('delete') as HTMLButtonElement;
const confirmButton = node('confirm-delete') as HTMLButtonElement;
const dialog = node('confirm') as HTMLDialogElement;
const notifyButton = node('notify') as HTMLButtonElement;
let previous: ManageSnapshot | null = null;
let optedIn = false, stopped = false, suspended = false, busy = false;
let pollTimer: ReturnType<typeof setTimeout>;
let controller: AbortController | null = null;

function announce(text: () => string) {
	if (optedIn && 'Notification' in window && Notification.permission === 'granted') {
		try { new Notification(tr(dict, 'toolName'), { body: text() }); return; } catch { /* gunakan toast */ }
	}
	toast(text);
}

function countdown() {
	const snapshot = previous;
	if (snapshot) localizedText(node('countdown'), () => snapshot.expiresAt <= Date.now() ? tr(dict, 'expired') : formatRemaining(snapshot.expiresAt - Date.now(), currentLang()));
}

function show(snapshot: ManageSnapshot) {
	const before = previous;
	managementChanges(before, snapshot).forEach((_, index) => announce(() => managementChanges(before, snapshot, currentLang())[index] ?? ''));
	previous = snapshot;
	node('details').hidden = false; node('share').hidden = false;
	localizedText(node('state'), () => (snapshot.status === 'deleted' ? tr(dict, 'deleted') : snapshot.status === 'uploading' ? tr(dict, 'uploading') : snapshot.available ? tr(dict, 'available') : tr(dict, 'unavailable')));
	localizedText(node('created'), () => new Date(snapshot.createdAt).toLocaleString(currentLang() === 'en' ? 'en-US' : 'id-ID'));
	localizedText(node('expires'), () => new Date(snapshot.expiresAt).toLocaleString(currentLang() === 'en' ? 'en-US' : 'id-ID'));
	localizedText(node('flags'), () => (`${snapshot.protected ? tr(dict, 'protected') : tr(dict, 'unprotected')} · ${snapshot.oneTime ? tr(dict, 'once') : tr(dict, 'repeated')}`));
	localizedText(node('downloads'), () => (String(snapshot.downloads)));
	node('pending').hidden = !snapshot.pendingCleanup;
	deleteButton.disabled = snapshot.status === 'deleted' || busy;
	const files = node('files'); files.replaceChildren();
	for (const file of snapshot.files) {
		const item = document.createElement('li'); localizedText(item, () => tr(dict, 'fileStatus', { name: file.name, size: formatBytes(file.size), downloads: file.downloads, purged: file.purged ? tr(dict, 'purged') : '' })); files.append(item);
	}
	if (!snapshot.files.length) { const item = document.createElement('li'); localizedText(item, () => (tr(dict, 'filesCleaned'))); files.append(item); }
	countdown();
}

async function call(method: 'POST' | 'DELETE') {
	controller = new AbortController();
	return fetch(`/api/shares/${encodeURIComponent(id)}/manage`, { method, headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: controller.signal });
}

async function refresh() {
	if (stopped || suspended || busy || document.hidden) return;
	clearTimeout(pollTimer); busy = true; deleteButton.disabled = true;
	try {
		const response = await call('POST');
		if (response.status === 404) {
			if (previous) announce(() => tr(dict, 'notManageable'));
			stopped = true; deleteButton.disabled = true;
			throw new WorkspaceError(dict, 'manageNotFound');
		}
		if (!response.ok) throw new WorkspaceError(dict, response.status === 429 ? 'manageRate' : 'manageRefreshFailed');
		show(await response.json() as ManageSnapshot);
		const updated = new Date();
		errorNode.hidden = true; localizedText(message, () => tr(dict, 'updated', { time: updated.toLocaleTimeString(currentLang() === 'en' ? 'en-US' : 'id-ID') }));
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') return;
		localizedText(errorNode, () => workspaceErrorMessage(error, tr(dict, 'manageReadFailed'))); errorNode.hidden = false; localizedText(message, () => (''));
	} finally {
		busy = false; controller = null;
		deleteButton.disabled = stopped || !previous || previous.status === 'deleted';
		if (!stopped && !suspended && !document.hidden) pollTimer = setTimeout(() => void refresh(), 20_000);
	}
}

notifyButton.addEventListener('click', async () => {
	optedIn = true;
	try {
		if (!('Notification' in window) || await Notification.requestPermission() !== 'granted') throw new Error(tr(dict, 'notifyDenied'));
		localizedText(node('notify-note'), () => (tr(dict, 'notifyOnNote')));
		localizedText(notifyButton, () => (tr(dict, 'notifyOn'))); notifyButton.disabled = true;
	} catch {
		localizedText(node('notify-note'), () => (tr(dict, 'notifyFallbackNote')));
		toast(() => (tr(dict, 'notifyFallbackToast')));
		localizedText(notifyButton, () => (tr(dict, 'notifyFallback'))); notifyButton.disabled = true;
	}
});

deleteButton.addEventListener('click', () => { clearTimeout(pollTimer); dialog.showModal(); });
dialog.addEventListener('close', () => { if (!busy) void refresh(); });
node('cancel').addEventListener('click', () => dialog.close());
confirmButton.addEventListener('click', async () => {
	if (busy) return;
	clearTimeout(pollTimer); busy = true; confirmButton.disabled = true; deleteButton.disabled = true;
	try {
		const response = await call('DELETE');
		if (!response.ok) throw new WorkspaceError(dict, 'deleteFailed');
		const result = await response.json() as { pendingCleanup: boolean };
		dialog.close();
		toast(() => (result.pendingCleanup ? tr(dict, 'deletedPending') : tr(dict, 'deletedToast')), { tone: 'success' });
		errorNode.hidden = true;
	} catch (error) { localizedText(errorNode, () => workspaceErrorMessage(error, tr(dict, 'deleteError'))); errorNode.hidden = false; dialog.close(); }
	finally { busy = false; controller = null; confirmButton.disabled = false; await refresh(); }
});

if (!/^[0-9a-f]{32}$/.test(id) || !MANAGE_TOKEN_PATTERN.test(token)) {
	stopped = true; localizedText(message, () => ('')); errorNode.hidden = false;
	localizedText(errorNode, () => (tr(dict, 'manageIncomplete')));
} else {
	const url = `${location.origin}/s/${id}`;
	(node('share-link') as HTMLAnchorElement).href = url;
	(node('share-url') as HTMLInputElement).value = url;
	node('share-copy').addEventListener('click', async () => { const copied = await copyText(url); toast(() => (copied ? tr(dict, 'shareCopied') : tr(dict, 'shareCopyFailed'))); });
	void qrDataUrl(url).then((src) => { const image = node('qr') as HTMLImageElement; image.src = src; image.hidden = false; }).catch(() => undefined);
	void refresh();
}

document.addEventListener('visibilitychange', () => {
	clearTimeout(pollTimer);
	if (document.hidden) { if (!dialog.open) controller?.abort(); } else void refresh();
});
let tickTimer: ReturnType<typeof setInterval> | null = setInterval(countdown, 1000);
window.addEventListener('pagehide', () => {
	suspended = true;
	clearTimeout(pollTimer);
	if (tickTimer !== null) clearInterval(tickTimer);
	tickTimer = null;
	controller?.abort();
});
window.addEventListener('pageshow', (event) => {
	if (!event.persisted) return;
	suspended = false;
	if (stopped) return;
	countdown();
	if (tickTimer === null) tickTimer = setInterval(countdown, 1000);
	void refresh();
});

localizedText(document.querySelector('title'), () => tr(dict, 'manageTitle'));
