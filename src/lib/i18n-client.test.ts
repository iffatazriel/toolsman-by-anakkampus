import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyLanguage } from './i18n-client';
import { currentLang, defineWorkspaceDictionary, registerWorkspaceDictionary, setCurrentLang } from './i18n';

afterEach(() => { vi.unstubAllGlobals(); setCurrentLang('id'); });

describe('workspace attribute hooks', () => {
	it('updates text, placeholder, aria and title through applyLanguage and preserves unknown namespaces', () => {
		const dict = defineWorkspaceDictionary({ label: 'Hasil', placeholder: 'Tempel teks', aria: 'Ubah teks', title: 'Salin hasil' }, { label: 'Result', placeholder: 'Paste text', aria: 'Transform text', title: 'Copy result' });
		registerWorkspaceDictionary('hooks', dict);
		const text = { dataset: { i18n: 'workspace.hooks.label' }, textContent: 'Hasil' };
		const unknown = { dataset: { i18n: 'workspace.unloaded.label' }, textContent: 'Sumber' };
		const input = { dataset: { i18nPlaceholder: 'workspace.hooks.placeholder' }, placeholder: 'Tempel teks' };
		const aria = { dataset: { i18nAria: 'workspace.hooks.aria' }, setAttribute: vi.fn() };
		const title = { dataset: { i18nTitle: 'workspace.hooks.title' }, setAttribute: vi.fn() };
		const selectors: Record<string, unknown[]> = { '[data-i18n]': [text, unknown], '[data-i18n-placeholder]': [input], '[data-i18n-aria]': [aria], '[data-i18n-title]': [title] };
		const dispatchEvent = vi.fn();
		vi.stubGlobal('document', { documentElement: { lang: 'id' }, querySelector: () => null, querySelectorAll: (selector: string) => selectors[selector] ?? [], dispatchEvent });
		applyLanguage('en');
		expect(text.textContent).toBe('Result'); expect(input.placeholder).toBe('Paste text'); expect(unknown.textContent).toBe('Sumber');
		expect(aria.setAttribute).toHaveBeenLastCalledWith('aria-label', 'Transform text'); expect(title.setAttribute).toHaveBeenLastCalledWith('title', 'Copy result');
		expect(currentLang()).toBe('en'); expect(dispatchEvent.mock.calls[0]![0].detail).toEqual({ lang: 'en' });
		applyLanguage('id'); expect(text.textContent).toBe('Hasil');
	});
});
