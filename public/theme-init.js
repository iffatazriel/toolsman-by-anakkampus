/*
  File ini harus jalan sebelum body dirender supaya tema tersimpan tidak berkedip.
  Dipisah dari HTML agar CSP tidak memerlukan 'unsafe-inline' untuk script.
*/
(() => {
	const colors = { light: '#faf8f5', dark: '#141311' };

	// Warna bilah browser: media query di <head> mengikuti sistem, lalu
	// pilihan manual menimpanya dengan satu meta tanpa media.
	const paintBar = (theme) => {
		document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.remove());
		const meta = document.createElement('meta');
		meta.name = 'theme-color';
		meta.content = colors[theme];
		document.head.append(meta);
	};

	window.applyThemeColor = paintBar;

	try {
		const stored = localStorage.getItem('toolsman-theme');
		if (stored === 'light' || stored === 'dark') {
			document.documentElement.dataset.theme = stored;
			paintBar(stored);
		}
	} catch {
		/* tanpa akses penyimpanan, tema mengikuti sistem */
	}
})();

// Harus diatur sebelum modul Excalidraw dievaluasi agar font dimuat dari
// /excalidraw/, bukan dari CDN esm.sh.
window.EXCALIDRAW_ASSET_PATH = '/excalidraw/';
