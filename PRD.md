# PRD — Toolsman

> **Versi:** 1.0 (Draft) · **Tanggal:** 4 November 2026 · **Status:** Siap review
> **Tagline:** *Kotak perkakas gratis untuk mahasiswa dan developer.*

---

## 1. Ringkasan

**Toolsman** adalah website kumpulan alat (tools) gratis yang membantu mahasiswa informatika dan software developer pemula mengerjakan tugas, proyek, dan kebutuhan sehari-hari: menggambar dan menulis di kanvas, membuat flowchart/diagram, mengolah PDF, mengganti background pas foto, mengirim file via link, hingga membuat file `.md` dan `.json`.

Prinsip utama: **cepat, gratis, tanpa login, dan privat** (sebisa mungkin file diproses langsung di browser pengguna).

## 2. Latar Belakang & Masalah

Mahasiswa dan developer pemula biasanya harus membuka banyak situs berbeda untuk kebutuhan sederhana. Masalah yang sering muncul:

| Masalah | Dampak |
|---|---|
| Alat tersebar di banyak situs (Excalidraw, draw.io, iLovePDF, remove.bg, WeTransfer, dll.) | Boros waktu, harus pindah-pindah tab |
| Banyak situs gratis penuh iklan, batas harian, atau memaksa daftar | Mengganggu alur kerja |
| File diunggah ke server pihak ketiga | Risiko privasi untuk dokumen tugas, KTP, ijazah, foto |
| Pas foto untuk administrasi kampus/lamaran membutuhkan editor berat atau berbayar | Mahasiswa sering bayar jasa foto/edit hanya untuk ganti background |
| Developer pemula sering butuh utilitas kecil (format JSON, README, dll.) | Mencari satu per satu, kualitas situs tidak konsisten |

## 3. Tujuan & Non-Tujuan

### 3.1 Tujuan
1. Menjadi **satu pintu** untuk alat harian mahasiswa dev, dengan pengalaman yang konsisten.
2. Semua alat inti **gratis dan dapat dipakai tanpa akun**.
3. Mayoritas pemrosesan berjalan **di sisi klien** agar file pengguna tidak meninggalkan perangkat.
4. Halaman cepat dimuat, nyaman di HP maupun laptop, dan mendukung bahasa Indonesia.
5. Mudah dikembangkan: menambah alat baru cukup mengikuti pola modul yang sama.

### 3.2 Non-Tujuan (di luar cakupan v1)
- Platform kolaborasi real-time berskala besar
- Penyimpanan cloud permanen / drive pribadi
- Editor kode / IDE online penuh
- Monetisasi agresif (iklan pop-up, paywall pada fitur inti)
- Aplikasi mobile native

## 4. Target Pengguna

### Persona 1 — Rani, mahasiswa Informatika semester 3
- Butuh membuat flowchart & ERD untuk laporan, merapikan PDF tugas, dan menggabungkan file.
- Pakai HP dan laptop kampus; kuota terbatas.
- Frustrasi dengan situs yang minta login dan membatasi 2 file per hari.

### Persona 2 — Dimas, developer pemula / freelancer
- Butuh format JSON, membuat README, `.gitignore`, mencoba regex, kirim file ke klien lewat link.
- Menghargai alat yang cepat dan tanpa gangguan.

### Persona 3 — Sinta, mahasiswa semester akhir (non-teknis bagian tertentu)
- Butuh pas foto berlatar merah/biru untuk berkas wisuda atau lamaran kerja.
- Ingin hasil rapi tanpa belajar software editing.

## 5. Prinsip Produk

1. **Tanpa gesekan:** buka → pakai. Tidak ada wajib login.
2. **Privasi dulu:** proses di browser; jika butuh server, jelaskan dengan jujur.
3. **Satu pola, banyak alat:** setiap alat punya tata letak dan perilaku yang konsisten.
4. **Ringan:** alat dimuat *lazy* sehingga halaman utama tetap cepat.
5. **Jujur soal batasan:** ukuran maksimum, masa berlaku link, dll. ditampilkan jelas.

## 6. Ruang Lingkup & Roadmap

### MVP (v1.0) — target 8–10 minggu
| Modul | Alat | Prioritas |
|---|---|---|
| Landing & Katalog | Beranda, pencarian alat, kategori, dark/light mode | P0 |
| **Draw** | Kanvas gambar & tulis berbasis Excalidraw | P0 |
| **Diagram** | Editor Mermaid (flowchart, ERD, sequence) + tombol buka draw.io (embed) | P0 |
| **PDF** | Merge, Split, Compress, Gambar→PDF, PDF→Gambar, Rotate | P0 |
| **Pas Foto** | Hapus/ganti background, ukuran 2×3, 3×4, 4×6 | P0 |
| **Kirim File** | Unggah → dapat link, kedaluwarsa otomatis | P0 |
| **Generator** | Markdown editor + preview + template README, JSON formatter/validator | P0 |

### v1.1 — Tambahan cepat
- `.gitignore` & LICENSE generator
- Base64 / URL encode-decode, JWT decoder
- Regex tester, Diff checker
- QR code generator
- Kompres & konversi gambar
- Utilitas teks, warna & kontras, hash, data palsu, hapus metadata foto
- **Cron expression builder** (5 field, zona waktu, 5 jadwal berikutnya)
- **Code-to-image** (highlight.js, tema, padding, radius, PNG)
- **JSON Schema validator** (error per path dalam bahasa Indonesia)
- **Berbagi sesi Draw/Diagram** via link hanya-baca, data terkompresi di URL
- **Pilihan bahasa Indonesia/Inggris** untuk shell, katalog, dan metadata alat

### v2.0 — Lanjutan
- Akun opsional (simpan riwayat & favorit)
- PWA offline untuk alat client-side
- Terjemahan copy di dalam workspace semua alat

## 7. Kebutuhan Fungsional

> Format ID: **FR-[modul]-[nomor]**. Prioritas: P0 (wajib MVP), P1, P2.

### 7.1 Landing & Katalog

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-HOME-01 | Beranda menampilkan grid kartu alat berdasarkan kategori (Gambar, Diagram, Dokumen, Foto, Berbagi, Generator, Utilitas). | P0 |
| FR-HOME-02 | Pencarian alat instan (nama + sinonim), dapat dibuka dengan pintasan `/` atau `Ctrl+K`. | P0 |
| FR-HOME-03 | Mode terang/gelap, mengikuti preferensi sistem dan dapat diubah manual. | P0 |
| FR-HOME-04 | Alat terakhir dipakai & favorit disimpan di `localStorage` (tanpa akun). | P1 |
| FR-HOME-05 | Pilihan bahasa Indonesia (default) dan Inggris. | P2 |

**Acceptance criteria:** pengguna dapat menemukan dan membuka alat apa pun dalam ≤ 2 klik atau 1 pencarian.

### 7.2 Draw (Excalidraw)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-DRAW-01 | Menyediakan kanvas gambar & tulis dengan bentuk, panah, teks, pensil bebas, dan penghapus. | P0 |
| FR-DRAW-02 | Auto-save ke `localStorage`; pulihkan saat halaman dibuka ulang. | P0 |
| FR-DRAW-03 | Ekspor PNG, SVG, dan file `.excalidraw`; impor `.excalidraw`. | P0 |
| FR-DRAW-04 | Salin ke clipboard sebagai gambar. | P1 |
| FR-DRAW-05 | Tema gelap sinkron dengan tema situs. | P1 |
| FR-DRAW-06 | Berbagi kanvas via link (hanya-baca). | P2 |

**Catatan implementasi:** gunakan paket `@excalidraw/excalidraw` (lisensi MIT) yang di-*embed* sebagai komponen React. Muat secara *lazy* agar bundle awal tetap kecil.

### 7.3 Diagram (Mermaid + draw.io)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-DIA-01 | Editor teks Mermaid dengan pratinjau langsung (split view; tab di HP). | P0 |
| FR-DIA-02 | Template siap pakai: flowchart, sequence, ERD, class diagram, gantt, state diagram. | P0 |
| FR-DIA-03 | Ekspor PNG, SVG, dan salin kode Mermaid. | P0 |
| FR-DIA-04 | Penanda error sintaks dengan nomor baris. | P0 |
| FR-DIA-05 | Tombol **"Editor Visual (draw.io)"** membuka embed diagrams.net untuk pengguna yang lebih suka drag-and-drop. | P1 |
| FR-DIA-06 | Simpan draf otomatis di `localStorage`. | P1 |

**Catatan implementasi:** Mermaid berlisensi MIT. diagrams.net/draw.io berlisensi Apache 2.0 dan menyediakan mode embed; integrasi dilakukan lewat iframe sesuai dokumentasi resmi mereka. Tidak menyalin merek/logo draw.io ke dalam UI Toolsman.

### 7.4 PDF Tools (setara fitur dasar iLovePDF)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-PDF-01 | **Gabung PDF:** unggah banyak file, urutkan dengan drag-and-drop, hasilkan satu PDF. | P0 |
| FR-PDF-02 | **Pisah PDF:** pilih rentang halaman atau ekstrak halaman tertentu. | P0 |
| FR-PDF-03 | **Kompres PDF:** tiga tingkat (Ringan / Sedang / Maksimal) dengan tampilan ukuran sebelum–sesudah. | P0 |
| FR-PDF-04 | **Gambar → PDF:** JPG/PNG ke PDF, atur orientasi dan margin. | P0 |
| FR-PDF-05 | **PDF → Gambar:** ekspor tiap halaman ke PNG/JPG. | P1 |
| FR-PDF-06 | **Putar & hapus halaman.** | P1 |
| FR-PDF-07 | **Tambah nomor halaman / watermark teks.** | P2 |
| FR-PDF-08 | Seluruh proses berjalan **di browser**; tidak ada unggahan ke server. | P0 |

**Acceptance criteria:** menggabungkan 5 PDF berukuran total 20 MB selesai < 10 detik di laptop standar dan file tidak dikirim ke jaringan (dapat diverifikasi lewat tab Network).

**Catatan implementasi:** `pdf-lib` (merge/split/rotate), `pdf.js` (render halaman), Web Worker agar UI tidak membeku. Kompres PDF di sisi klien bersifat *best-effort* (render ulang halaman gambar dengan kualitas lebih rendah); tampilkan peringatan bila hasil tidak lebih kecil.

### 7.5 Pas Foto (Ganti Background)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-FOTO-01 | Unggah foto (JPG/PNG/WEBP, maks. 10 MB) atau ambil dari kamera. | P0 |
| FR-FOTO-02 | Hapus background otomatis **di browser** (model ONNX/WASM, mis. `@imgly/background-removal`). | P0 |
| FR-FOTO-03 | Pilih warna latar: **merah, biru, putih, kustom** (color picker). | P0 |
| FR-FOTO-04 | Pilih ukuran cetak: **2×3, 3×4, 4×6 cm**, resolusi 300 DPI. | P0 |
| FR-FOTO-05 | Crop & posisi wajah dengan *guide* (garis kepala/bahu) dan zoom. | P0 |
| FR-FOTO-06 | Penghalusan tepi (*feather*) dan penyesuaian kecerahan dasar. | P1 |
| FR-FOTO-07 | **Lembar cetak:** susun beberapa foto pada kertas 4R/A4 siap cetak. | P1 |
| FR-FOTO-08 | Ekspor PNG/JPG; foto tidak diunggah ke server. | P0 |

**Acceptance criteria:** pengguna dapat mengubah satu foto menjadi pas foto 3×4 berlatar merah dalam ≤ 5 langkah dan ≤ 30 detik (setelah model termuat).

**Risiko & catatan:** unduhan model awal cukup besar (puluhan MB) — tampilkan indikator progres dan *cache* lewat Service Worker. Beri catatan bahwa instansi tertentu memiliki aturan pas foto sendiri (pakaian, rasio wajah).

### 7.6 Kirim File via Link

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-SHARE-01 | Unggah satu atau beberapa file (drag-and-drop), maks. **100 MB per berkas** (dapat disesuaikan). | P0 |
| FR-SHARE-02 | Hasilkan link unik yang sulit ditebak (ID acak ≥ 128 bit) beserta tombol salin & QR code. | P0 |
| FR-SHARE-03 | Pilih masa berlaku: **1 jam / 24 jam / 7 hari**; file dihapus otomatis setelah kedaluwarsa. | P0 |
| FR-SHARE-04 | Opsi **batas unduhan** (mis. 1× unduh lalu hangus). | P1 |
| FR-SHARE-05 | Opsi **kata sandi** untuk link. | P1 |
| FR-SHARE-06 | Halaman unduhan menampilkan nama file, ukuran, dan sisa waktu. | P0 |
| FR-SHARE-07 | Progres unggah, pembatalan, dan percobaan ulang otomatis (unggah *multipart*/resumable). | P1 |
| FR-SHARE-08 | Tombol **Laporkan penyalahgunaan** pada halaman unduhan. | P0 |

**Arsitektur:** unggah langsung dari browser ke *object storage* melalui *presigned URL* (mis. Cloudflare R2 atau Supabase Storage); metadata & masa berlaku di database kecil; *cron/scheduled job* membersihkan file kedaluwarsa.

**Pengamanan & penyalahgunaan:**
- Rate limiting per IP dan Turnstile/hCaptcha ringan.
- Blokir tipe file berbahaya (`.exe`, `.bat`, `.scr`, dll.) atau beri peringatan.
- Pemindaian malware opsional (v1.1+) dan mekanisme takedown dari laporan.
- Syarat penggunaan jelas: dilarang untuk konten ilegal/melanggar hak cipta.
- Tidak mencatat isi file; log minimal dan dihapus berkala.

> **Penting:** dari semua fitur, ini yang paling berisiko disalahgunakan dan menimbulkan biaya. Mulai dengan kuota kecil dan pantau.

### 7.7 Generator (.md, JSON, dan lainnya)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-GEN-01 | **Markdown editor** split view dengan pratinjau GFM (tabel, task list, code block + syntax highlight). | P0 |
| FR-GEN-02 | **README generator:** form (nama proyek, deskripsi, fitur, instalasi, lisensi, badge) → keluaran `.md`. | P0 |
| FR-GEN-03 | Unduh `.md` dan salin ke clipboard. | P0 |
| FR-GEN-04 | **JSON formatter/validator:** *pretty print*, *minify*, tampilkan error + posisi baris. | P0 |
| FR-GEN-05 | **JSON ↔ CSV / YAML** konversi sederhana. | P1 |
| FR-GEN-06 | **`.gitignore` generator** (pilih bahasa/framework) dan **LICENSE generator** (MIT, Apache-2.0, GPL-3.0, dll.). | P1 |
| FR-GEN-07 | Utilitas kecil: Base64, URL encode/decode, JWT decoder, UUID, timestamp converter. | P1 |
| FR-GEN-08 | Pembuat QR code (teks/URL, unduh PNG/SVG). | P1 |

## 8. Kebutuhan Non-Fungsional

| Area | Target |
|---|---|
| **Performa** | LCP < 2,5 s di 4G; JS awal halaman beranda < 150 KB (gzip); alat berat dimuat *lazy*. |
| **Responsif** | Nyaman mulai 360 px (HP) hingga layar lebar; alat tetap fungsional di HP (tata letak menyesuaikan). |
| **Aksesibilitas** | Sesuai WCAG 2.1 AA: kontras warna, navigasi keyboard, label ARIA, *focus ring* jelas. |
| **Privasi** | Alat client-side tidak mengirim isi file ke server; kebijakan privasi singkat dan mudah dipahami. |
| **Keamanan** | HTTPS, CSP ketat, sanitasi pratinjau Markdown (cegah XSS), validasi tipe & ukuran file di server. |
| **Ketersediaan** | Target 99,5% (mengandalkan CDN/edge hosting). |
| **Kompatibilitas** | Chrome, Edge, Firefox, Safari (2 versi terakhir), Android Chrome, iOS Safari. |
| **Offline** | v2: PWA agar alat client-side bisa dipakai tanpa internet. |
| **Analitik** | Privacy-friendly (mis. Plausible/Umami), tanpa cookie pelacak. |
| **SEO** | Satu halaman per alat dengan judul, deskripsi, dan *structured data*; target kata kunci Indonesia ("gabung pdf online", "ganti background pas foto"). |

## 9. Arsitektur & Teknologi (Rekomendasi)

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | SSR/SSG untuk SEO, ekosistem besar, mudah dipelajari mahasiswa |
| Styling | **Tailwind CSS** + komponen bergaya shadcn/ui | Cepat, konsisten, mudah memakai design token |
| Draw | `@excalidraw/excalidraw` | Alat siap pakai (MIT) |
| Diagram | `mermaid` + embed diagrams.net | Teks→diagram + opsi visual |
| PDF | `pdf-lib`, `pdfjs-dist`, Web Worker | Proses lokal |
| Hapus background | `@imgly/background-removal` (ONNX/WASM) | Berjalan di browser |
| Markdown | `react-markdown` / `marked` + `DOMPurify` + `highlight.js` | Pratinjau aman |
| Editor kode | CodeMirror 6 | Ringan dan modular |
| Kirim file | Cloudflare R2 (atau Supabase Storage) + Workers/Edge Functions + D1/Postgres | Egress murah, presigned upload |
| Hosting | Vercel atau Cloudflare Pages | Tier gratis memadai untuk MVP |
| Analitik | Plausible / Umami | Privasi |

**Struktur modul alat (konvensi):**
```
/app
  /tools/[slug]/page.tsx     ← halaman alat (SEO)
/features
  /draw  /diagram  /pdf  /photo  /share  /generator
    ├─ components/
    ├─ lib/ (logika murni, mudah diuji)
    └─ meta.ts (nama, slug, ikon, kategori, sinonim pencarian)
```
Katalog beranda dibangun otomatis dari `meta.ts` setiap alat, sehingga menambah alat baru tidak mengubah kode beranda.

## 10. Alur Pengguna Utama

**Ganti background pas foto**
1. Beranda → *Pas Foto* → unggah foto
2. Model memuat (progres) → background terhapus otomatis
3. Pilih warna (merah/biru) & ukuran (3×4)
4. Atur posisi wajah dengan panduan
5. Unduh PNG / lembar cetak

**Kirim file**
1. *Kirim File* → seret berkas
2. Pilih masa berlaku (+ opsi sandi)
3. Unggah → link + QR muncul
4. Salin & bagikan → penerima membuka halaman unduhan

## 11. Metrik Keberhasilan

| Metrik | Target 3 bulan pertama |
|---|---|
| Pengguna aktif bulanan | 2.000+ (organik dari kampus & komunitas) |
| Tingkat penyelesaian tugas alat (hasil diunduh/disalin) | ≥ 60% |
| Alat dipakai per sesi | ≥ 1,5 |
| LCP rata-rata | < 2,5 s |
| Laporan penyalahgunaan yang tertangani < 24 jam | 100% |
| Skor kepuasan (survei 1 pertanyaan) | ≥ 4/5 |

## 12. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Penyalahgunaan layanan kirim file | Hukum, biaya | Batas ukuran/kedaluwarsa, rate limit, laporan, ToS, mulai dengan kuota kecil |
| Biaya storage/bandwidth membengkak | Operasional | R2 (tanpa biaya egress), batas harian, hapus otomatis |
| Model hapus background berat di HP lama | UX buruk | Indikator progres, cache model, opsi resolusi lebih rendah |
| Kompres PDF di klien kurang optimal | Ekspektasi tidak terpenuhi | Jujur soal batasan; pertimbangkan *server fallback* opsional di v1.1 |
| Lisensi pustaka pihak ketiga | Hukum | Audit lisensi; patuhi atribusi (Excalidraw MIT, Mermaid MIT, draw.io Apache-2.0) |
| Menyerupai produk lain (merek dagang) | Hukum | Nama, logo, dan UI orisinal; tidak memakai nama/merek iLovePDF, Excalidraw, draw.io sebagai merek Toolsman |
| Scope terlalu luas untuk tim kecil | Jadwal molor | Disiplin MVP; satu alat selesai dulu sebelum lanjut |

## 13. Rencana Rilis (Sprint 2 Minggu)

| Sprint | Fokus |
|---|---|
| S1 | Setup proyek, design system, layout, beranda + pencarian, dark mode |
| S2 | Generator: Markdown editor, README, JSON formatter |
| S3 | PDF: merge, split, image→PDF |
| S4 | Draw (Excalidraw) + Diagram (Mermaid) |
| S5 | Pas Foto + (opsional) kompres PDF |
| S6 | Kirim File + pengamanan, uji beban kecil |
| S7 | QA, aksesibilitas, SEO, beta bersama teman kampus |

## 14. Pertanyaan Terbuka

1. Apakah batas 100 MB per file untuk Kirim File sudah sesuai dengan anggaran hosting?
2. Apakah perlu akun opsional (login Google/GitHub) sejak v1, atau tunggu v2?
3. Apakah Toolsman akan open-source di GitHub (berpotensi menarik kontributor dari kampus)?
4. Domain yang diinginkan (mis. `toolsman.id`, `toolsman.app`)?
5. Apakah ada kebutuhan kolaborasi real-time pada Draw di tahap awal?

## 15. Lampiran — Ringkasan Prioritas

- **Harus ada (P0):** Katalog + pencarian, Draw, Mermaid, PDF merge/split/kompres/gambar→PDF, Pas Foto, Kirim File, Markdown/README, JSON formatter
- **Segera menyusul (P1):** draw.io embed, PDF→gambar, `.gitignore`/LICENSE, Base64/JWT/Regex/Diff, QR code, password & one-time link
- **Nanti (P2):** akun, PWA, kolaborasi, code-to-image, mock data, cron builder