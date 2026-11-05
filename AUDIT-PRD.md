# Audit PRD Toolsman

Tanggal audit: 4 November 2026
Acuan: `PRD.md` v1.0 dan `design.md`
Cakupan: status implementasi, bukti uji, celah, dan pekerjaan lanjutan.

## Ringkasan

- Enam modul MVP P0 sudah bisa dipakai.
- Kelompok 1 (keamanan, sitemap, SEO dasar, halaman legal, Turnstile) selesai dan teruji.
- Kelompok 2 (celah P0) selesai dan teruji, kecuali FR-SHARE-07 yang sengaja dicatat sebagai pekerjaan v1.1.
- P1 yang belum: PDF ke gambar, putar/hapus halaman, embed draw.io, generator .gitignore/LICENSE, utilitas tambahan, lembar cetak pas foto, feather/kecerahan, favorit/alat terakhir, QR terpisah.
- P2 dan v2 belum dikerjakan.
- Keputusan terbuka: lisensi AGPL `@imgly/background-removal`, pengecualian CSP `'unsafe-eval'`, aset `og:image`, domain final, dan temuan `npm audit`.

## Status P0

| Modul | Status | Catatan |
|---|---|---|
| Landing dan katalog | Sesuai | 6 alat, kategori, pencarian `/` dan `Ctrl+K`, tema terang/gelap |
| Draw | Sesuai | Excalidraw, autosave localStorage, ekspor PNG/SVG/.excalidraw, impor lewat menu bawaan Excalidraw |
| Diagram | Sesuai | 6 template, split view, tab Kode/Pratinjau di bawah 768 px, ekspor PNG/SVG, salin kode, penanda error baris, draf localStorage |
| PDF | Sesuai | Gabung dengan drag-and-drop dan tombol ▲ ▼, pisah, kompres 3 tingkat, gambar ke PDF, semua di browser |
| Pas Foto | Sesuai | Unggah atau kamera, hapus latar di browser, 4 warna, 3 ukuran 300 DPI, guide dan zoom, ekspor PNG/JPG |
| Kirim File | Sesuai | Link 128-bit, QR, 1 jam/24 jam/7 hari, sandi, sekali unduh per berkas, laporan, rate limit, blokir ekstensi, Turnstile, cron pembersih |
| Generator | Sesuai | Markdown GFM dengan highlight dan DOMPurify, README plus badge, JSON formatter/validator |

Catatan FR-SHARE-07: unggahan yang gagal diulang dari awal per berkas, bukan multipart atau resumable per byte. UI sudah menyatakan ini dan menyarankan koneksi stabil atau memecah berkas besar. Pekerjaan resumable dicatat untuk v1.1.

## Status P1

| Kebutuhan | Status |
|---|---|
| PDF ke gambar | Belum |
| Putar dan hapus halaman PDF | Belum |
| Embed draw.io di dalam halaman | Belum, sekarang masih tautan keluar |
| Generator .gitignore dan LICENSE | Belum |
| Utilitas Base64/URL/JWT/UUID/timestamp/QR | Belum, termasuk kategori Utilitas |
| Regex tester dan diff checker | Belum |
| Lembar cetak pas foto 4R/A4 | Belum |
| Feather tepi dan kecerahan pas foto | Belum |
| Favorit dan alat terakhir | Belum |
| QR generator terpisah | Belum, QR baru ada di Kirim File |
| Kecepatan unggah ulang per byte | Belum, lihat FR-SHARE-07 |

## Status P2 dan v2

Belum dikerjakan: bahasa Inggris, PWA offline, akun opsional, berbagi sesi Draw/Diagram, code-to-image, mock data generator, cron builder, color palette checker.

## Status non-fungsional

| Area | Status | Catatan |
|---|---|---|
| Performa | Sebagian | JS eksternal beranda sekitar 1,1 KB gzip, alat berat lazy. LCP 4G belum diukur. Uji 5 PDF 20 MB belum dilakukan. |
| Responsif | Sebagian | 360/768/1280 untuk halaman utama, halaman unduh, dan Diagram sudah diuji. Audit semua alat ada di Kelompok 4. |
| Aksesibilitas | Sebagian | Target 44 px, fokus, dan keyboard sudah spot-check. Audit kontras dan WCAG semua alat ada di Kelompok 4. |
| Privasi | Sesuai | Alat client-side tidak mengunggah isi berkas. Kirim File memakai server dan menjelaskannya. Tidak ada akun, cookie pelacak, atau iklan. |
| Keamanan | Sebagian | HTTPS, CSP, HSTS, XCTO, Referrer-Policy, Permissions-Policy, frame-ancestors, sanitasi Markdown, validasi server. CSP memakai pengecualian `'unsafe-eval'` untuk ONNX. |
| SEO | Sesuai | Judul, deskripsi, canonical, JSON-LD WebSite/SoftwareApplication, Open Graph per halaman, sitemap dan robots. `og:image` belum ada. |
| Analitik | Belum | Direncanakan di Kelompok 4. |
| Kompatibilitas | Belum | Baru diuji di Chrome. Firefox/Safari belum. |
| Ketersediaan | Tidak diukur | Bergantung pada Cloudflare. |

## Kelompok 1 yang sudah selesai

- Header keamanan global untuk halaman statis (`public/_headers`) dan rute on-demand (`src/middleware.ts`).
- CSP tanpa `script-src 'unsafe-inline'`. Pengecualian tertulis: `'wasm-unsafe-eval'`, `'unsafe-eval'`, dan `blob:` untuk ONNX Runtime Web.
- Font Excalidraw di-self-host dan fallback esm.sh dibuang lewat shim `FontFace`.
- `/sitemap.xml` dibuat dari katalog, `/robots.txt` memuat `Sitemap:` dan memblokir `/s/` serta `/api/`.
- JSON-LD WebSite di beranda, SoftwareApplication di halaman alat, canonical, `og:url`, `og:site_name`, `og:locale`, `og:type`.
- Halaman `/privasi/`, `/syarat/`, `/lisensi/`, dan perbaikan copy "tahap 1" yang sudah tidak benar.
- Turnstile di Kirim File, diverifikasi di server. Site key dibaca saat build, secret disimpan sebagai secret Worker.
- Permissions-Policy: `camera=()` di semua halaman, `camera=(self)` hanya di `/tools/pas-foto/` yang dirender on-demand.

## Kelompok 2 yang sudah selesai

- Gabung PDF: urutan bisa diubah dengan drag-and-drop, tombol ▲ ▼ tetap ada untuk keyboard dan HP.
- Diagram: di bawah 768 px, panel Kode dan Pratinjau memakai tab. Di layar lebar tetap split view.
- Pas Foto: tombol Ambil dari kamera memakai `getUserMedia`, pratinjau video, ambil foto, lalu proses yang sama seperti unggah. Kalau izin ditolak atau kamera tidak ada, pesan menjelaskan dan unggah file tetap tersedia.
- Kirim File: teks jujur bahwa unggahan gagal diulang dari awal per berkas, plus saran untuk berkas besar.

## Bukti uji terakhir

- `npm test`: 120 lulus.
- `npm run check`: 0 error.
- `npm run build`: sukses.
- Header, sitemap, robots, halaman legal, JSON-LD, dan CSP diuji lewat server hasil build.
- Turnstile diuji dengan test key resmi Cloudflare: tanpa token ditolak, token diterima.
- CSP semua alat: 0 violation setelah font self-host dan pengecualian ONNX.
- PDF merge, split, kompres, gambar ke PDF; Diagram render; Draw mount; Pas Foto model dan unduhan; semuanya diuji di browser.

## Pekerjaan v1.1 dan keputusan

1. FR-SHARE-07: multipart atau resumable per byte, supaya berkas besar tidak diulang dari awal.
2. Ganti `@imgly/background-removal` atau penuhi kewajiban AGPL-3.0.
3. Kalau Pas Foto diganti dengan pustaka tanpa `eval`, hapus `'unsafe-eval'` dari CSP.
4. Tambah `og:image` setelah ada aset merek.
5. Tetapkan domain final dan `PUBLIC_SITE_URL`.
6. Putuskan temuan `npm audit` (lihat README).
7. P1 yang belum dikerjakan pada tabel di atas.
