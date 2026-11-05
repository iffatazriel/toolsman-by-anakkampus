/*
  File ini harus jalan sebelum body dirender supaya tema tersimpan tidak berkedip.
  Dipisah dari HTML agar CSP tidak memerlukan 'unsafe-inline' untuk script.
*/
(() => {
	try {
		const stored = localStorage.getItem('toolsman-theme');
		if (stored === 'light' || stored === 'dark') {
			document.documentElement.dataset.theme = stored;
		}
	} catch {
		/* tanpa akses penyimpanan, tema mengikuti sistem */
	}
})();

// Harus diatur sebelum modul Excalidraw dievaluasi agar font dimuat dari
// /excalidraw/, bukan dari CDN esm.sh.
window.EXCALIDRAW_ASSET_PATH = '/excalidraw/';
