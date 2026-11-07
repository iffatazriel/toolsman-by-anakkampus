import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'diagram',
	name: 'Diagram Mermaid',
	category: 'diagram',
	tagline:
		'Tulis flowchart, ERD, atau sequence dalam teks, diagramnya muncul di panel sebelah.',
	keywords: [
		'diagram',
		'flowchart',
		'erd',
		'sequence',
		'mermaid',
		'class diagram',
		'gantt',
		'state',
		'bagan',
	],
	privacy: 'lokal',
	status: 'siap',
	icon: 'network',
	plans: [],
	usage: [
		'Pilih template di atas editor, lalu ubah kodenya. Pratinjau ikut berubah.',
		'Kalau ada error sintaks, pesannya menunjuk baris yang bermasalah.',
		'Unduh PNG atau SVG setelah diagramnya valid.',
		'Editor Visual membuka diagrams.net di dalam halaman. Tekan Save & Exit di sana untuk mengunduh berkas .drawio.',
	],
	privacyDetail:
		'Kode diagram disimpan sebagai draf di browser ini. Tidak dikirim ke server.',
};
