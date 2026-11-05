/*
  Excalidraw menambahkan CDN esm.sh sebagai sumber font cadangan di setiap
  FontFace. CSP kita hanya mengizinkan font dari origin sendiri, jadi sumber
  cadangan itu selalu gagal. Shim ini membuang sumber esm.sh sebelum FontFace
  dibuat, sehingga font memakai file di /excalidraw/fonts.
*/
(() => {
	const Original = window.FontFace;
	if (!Original) return;

	window.FontFace = new Proxy(Original, {
		construct(target, args) {
			const source = String(args[1] ?? '');
			if (!source.includes('esm.sh')) return new target(...args);

			const parts = source
				.split(/,\s*/)
				.filter((part) => part !== '' && !part.includes('esm.sh'));

			if (parts.length === 0) return new target(...args);
			return new target(args[0], parts.join(', '), args[2]);
		},
	});
})();
