import type { Config } from '@imgly/background-removal';

export type ProgressFn = (key: string, current: number, total: number) => void;

let loading: Promise<(file: Blob) => Promise<Blob>> | null = null;

export function loadPhotoModule(onProgress: ProgressFn): Promise<(file: Blob) => Promise<Blob>> {
	loading ??= import('@imgly/background-removal').then((module) => {
		const config: Config = {
			model: 'isnet_fp16',
			output: { format: 'image/png', quality: 1 },
			progress: onProgress,
		};

		// Tanpa env ini, pustaka memakai CDN staticimgly.com. Isi
		// PUBLIC_IMGLY_PATH=/models/imgly/ kalau model di-host sendiri.
		const localPath = import.meta.env.PUBLIC_IMGLY_PATH;
		if (localPath) config.publicPath = localPath;

		return (file: Blob) => module.removeBackground(file, config);
	});
	loading.catch(() => {
		loading = null;
	});
	return loading;
}
