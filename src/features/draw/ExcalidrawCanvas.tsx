import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import '@excalidraw/excalidraw/index.css';
import { decodeSession, sessionTokenFromHash } from '../../lib/share-session';

const STORAGE_KEY = 'toolsman-draw-scene';
const NAME_KEY = 'toolsman-draw-name';

interface Scene {
	elements: unknown[];
	appState: { viewBackgroundColor?: string };
	files?: Record<string, unknown>;
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
	const [shared, setShared] = useState(false);
	const [linkProblem, setLinkProblem] = useState('');
	const initial = useRef<Scene | null>(null);
	const saveTimer = useRef<number | undefined>(undefined);

	useEffect(() => {
		let active = true;

		const load = async () => {
			const token = sessionTokenFromHash(window.location.hash);
			if (token) {
				try {
					const payload = (await decodeSession(token)) as {
						v?: number;
						type?: string;
						scene?: Scene;
					};
					if (
						payload?.v === 1 &&
						payload.type === 'draw' &&
						payload.scene &&
						Array.isArray(payload.scene.elements)
					) {
						initial.current = payload.scene;
						if (active) {
							setShared(true);
							setStatus('Hanya-baca dari link');
						}
					} else {
						throw new Error('Sesi tidak dikenali.');
					}
				} catch (error) {
					initial.current = readSaved();
					if (active) {
						setLinkProblem(
							error instanceof Error && error.message.includes('terlalu panjang')
								? 'Link sesi terpotong atau terlalu panjang, jadi kanvas ini memakai draf tersimpan di browser. Minta pengirim membagi gambarnya atau mengirim berkas .excalidraw.'
								: 'Link sesi tidak bisa dibaca, jadi kanvas ini memakai draf tersimpan di browser.',
						);
					}
				}
			} else {
				initial.current = readSaved();
			}

			const module = await import('@excalidraw/excalidraw');
			if (active) setExcalidraw(() => module.Excalidraw as unknown as ExcalidrawComponent);
		};

		void load();
		setName(localStorage.getItem(NAME_KEY) ?? 'gambar');
		return () => {
			active = false;
			window.clearTimeout(saveTimer.current);
		};
	}, []);

	useEffect(() => {
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const sync = () => {
			const forced = document.documentElement.dataset.theme;
			setDark(forced ? forced === 'dark' : media.matches);
		};

		sync();
		const observer = new MutationObserver(sync);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme'],
		});
		media.addEventListener('change', sync);

		return () => {
			observer.disconnect();
			media.removeEventListener('change', sync);
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
		if (shared) return;
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
			getScene: () => ({
				elements: [...api.getSceneElements()],
				appState: {
					viewBackgroundColor:
						typeof api.getAppState().viewBackgroundColor === 'string'
							? (api.getAppState().viewBackgroundColor as string)
							: undefined,
				},
				files: api.getFiles(),
			}),
			name: () => name,
		};
		return () => {
			delete window.toolsmanDraw;
		};
	}, [api, dark, name]);

	const openAsDraft = () => {
		if (!api) return;
		const appState = api.getAppState();
		const scene: Scene = {
			elements: [...api.getSceneElements()],
			appState: {
				viewBackgroundColor:
					typeof appState.viewBackgroundColor === 'string'
						? (appState.viewBackgroundColor as string)
						: undefined,
			},
			files: api.getFiles(),
		};

		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(scene));
		} catch {
			/* penyimpanan bisa penuh, kanvas tetap bisa diedit */
		}

		setShared(false);
		setLinkProblem('');
		window.history.replaceState(null, '', window.location.pathname);
		setStatus('Tersimpan otomatis');
	};

	return (
		<div className="draw-root">
			{linkProblem !== '' ? (
				<div className="draw-share-banner draw-share-banner--warning" role="alert">
					<span>{linkProblem}</span>
				</div>
			) : null}
			{shared ? (
				<div className="draw-share-banner">
					<span>Kanvas ini dibuka dari link dan hanya-baca.</span>
					<button type="button" className="btn btn--secondary" onClick={openAsDraft}>
						Buka sebagai draf
					</button>
				</div>
			) : null}
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
							files: initial.current?.files ?? {},
							appState: {
								viewBackgroundColor: initial.current?.appState.viewBackgroundColor,
								theme: dark ? 'dark' : 'light',
							},
						}}
						onChange={handleChange}
						theme={dark ? 'dark' : 'light'}
						viewModeEnabled={shared}
					/>
				) : (
					<p className="field-hint draw-loading">Memuat kanvas…</p>
				)}
			</div>
		</div>
	);
}
