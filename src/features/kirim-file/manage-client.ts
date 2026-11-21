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
const deleteButton = node('delete') as HTMLButtonElement;
const confirmButton = node('confirm-delete') as HTMLButtonElement;
const dialog = node('confirm') as HTMLDialogElement;
const notifyButton = node('notify') as HTMLButtonElement;
let previous: ManageSnapshot | null = null;
let optedIn = false, stopped = false, busy = false;
let pollTimer: ReturnType<typeof setTimeout>;
let controller: AbortController | null = null;

function announce(text: string) {
	if (optedIn && 'Notification' in window && Notification.permission === 'granted') {
		try { new Notification('Kirim File', { body: text }); return; } catch { /* gunakan toast */ }
	}
	toast(text);
}

function countdown() {
	if (previous) node('countdown').textContent = previous.expiresAt <= Date.now() ? 'Sudah kedaluwarsa.' : formatRemaining(previous.expiresAt - Date.now());
}

function show(snapshot: ManageSnapshot) {
	for (const text of managementChanges(previous, snapshot)) announce(text);
	previous = snapshot;
	node('details').hidden = false; node('share').hidden = false;
	node('state').textContent = snapshot.status === 'deleted' ? 'Dihapus' : snapshot.status === 'uploading' ? 'Sedang diunggah' : snapshot.available ? 'Siap dibagikan' : 'Tidak tersedia (kedaluwarsa, kuota habis, atau dinonaktifkan)';
	node('created').textContent = new Date(snapshot.createdAt).toLocaleString('id-ID');
	node('expires').textContent = new Date(snapshot.expiresAt).toLocaleString('id-ID');
	node('flags').textContent = `${snapshot.protected ? 'Dengan kata sandi' : 'Tanpa kata sandi'} · ${snapshot.oneTime ? 'Sekali unduh per berkas' : 'Unduhan berulang'}`;
	node('downloads').textContent = String(snapshot.downloads);
	node('pending').hidden = !snapshot.pendingCleanup;
	deleteButton.disabled = snapshot.status === 'deleted' || busy;
	const files = node('files'); files.replaceChildren();
	for (const file of snapshot.files) {
		const item = document.createElement('li'); item.textContent = `${file.name} — ${formatBytes(file.size)} — ${file.downloads} unduhan${file.purged ? ' — objek sudah dihapus' : ''}`; files.append(item);
	}
	if (!snapshot.files.length) { const item = document.createElement('li'); item.textContent = 'Data berkas sudah dibersihkan.'; files.append(item); }
	countdown();
}

async function call(method: 'POST' | 'DELETE') {
	controller = new AbortController();
	return fetch(`/api/shares/${encodeURIComponent(id)}/manage`, { method, headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: controller.signal });
}

async function refresh() {
	if (stopped || busy || document.hidden) return;
	clearTimeout(pollTimer); busy = true; deleteButton.disabled = true;
	try {
		const response = await call('POST');
		if (response.status === 404) {
			if (previous) announce('Kiriman kamu tidak lagi bisa dikelola.');
			stopped = true; deleteButton.disabled = true;
			throw new Error('Link kelola tidak ditemukan atau token tidak cocok. Kiriman lama tanpa token tidak bisa dikelola.');
		}
		if (!response.ok) throw new Error(response.status === 429 ? 'Pemeriksaan terlalu sering. Tunggu sebentar; halaman akan mencoba lagi.' : 'Status belum bisa diperbarui. Periksa koneksi kamu; halaman akan mencoba lagi.');
		show(await response.json() as ManageSnapshot);
		errorNode.hidden = true; message.textContent = `Diperbarui ${new Date().toLocaleTimeString('id-ID')}. Pemeriksaan otomatis hanya saat tab terlihat.`;
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') return;
		errorNode.textContent = error instanceof Error ? error.message : 'Status belum bisa dibaca.'; errorNode.hidden = false; message.textContent = '';
	} finally {
		busy = false; controller = null;
		deleteButton.disabled = stopped || !previous || previous.status === 'deleted';
		if (!stopped && !document.hidden) pollTimer = setTimeout(() => void refresh(), 20_000);
	}
}

notifyButton.addEventListener('click', async () => {
	optedIn = true;
	try {
		if (!('Notification' in window) || await Notification.requestPermission() !== 'granted') throw new Error('Notifikasi browser tidak diizinkan.');
		node('notify-note').textContent = 'Notifikasi browser aktif selama halaman terbuka dan tab terlihat. Tutup halaman untuk berhenti.';
		notifyButton.textContent = 'Notifikasi aktif'; notifyButton.disabled = true;
	} catch {
		node('notify-note').textContent = 'Notifikasi browser tidak tersedia atau ditolak. Perubahan akan muncul sebagai pesan di halaman selama tab terlihat.';
		toast('Notifikasi di halaman aktif. Tidak perlu mengizinkan notifikasi browser.');
		notifyButton.textContent = 'Notifikasi di halaman aktif'; notifyButton.disabled = true;
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
		if (!response.ok) throw new Error('Kiriman belum berhasil dihapus. Coba lagi sebentar.');
		const result = await response.json() as { pendingCleanup: boolean };
		dialog.close();
		toast(result.pendingCleanup ? 'Akses ditutup. Penghapusan sisa objek akan dicoba lagi otomatis.' : 'Kiriman dihapus dan link penerima dinonaktifkan.', { tone: 'success' });
		errorNode.hidden = true;
	} catch (error) { errorNode.textContent = error instanceof Error ? error.message : 'Gagal menghapus kiriman.'; errorNode.hidden = false; dialog.close(); }
	finally { busy = false; controller = null; confirmButton.disabled = false; await refresh(); }
});

if (!/^[0-9a-f]{32}$/.test(id) || !MANAGE_TOKEN_PATTERN.test(token)) {
	stopped = true; message.textContent = ''; errorNode.hidden = false;
	errorNode.textContent = 'Link kelola tidak lengkap. Buka link dari Kiriman kamu atau pastikan link menyertakan #t=token. Kiriman lama tanpa token tidak bisa dikelola.';
} else {
	const url = `${location.origin}/s/${id}`;
	(node('share-link') as HTMLAnchorElement).href = url;
	(node('share-url') as HTMLInputElement).value = url;
	node('share-copy').addEventListener('click', async () => toast(await copyText(url) ? 'Link kiriman disalin.' : 'Gagal menyalin. Pilih link lalu salin manual.'));
	void qrDataUrl(url).then((src) => { const image = node('qr') as HTMLImageElement; image.src = src; image.hidden = false; }).catch(() => undefined);
	void refresh();
}

document.addEventListener('visibilitychange', () => {
	clearTimeout(pollTimer);
	if (document.hidden) { if (!dialog.open) controller?.abort(); } else void refresh();
});
const tickTimer = setInterval(countdown, 1000);
window.addEventListener('pagehide', () => { stopped = true; clearTimeout(pollTimer); clearInterval(tickTimer); controller?.abort(); });
