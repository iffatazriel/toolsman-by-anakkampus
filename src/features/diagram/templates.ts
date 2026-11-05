export interface DiagramTemplate {
	id: string;
	label: string;
	code: string;
}

export const diagramTemplates: DiagramTemplate[] = [
	{
		id: 'flowchart',
		label: 'Flowchart',
		code: `flowchart TD
  A[Mulai] --> B{Stok ada?}
  B -- Ya --> C[Proses pesanan]
  B -- Tidak --> D[Beri tahu pelanggan]
  C --> E[Selesai]
  D --> E`,
	},
	{
		id: 'sequence',
		label: 'Sequence',
		code: `sequenceDiagram
  participant U as Pengguna
  participant A as Aplikasi
  participant S as Server
  U->>A: Klik unduh
  A->>S: Minta berkas
  S-->>A: Kirim berkas
  A-->>U: Tampilkan hasil`,
	},
	{
		id: 'erd',
		label: 'ERD',
		code: `erDiagram
  MAHASISWA ||--o{ KRS : mengambil
  MATKUL ||--o{ KRS : masuk
  MAHASISWA {
    string nim PK
    string nama
  }
  MATKUL {
    string kode PK
    string judul
  }`,
	},
	{
		id: 'class',
		label: 'Class',
		code: `classDiagram
  class Hewan {
    +String nama
    +bersuara()
  }
  class Kucing {
    +mengeong()
  }
  Hewan <|-- Kucing`,
	},
	{
		id: 'gantt',
		label: 'Gantt',
		code: `gantt
  title Rencana skripsi
  dateFormat YYYY-MM-DD
  section Riset
  Studi pustaka :a1, 2026-01-05, 14d
  Pengumpulan data :a2, after a1, 21d
  section Penulisan
  Draf bab 1-3 :b1, after a2, 28d`,
	},
	{
		id: 'state',
		label: 'State',
		code: `stateDiagram-v2
  [*] --> Draf
  Draf --> Terkirim: kirim
  Terkirim --> Disetujui: setuju
  Terkirim --> Draf: revisi
  Disetujui --> [*]`,
	},
];

export function getTemplate(id: string): DiagramTemplate | undefined {
	return diagramTemplates.find((item) => item.id === id);
}
