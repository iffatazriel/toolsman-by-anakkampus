import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/clipboard', () => ({ copyText: vi.fn(async () => true) }));
vi.mock('../../lib/toast', () => ({ toast: vi.fn() }));
vi.mock('./qr', () => ({ qrDataUrl: vi.fn(async () => 'data:image/png;base64,test') }));

class Node extends EventTarget {
	dataset = { manageId: 'a'.repeat(32) };
	hidden = false;
	disabled = false;
	textContent = '';
	replaceChildren() {}
	append() {}
}

let browser: EventTarget;
let nodes: Map<string, Node>;
let fetchMock: ReturnType<typeof vi.fn>;
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
function lifecycle(type: 'pagehide' | 'pageshow', persisted = true) {
	const event = new Event(type);
	Object.defineProperty(event, 'persisted', { value: persisted });
	browser.dispatchEvent(event);
}

beforeEach(() => {
	vi.resetModules(); vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
	nodes = new Map(); browser = new EventTarget();
	const document = Object.assign(new EventTarget(), {
		hidden: false,
		querySelector: () => new Node(),
		getElementById: (id: string) => { if (!nodes.has(id)) nodes.set(id, new Node()); return nodes.get(id)!; },
		createElement: () => new Node(),
	});
	vi.stubGlobal('window', browser); vi.stubGlobal('document', document);
	vi.stubGlobal('location', { origin: 'https://toolsman.test', hash: `#t=${'b'.repeat(43)}` });
	const snapshot = { status: 'ready', available: true, createdAt: Date.now(), expiresAt: Date.now() + 90_000, protected: false, oneTime: false, downloads: 0, pendingCleanup: false, files: [] };
	fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => snapshot });
	vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('management page lifecycle', () => {
	it('stops on pagehide, then refreshes and resumes one countdown/polling pair on BFCache restore', async () => {
		await import('./manage-client'); await flush();
		expect(fetchMock).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(2);
		const before = nodes.get('manage-countdown')!.textContent;
		lifecycle('pagehide'); expect(vi.getTimerCount()).toBe(0);
		await vi.advanceTimersByTimeAsync(70_000);
		expect(fetchMock).toHaveBeenCalledTimes(1); expect(nodes.get('manage-countdown')!.textContent).toBe(before);
		lifecycle('pageshow'); await flush();
		expect(fetchMock).toHaveBeenCalledTimes(2); expect(vi.getTimerCount()).toBe(2);
		expect(nodes.get('manage-countdown')!.textContent).not.toBe(before);
		await vi.advanceTimersByTimeAsync(20_000); expect(fetchMock).toHaveBeenCalledTimes(3);
		lifecycle('pagehide'); lifecycle('pageshow'); await flush();
		expect(vi.getTimerCount()).toBe(2); expect(fetchMock).toHaveBeenCalledTimes(4);
	});
	it('aborts an in-flight poll cleanly and can poll again after restoration', async () => {
		await import('./manage-client'); await flush();
		let signal: AbortSignal | undefined;
		fetchMock.mockImplementationOnce((_url, init: RequestInit) => new Promise((_resolve, reject) => {
			signal = init.signal as AbortSignal;
			signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
		}));
		await vi.advanceTimersByTimeAsync(20_000);
		lifecycle('pagehide'); await flush();
		expect(signal?.aborted).toBe(true); expect(vi.getTimerCount()).toBe(0);
		lifecycle('pageshow'); await flush();
		expect(fetchMock).toHaveBeenCalledTimes(3); expect(vi.getTimerCount()).toBe(2);
	});
	it('does not revive an invalid management link on restoration', async () => {
		vi.stubGlobal('location', { origin: 'https://toolsman.test', hash: '#t=invalid' });
		await import('./manage-client'); lifecycle('pagehide'); lifecycle('pageshow'); await flush();
		expect(fetchMock).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
	});
	it('keeps terminal auth failures stopped and ignores ordinary pageshow events', async () => {
		fetchMock.mockResolvedValue({ ok: false, status: 404 });
		await import('./manage-client'); await flush();
		lifecycle('pageshow', false); lifecycle('pagehide'); lifecycle('pageshow'); await flush();
		expect(fetchMock).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0);
	});
});
