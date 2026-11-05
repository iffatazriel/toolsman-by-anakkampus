/// <reference types="astro/client" />

interface ToolsmanDrawApi {
	getBlob: (format: 'png' | 'svg' | 'json') => Promise<Blob | null>;
	name: () => string;
}

interface TurnstileApi {
	render: (container: HTMLElement, options: Record<string, unknown>) => string;
	reset: (widgetId?: string) => void;
	remove: (widgetId?: string) => void;
}

interface Window {
	toolsmanDraw?: ToolsmanDrawApi;
	turnstile?: TurnstileApi;
	EXCALIDRAW_ASSET_PATH?: string;
}

interface ImportMetaEnv {
	readonly PUBLIC_SITE_URL?: string;
	readonly PUBLIC_IMGLY_PATH?: string;
	readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
	readonly PUBLIC_PLAUSIBLE_DOMAIN?: string;
}
