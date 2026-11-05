import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import '@excalidraw/excalidraw/index.css';

const STORAGE_KEY = 'toolsman-draw-scene';
const NAME_KEY = 'toolsman-draw-name';

interface Scene {
	elements: unknown[];
	appState: { viewBackgroundColor?: string };
}

interface Api {
	getSceneElements: () => readonly unknown[];
	getAppState: () => Record<string, unknown>;
	getFiles: () => Record<string, unknown>;
}

type ExcalidrawComponent = ComponentType<Record<string, unknown>>;

function readSaved(): Scene | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as Scene) : null;
	} catch {
		return null;
	}
}

export default function ExcalidrawCanvas() {
	const [Excalidraw, setExcalidraw] = useState<ExcalidrawComponent | null>(null);
	const [api, setApi] = useState<Api | null>(null);
	const [status, setStatus] = useState('Tersimpan otomatis');
	const [name, setName] = useState('gambar');
	const [dark, setDark] = useState(false);
	const initial = useRef<Scene | null>(null);
	const saveTimer = useRef<number | undefined>(undefined);

	useEffect(() => {
		let active = true;
		import('@excalidraw/excalidraw').then((module) => {
			if (active) setExcalidraw(() => module.Excalidraw as unknown as ExcalidrawComponent);
		});
		initial.current = readSaved();
		setName(localStorage.getItem(NAME_KEY) ?? 'gambar');
		const forced = document.documentElement.dataset.theme;
		setDark(forced ? forced === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
		return () => {
			active = false;
			window.clearTimeout(saveTimer.current);
		};
	}, []);

	useEffect(() => {
		try {
			localStorage.setItem(NAME_KEY, name);
		} catch {
			/* nama tidak tersimpan, tidak masalah */
		}
	}, [name]);

	const handleChange = (elements: readonly unknown[], appState: { viewBackgroundColor?: string }) => {
		setStatus('Menyimpan…');
		window.clearTimeout(saveTimer.current);
		saveTimer.current = window.setTimeout(() => {
			try {
				const scene: Scene = {
					elements: [...elements],
					appState: { viewBackgroundColor: appState.viewBackgroundColor },
				};
				localStorage.setItem(STORAGE_KEY, JSON.stringify(scene));
				setStatus('Tersimpan otomatis');
			} catch {
				setStatus('Gambar terlalu besar untuk disimpan otomatis.');
			}
		}, 500);
	};

	useEffect(() => {
		if (!api) return;
		window.toolsmanDraw = {
			getBlob: async (format) => {
				const excalidraw = await import('@excalidraw/excalidraw');
				const base = {
					elements: api.getSceneElements(),
					appState: { ...api.getAppState(), exportWithDarkMode: dark },
					files: api.getFiles(),
				};
				if (format === 'png') {
					return excalidraw.exportToBlob({ ...base, mimeType: 'image/png' } as never);
				}
				if (format === 'svg') {
					const svg = await excalidraw.exportToSvg(base as never);
					return new Blob([new XMLSerializer().serializeToString(svg)], {
						type: 'image/svg+xml',
					});
				}
				const json = excalidraw.serializeAsJSON(
					base.elements as never,
					base.appState as never,
					base.files as never,
					'local',
				);
				return new Blob([json], { type: 'application/json' });
			},
			name: () => name,
		};
		return () => {
			delete window.toolsmanDraw;
		};
	}, [api, dark, name]);

	return (
		<div className="draw-root">
			<div className="draw-bar">
				<label className="sr-only" htmlFor="draw-name">
					Nama berkas
				</label>
				<input
					id="draw-name"
					className="field-input draw-name"
					value={name}
					onChange={(event) => setName(event.target.value)}
				/>
				<span className="field-hint" aria-live="polite">
					{status}
				</span>
			</div>
			<div className="draw-canvas">
				{Excalidraw ? (
					<Excalidraw
						excalidrawAPI={(instance: Api) => setApi(instance)}
						initialData={{
							elements: initial.current?.elements ?? [],
							appState: {
								viewBackgroundColor: initial.current?.appState.viewBackgroundColor,
								theme: dark ? 'dark' : 'light',
							},
						}}
						onChange={handleChange}
						theme={dark ? 'dark' : 'light'}
					/>
				) : (
					<p className="field-hint draw-loading">Memuat kanvas…</p>
				)}
			</div>
		</div>
	);
}
