# Audit PRD Toolsman

Tanggal audit: 4 November 2026
Diperbarui: 9 November 2026 (hardening Kirim File dan Kelompok 2/3)
Acuan: `PRD.md` v1.0 dan `design.md`
Cakupan: status implementasi, bukti uji, celah, dan pekerjaan lanjutan.

## Ringkasan

- Delapan belas alat sudah bisa dipakai: enam modul MVP P0, Utilitas Teks, QR Code, Kompres Gambar, Warna & Kontras, Data Palsu, Hash Teks & Berkas, Toolkit Teks, Hapus Metadata Foto, Cron Builder, Kode ke Gambar, Validator JSON Schema, dan Bank Prompt.
- Berbagi sesi Draw/Diagram lewat link hanya-baca selesai: payload gzip + Base64 URL, tanpa backend.
- Bahasa Indonesia/Inggris selesai untuk shell, beranda, katalog, palette, dan metadata 18 alat. Copy di dalam workspace alat masih Indonesia dan masuk tahap berikutnya.
- Kelompok 1 (keamanan, sitemap, SEO dasar, halaman legal, Turnstile) selesai dan teruji.
- Kelompok 2 (celah P0) selesai dan teruji. FR-SHARE-07 yang tadinya ditunda kini selesai di Kelompok 3.
- Kelompok 3 (P1) selesai pada 6 November 2026: PDF ke gambar, putar/hapus halaman, embed draw.io, generator .gitignore dan LICENSE, konversi JSON ↔ CSV/YAML, utilitas Base64/URL/JWT/UUID/timestamp, regex tester, diff checker, QR code terpisah, feather/kecerahan pas foto, lembar cetak 4R/A4, salin gambar ke clipboard, tema Excalidraw reaktif, favorit/alat terakhir, dan unggahan multipart resumable.
- CSP dasar tidak lagi memakai `'unsafe-eval'`; pengecualian hanya di rute Pas Foto lewat middleware.
- Tidak ada P1 yang tersisa. P2 dan v2 belum dikerjakan, kecuali Bank Prompt yang dikerjakan lebih awal di luar daftar P2 awal.
- Keputusan terbuka: lisensi AGPL `@imgly/background-removal`, pengecualian CSP `'unsafe-eval'`, aset `og:image`, domain final, dan temuan `npm audit`.
- Konfigurasi D1: `database_id` untuk `toolsman-shares` sudah terisi di `wrangler.jsonc` dan `workers/cleanup/wrangler.jsonc`, jadi tidak ada placeholder yang perlu diganti sebelum deploy.
- Turnstile produksi: site key sudah diisi di `.env.example` (nilai publik, aman di repo), sedangkan secret disimpan sebagai secret Worker dan tidak ditulis di dokumen mana pun. `npm run build` sekarang gagal kalau `PUBLIC_TURNSTILE_SITE_KEY` kosong, dan rute unggah membalas 503 kalau secret belum diatur.

## Hardening 9 November 2026

- Akses link dipusatkan di `shareAccess()`; rute `GET /api/shares/:id` yang
  membocorkan URL dihapus. Link berkata sandi, habis kuota, kedaluwarsa, dan
  di-takedown tidak pernah menghasilkan URL unduh.
- Unggahan mengikat `Content-Length` di presigned PUT, dan `complete` memeriksa
  ulang setiap objek dengan HeadObject sebelum menandai link siap.
- Kuota harian per IP (500 MB) dan global (20 GB) di tabel `upload_usage`.
- Turnstile tidak lagi punya jalur bypass; build gagal kalau site key kosong.
- Cron pembersih memproses antrean sampai habis dengan batas waktu, mencatat
  kegagalan per berkas, dan menghapus baris laporan.
- Unduhan selalu `application/octet-stream` + `Content-Disposition: attachment`.
- Blokir ekstensi diperluas dan mendeteksi ekstensi ganda serta karakter
  kontrol/RTL override.
- Webhook laporan opsional (`ABUSE_WEBHOOK_URL`), `GET /api/health`, dan
  `npm run takedown -- <id>` dengan halaman 410.
- Halaman Privasi dan Syarat diperbarui untuk retensi, IP, Turnstile, R2,
  pelaporan, dan takedown.



| Modul | Status | Catatan |
|---|---|---|
| Landing dan katalog | Sesuai | 18 alat, 8 kategori termasuk AI, pencarian `/` dan `Ctrl+K`, tema terang/gelap, rak favorit dan terakhir dipakai |
| Draw | Sesuai | Excalidraw, autosave localStorage, ekspor PNG/SVG/.excalidraw, impor lewat menu bawaan Excalidraw |
| Diagram | Sesuai | 6 template, split view, tab Kode/Pratinjau di bawah 768 px, ekspor PNG/SVG, salin kode, penanda error baris, draf localStorage |
| PDF | Sesuai | Gabung dengan drag-and-drop dan tombol ▲ ▼, pisah, kompres 3 tingkat, gambar ke PDF, PDF ke gambar, putar/hapus halaman, thumbnail dan status baca per berkas |
| Pas Foto | Sesuai | Unggah atau kamera dengan pratinjau langsung, hapus latar, 4 warna, 3 ukuran 300 DPI, guide, zoom, kecerahan, feather, ekspor PNG/JPG, lembar 4R/A4 |
| Kirim File | Sesuai | Link 128-bit, QR, 1 jam/24 jam/7 hari, sandi, sekali unduh per berkas, laporan, rate limit, blokir ekstensi, Turnstile, cron pembersih, unggah multipart resumable untuk berkas besar |
| Generator | Sesuai | Markdown GFM dengan highlight dan DOMPurify, README plus badge, JSON formatter/validator, konversi JSON/CSV/YAML, .gitignore, LICENSE, Utilitas, dan QR |
| Kanvas Gambar | Sesuai | Excalidraw lazy, autosave, tema reaktif, salin PNG ke clipboard, ekspor PNG/SVG/.excalidraw |

Catatan FR-SHARE-07: berkas di atas 8 MB diunggah per bagian lewat Worker, ETag disimpan di `upload_parts`, dan percobaan ulang melanjutkan dari bagian terakhir. Tombol Batalkan memanggil abort multipart. Migrasi `0005_multipart.sql` wajib diterapkan sebelum deploy.

## Status P1

| Kebutuhan | Status |
|---|---|
| PDF ke gambar | Selesai. PNG/JPG, 96/150/300 DPI, unduh per halaman atau semua |
| Putar dan hapus halaman PDF | Selesai. Putar 90° per halaman dan buang halaman sebelum disimpan |
| Embed draw.io di dalam halaman | Selesai. Dialog berisi iframe diagrams.net; Save & Exit mengunduh berkas `.drawio` |
| Generator .gitignore dan LICENSE | Selesai. Enam kelompok tumpukan, enam lisensi, teks resmi Apache dan GPL |
| Utilitas Base64/URL/JWT/UUID/timestamp | Selesai. Halaman `/tools/utilitas/` dengan lima tab |
| Konversi JSON ↔ CSV/YAML | Selesai. Tab Konversi di Generator, parser CSV sendiri, `yaml` 2.9.1 (ISC), 11 test |
| Salin gambar ke clipboard | Selesai. Tombol di Kanvas Gambar memakai Clipboard API, PNG dari Excalidraw |
| Tema gelap Excalidraw reaktif | Selesai. MutationObserver pada `data-theme` + listener preferensi sistem, tanpa reload |
| Regex tester dan diff checker | Selesai. Tab Regex dan Diff di Utilitas, highlight aman tanpa innerHTML, batas 500 kecocokan dan 800 baris |
| Lembar cetak pas foto 4R/A4 | Selesai. 4R dan A4 pada 300 DPI, jumlah foto dihitung otomatis |
| Feather tepi dan kecerahan pas foto | Selesai. Slider kecerahan dan penghalusan alpha, ikut ke ekspor dan lembar cetak |
| Favorit dan alat terakhir | Selesai. `localStorage`, tombol bintang di kartu dan halaman alat, rak Favorit dan Terakhir dipakai di beranda |
| QR generator terpisah | Selesai. Halaman `/tools/qr/`, PNG dan SVG |
| Kecepatan unggah ulang per byte | Selesai. Multipart 8 MB lewat Worker, ETag di D1, retry per bagian, abort, dan resume dari bagian terakhir |

## Tambahan setelah P1

| Alat | Status | Catatan |
|---|---|---|
| Kompres Gambar | Selesai | Resize, kompres, dan konversi JPG/PNG/WebP di browser, pratinjau sebelum/sesudah |
| Warna & Kontras | Selesai | Rasio WCAG AA/AAA untuk teks biasa dan besar, palet turunan 10 langkah |
| Data Palsu | Selesai | JSON/CSV, 1 sampai 200 baris, seed deterministik, 8 pilihan field |
| Hash Teks & Berkas | Selesai | SHA-256/512/384/1 untuk teks dan berkas sampai 50 MB, pembanding hash |
| Toolkit Teks | Selesai | Case converter, camel/snake/kebab, slug, lorem ipsum, statistik teks |
| Hapus Metadata Foto | Selesai | Strip EXIF/GPS/XMP/komentar JPG dan chunk teks PNG tanpa re-encode |
| Cron Builder | Selesai | 5 field standar lewat Croner, zona waktu pilihan, 5 jadwal berikutnya, penjelasan Indonesia |
| Kode ke Gambar | Selesai | highlight.js inti, 10 bahasa, tema terang/gelap, padding/radius, PNG 2× |
| Validator JSON Schema | Selesai | `@cfworker/json-schema` tanpa eval, draft 4/7/2019-09/2020-12, error per path |
| Bank Prompt | Selesai | 30 prompt orisinal di 6 kategori, pencarian + filter tersimpan di URL, form variabel, pratinjau, salin/unduh `.md`, favorit, validasi YAML saat build |
| Berbagi sesi Draw/Diagram | Selesai | Link `#sesi=` dengan gzip + Base64 URL, mode hanya-baca, tombol Buka sebagai draf |
| Bahasa Indonesia/Inggris | Selesai bertahap | Toggle bahasa, kamus shell/katalog/metadata, pencarian dan filter ikut bahasa |

## Status P2 dan v2

Belum dikerjakan: PWA offline, akun magic link, dan terjemahan copy workspace alat. Code-to-image, cron builder, color palette checker, mock data generator, berbagi sesi Draw/Diagram, i18n shell/katalog/metadata, serta Bank Prompt sudah selesai lebih awal di daftar tambahan.

### Bank Prompt (di luar P2 awal)

Bank Prompt dikerjakan lebih awal atas permintaan pemilik proyek dan tetap client-side penuh: tidak ada login, server baru, atau dependensi baru.

- **Isi:** 30 prompt orisinal, 5 per kategori (`belajar`, `laporan`, `menulis`, `kode`, `riset`, `karier`). Satu berkas YAML per prompt di `content/prompts/<kategori>/<id>.yaml`, lisensi CC0-1.0 atau CC-BY-4.0.
- **Validasi:** `npm run prompts:check` memeriksa skema lengkap, `id` sama dengan nama berkas, placeholder `{{nama}}` dua arah, batas panjang, tag dari daftar izin, lisensi, dan konten terlarang (tautan, email, nomor telepon, jailbreak, penghindaran plagiarisme). Pesan menyebut berkas dan baris. Skrip jalan di `predev`, `prebuild`, dan CI.
- **Keluaran build:** `/prompts/index.json` (indeks ringan tanpa badan prompt, 3,3 KB gzip) dan `/prompts/<id>.json` per prompt. Indeks hanya diminta halaman `/tools/prompt/`, tidak di beranda.
- **Halaman:** `/tools/prompt/` dengan pencarian (judul, tag, cuplikan; aksen dan kapital diabaikan), filter kategori/AI/level, chip favorit, muat bertahap 12 kartu, dan state kosong dengan saran. Filter disimpan di URL. `/tools/prompt/<id>/` dibuat lewat `getStaticPaths`, punya form variabel, pratinjau langsung dengan penanda variabel kosong, tombol Salin (toast "tersalin"), Unduh `.md`, catatan, dan JSON-LD `CreativeWork`.
- **Penyimpanan lokal:** `toolsman-prompt-favorites` dan `toolsman-prompt-recent`, terpisah dari favorit alat.
- **Privasi:** pencarian, filter, dan isian tetap di browser. Halaman hanya mengambil indeks statis dari Toolsman; tidak ada isian yang dikirim ke server atau ke layanan AI.
- **Kontribusi:** `CONTRIBUTING-PROMPTS.md`, template pull request prompt, dan workflow `.github/workflows/prompts-check.yml` yang jalan saat PR menyentuh `content/prompts/` atau skrip validasi.

### Akun magic link (v2, ditunda)

Ditunda atas keputusan pemilik proyek. Belum ada kode akun, token, atau sesi yang ditulis. Prasyarat sebelum pekerjaan dimulai:

- Domain pengirim terverifikasi di Resend (SPF dan DKIM), lalu `RESEND_API_KEY` serta `AUTH_FROM_EMAIL` disimpan sebagai secret Worker. Jangan pernah menaruh nilainya di repo.
- Halaman privasi diperbarui: email disimpan, token masuk, cookie sesi, masa simpan, dasar pemrosesan, dan cara menghapus akun.
- Rate limit per email dan per IP untuk endpoint kirim link, plus cooldown. Token sekali pakai disimpan sebagai hash di D1 dengan masa berlaku 15 menit.
- Sesi memakai cookie `HttpOnly`, `Secure`, `SameSite=Lax`, proteksi CSRF untuk POST, dan endpoint hapus akun.
- Uji end-to-end dengan email sungguhan sebelum ditandai "Siap dipakai". Tanpa domain dan kunci Resend, fitur tidak boleh dianggap selesai.

## Status non-fungsional

| Area | Status | Catatan |
|---|---|---|
| Performa | Sebagian | JS beranda 11,7 KB gzip (10 modul); indeks Bank Prompt 3,3 KB gzip dan hanya diminta halaman daftar; alat berat lazy. LCP 4G belum diukur. Uji 5 PDF 20 MB belum dilakukan. |
| Responsif | Sebagian | 360/768/1280 untuk halaman utama, halaman unduh, dan Diagram sudah diuji. Audit semua alat ada di Kelompok 4. |
| Aksesibilitas | Sebagian | Target 44 px, fokus, dan keyboard sudah spot-check. Audit kontras dan WCAG semua alat ada di Kelompok 4. |
| Privasi | Sesuai | Alat client-side tidak mengunggah isi berkas. Kirim File memakai server dan menjelaskannya. Tidak ada akun, cookie pelacak, atau iklan. |
| Keamanan | Sesuai | HTTPS, CSP, HSTS, XCTO, Referrer-Policy, Permissions-Policy, frame-ancestors, sanitasi Markdown, validasi server. CSP dasar tanpa `'unsafe-eval'`; pengecualian hanya di `/tools/pas-foto` untuk ONNX. |
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
- Kirim File: berkas > 8 MB memakai multipart; retry melanjutkan dari bagian terakhir, dan UI menjelaskan itu.

## Bukti uji terakhir

- `npm test`: 380 lulus di 48 berkas.
- `npm run check`: 0 error, 0 warning, 1 hint (`execCommand` deprecasi di clipboard).
- `npm run build`: sukses dalam mode production. Build sekarang berhenti dengan pesan jelas kalau `PUBLIC_TURNSTILE_SITE_KEY` kosong, jadi nilai itu wajib ada di `.env` atau environment build. Build dengan `NODE_ENV=development` membuang middleware header, jadi jangan dipakai untuk deploy.
- Header, sitemap, robots, halaman legal, JSON-LD, dan CSP diuji lewat server hasil build.
- Turnstile: tanpa secret, rute unggah membalas 503; token kosong atau ditolak Cloudflare juga ditolak. Tidak ada lagi jalur yang melewati verifikasi diam-diam. Kunci uji resmi Cloudflare dipakai di pengembangan lokal.
- CSP semua alat: 0 violation setelah font self-host dan pengecualian ONNX.
- PDF merge, split, kompres, gambar ke PDF; Diagram render; Draw mount; Pas Foto model dan unduhan; semuanya diuji di browser.

Uji browser 6 November 2026 memakai Chrome headless dan CDP pada hasil `npm run build`:

- Generator: `.gitignore` terisi dan tombol nonaktif saat kosong; MIT terisi nama pemilik; GPL memuat naskah resmi 35 KB.
- Utilitas: Base64, JWT (termasuk status kedaluwarsa), UUID, timestamp, URL encode, regex tester (1 kecocokan berhasil ditandai), dan diff checker (+2 −1 dengan baris berwarna).
- QR: status "256 px siap diunduh", spinner hilang, pratinjau PNG muncul, unduhan SVG memicu toast.
- Diagram: indikator "Memuat diagram…" hilang setelah SVG dirender, tanpa error.
- Beranda: 17 kartu alat, plus rak Favorit dan Terakhir dipakai. Bintang di kartu menyimpan ke `localStorage`, rak muncul, dan bintang di kartu rak bisa menghapus favorit.
- Kompres Gambar: gambar 1600 × 1200 diproses menjadi JPG 351 KB (jujur ditandai 11% lebih besar), WebP 311 KB, dan 88 KB setelah dibatasi 800 px (72% lebih kecil); pratinjau, statistik, dan tombol unduh aktif.
- Warna & Kontras: rasio awal 15.86:1 dengan semua badge lolos; `#777777` di latar terang turun ke 4.22:1 dan AA teks biasa berubah menjadi Gagal; tombol tukar dan salin HEX bekerja.
- Data Palsu: 10 baris JSON dengan 4 field default, header CSV `id,nama,email,kota`, seed berbeda mengubah data, keadaan kosong muncul saat semua field dilepas, dan 5 baris dengan satu field bekerja.
- Hash: berkas di-hash menjadi 64 karakter hex, SHA-256 `abc` sama dengan nilai rujukan, pembanding menampilkan badge Cocok, dan SHA-1 `abc` juga cocok dengan nilai rujukan.
- Toolkit Teks: statistik 22 karakter dan 4 kata, Title Case "Halo Dunia, Apa Kabar?", camelCase, slug, dan lorem 2 kalimat bekerja.
- Hapus Metadata Foto: JPEG uji mengandung "Exif" sebelum diproses dan tidak lagi setelahnya, 272 B metadata dibuang, pratinjau dan unduhan aktif.
- Cron Builder: `0 9 * * *` dijelaskan "setiap hari pukul 09.00", preset 15 menit menghasilkan 5 jadwal, UTC 16.00 vs WIB 23.00 pada waktu yang sama, ekspresi tidak valid menampilkan error lalu pulih. Lolos 360/768/1280 tanpa overflow, keyboard mencapai field, kontras body 15.86/16.18 dan hint 5.38/6.8.
- Kode ke Gambar: PNG 640 × 320 dengan latar terang rgb(250,248,245), tema gelap rgb(20,19,17), padding 64 menambah tinggi, kode Python ter-render, unduhan memicu toast. CSP dasar tetap aktif (inline script diblokir) dan tidak ada error konsol. Lolos 360/768/1280, keyboard, dan kontras.
- Validator JSON Schema: contoh menghasilkan 4 masalah dengan path `$.umur` dan properti `extra`; data valid menghasilkan badge Valid dan 0 masalah; JSON rusak menampilkan baris dan kolom. Badge kontras 7.38 terang / 5.45 gelap, tombol utama 6.42/9.1. Lolos 360/768/1280 dan keyboard.
- Berbagi sesi Diagram: link 167 karakter dibuka kembali dengan banner hanya-baca, textarea read-only, template nonaktif, SVG tetap dirender; Buka sebagai draf mengosongkan hash dan menyimpan draf.
- Berbagi sesi Draw: link 184 karakter, Excalidraw terbuka dalam mode hanya-baca dengan banner; Buka sebagai draf menghapus banner dan menyimpan scene ke localStorage. Data sesi gzip pulang-pergi lulus 10 unit test.
- Batas link sesi: token maksimal 7.000 karakter dan URL maksimal 8.000 karakter. Diagram 87.975 karakter ditolak dengan pesan "Diagram terlalu panjang untuk link (16.765 dari 7.000 karakter). Ringkas kode, lalu coba lagi." dan kotak link disembunyikan; link normal 167 karakter tetap dibuat. Link Draw terpotong (hash 7.500 karakter) menampilkan banner peringatan "Link sesi terpotong atau terlalu panjang..." dan memakai draf lokal; link valid 184 karakter tetap membuka mode hanya-baca tanpa peringatan. Empat unit test baru menguji batas token, batas URL, decode token panjang, dan sesi di bawah batas.
- Bahasa Inggris: toggle EN mengganti hero, chips (Images/Diagrams/Documents), hitungan "17 tools", nama kartu, palette, dan footer. Pilihan bertahan saat pindah ke `/tools/pdf/`; judul "PDF Tools", usage, status "Ready to use", dan privasi "On your device" ikut berubah. Pencarian "drawing" menemukan Drawing Canvas, chip Images menyaring 3 alat gambar. Lolos 360/768/1280 tanpa overflow, tombol bahasa 44×44, kontras 6.8 terang / 5.38 gelap, dan keyboard mencapai "Ganti bahasa".
- PDF: dua berkas diunggah, masing-masing menampilkan thumbnail halaman pertama dan "✓ Siap · 3/2 halaman"; tombol gabung dan pisah aktif setelah selesai dibaca; gabung menghasilkan toast sukses tanpa error.
- Generator konversi: JSON → CSV → JSON bolak-balik menghasilkan 2 objek; JSON → YAML memuat daftar; YAML → JSON kembali 2 objek tanpa error.
- Kanvas Gambar: tema berubah tanpa reload (kelas `theme--dark` mengikuti toggle), `getBlob('png')` menghasilkan PNG, dan tombol Salin gambar menulis ke clipboard dengan toast sukses.
- CSP: CSP dasar terbukti aktif karena inline script diblokir di halaman Draw; header `/tools/pas-foto` memuat `'unsafe-eval'`, dan model latar tetap berjalan sampai "✓ Latar dihapus".
- Pas Foto end-to-end dengan gambar asli: model latar selesai, kartu pratinjau menampilkan nama, ukuran, dan "✓ Latar dihapus", slider kecerahan/feather diterapkan, dan lembar 4R berisi 9 foto 3×4.
- Kirim File: berkas 9 MB dan gambar tampil sebagai kartu dengan thumbnail/ekstensi, ukuran, status "Siap diunggah", dan progress keseluruhan 0%; tombol hapus bekerja. Endpoint sesi mengembalikan 503 saat R2 belum dikonfigurasi, dan UI menampilkan pesan itu tanpa spinner menggantung.
- Layout 360 px: QR, Generator (tab wrap dua baris), dan Utilitas tidak meluber horizontal.

Uji browser 9 November 2026 untuk Bank Prompt (Chrome headless + CDP pada hasil `npm run build`, dengan header CSP produksi):

- Daftar: 12 kartu pertama dari 30, tombol "Muat 12 lagi" menambah 12, pencarian `cv` menyisakan 1 hasil, kata tanpa hasil memunculkan keadaan kosong dan 5 saran yang bisa diklik.
- Filter: chip kategori, select AI, dan select level masing-masing menulis URL; membuka ulang URL `?kategori=kode` mempertahankan chip aktif dan hasilnya; tombol hapus filter mengosongkan URL.
- Favorit: bintang menyimpan ke `toolsman-prompt-favorites` (bukan kunci favorit alat), chip Favorit menyaring ke 1 kartu.
- Detail: 3 kontrol sesuai tipe variabel, penanda `[nama]` untuk variabel kosong, hitungan "3 variabel masih kosong", catatan tersanitasi tanpa tag berbahaya, pengingat belajar muncul di kategori Belajar dan tidak muncul di Kode.
- Salin menyalin prompt akhir tanpa `{{`, toast "Prompt tersalin." (ID) / "Prompt copied." (EN), Unduh menghasilkan `soal-latihan-dari-materi.md`, dan `toolsman-prompt-recent` terpisah dari `toolsman-recent`.
- Bahasa: toggle EN mengganti label detail dan kartu daftar ("Study", "30 prompts").
- Tata letak: tanpa luapan horizontal di 360/768/1280, terang dan gelap; target sentuh ≥ 40 px; kontras semua elemen teks lolos AA (14 elemen daftar dan 12 elemen detail, kedua tema).
- CSP produksi: 0 pelanggaran di `/`, `/tools/prompt/`, dan dua halaman detail, termasuk saat mengetik dan menyalin.
- Jaringan: beranda tidak pernah meminta `/prompts/index.json` dan tidak ada permintaan ke domain luar; halaman daftar meminta satu kali.
- Tanpa JavaScript: daftar lengkap 30 tautan tetap tampil lewat `<noscript>`.
- Sitemap memuat 30 halaman detail plus halaman daftar (31 URL); JSON-LD halaman detail bertipe `CreativeWork` dengan lisensi dan penulis.
- `prompts:check` menolak placeholder yang tidak dideklarasikan dan variabel yang tidak dipakai, dengan berkas dan baris; `astro build` berhenti dengan pesan yang sama.
- Ukuran: JS beranda 11.391 → 11.698 B gzip (+307 B, batas 1 KB). Indeks prompt 10.993 B (3.296 B gzip) hanya diminta halaman daftar.

Batasan uji: jalur multipart ke R2 belum dijalankan end-to-end karena kredensial R2 tidak tersedia di mesin uji. Yang diuji adalah perencanaan bagian, XML complete, signature R2, alur UI, serta jalur error. Setelah migrasi `0005_multipart.sql` diterapkan dan secret R2 tersedia, uji manual yang disarankan: unggah berkas > 8 MB, putuskan koneksi di tengah, lalu tekan Ulangi dan pastikan bagian yang selesai tidak dikirim ulang.

## Audit dependensi

`npm audit` per 9 November 2026: **5 temuan** (0 low, 2 moderate, 3 high),
turun dari 7 temuan (2 low, 2 moderate, 3 high).

Sudah diperbaiki tanpa lompat mayor paket langsung:

- `lodash-es` 4.17.21 → 4.18.1 (menutup 7 temuan pada putaran sebelumnya).
- `nanoid` 3.3.3 di Excalidraw → 3.3.20.
- `katex` 0.16.47 (di dalam mermaid 11 milik Excalidraw) → 0.18.11 lewat
  `overrides`. Ini menutup temuan `katex` (low) dan `mermaid` (low), karena
  temuan mermaid hanya berasal dari katex. API `renderToString` yang dipakai
  mermaid tidak berubah; sudah diuji di browser: diagram dengan rumus
  `$$x^2 + y^2$$` tetap menghasilkan SVG dan elemen `.katex`.

`npm audit fix` tanpa `--force` tidak mengubah apa pun: semua sisa temuan
menuntut lompat mayor atau downgrade paket langsung. Tidak diterapkan tanpa
keputusan pemilik.

| Temuan | Severity | Perbaikan yang tersedia | Kenapa belum diterapkan |
|---|---|---|---|
| `nanoid` 4.0.2 (nested di mermaid-to-excalidraw) | high | override 5.1.16 | Lompat mayor. Kode hanya memanggil `nanoid()` tanpa argumen, jadi jalur rentan (ukuran non-integer/negatif/nol) tidak terpakai |
| `zod` 3.25.76 (nested di imgly) | high | override 4.6.7 | Zod 4 mengubah API; imgly memakai Zod 3. Risiko merusak Pas Foto |
| `@imgly/background-removal` | high | downgrade 1.1.5 | Downgrade menghilangkan fitur/perbaikan; Pas Foto berisiko |
| `@excalidraw/excalidraw` | moderate | downgrade 0.17.6 | Downgrade paket langsung, kehilangan fitur 0.18 |
| `@excalidraw/mermaid-to-excalidraw` | moderate | ikut downgrade Excalidraw | Transitive; ikut nasib Excalidraw |

Catatan reachability: temuan nanoid dan zod berasal dari pemakaian internal
pustaka (bukan input pengguna ke API berukuran), dan keduanya berjalan di
browser pengguna, bukan di server. Risiko praktis rendah, tetapi audit tetap
menandainya sampai versi mayor dinaikkan.

## Lisensi dependensi

Data diambil dari `node_modules/*/package.json` dan `npm ls --all` pada 9
November 2026. `LICENSE` belum dibuat atau diubah; keputusan lisensi proyek ada
di tangan pemilik.

### Dependensi langsung (runtime)

| Paket | Versi | Lisensi |
|---|---|---|
| astro | 7.4.5 | MIT |
| @astrojs/cloudflare | 14.4.4 | MIT |
| @astrojs/react | 7.1.2 | MIT |
| @cfworker/json-schema | 4.1.6 | MIT |
| @excalidraw/excalidraw | 0.18.1 | MIT |
| @fontsource-variable/inter | 5.3.0 | OFL-1.1 |
| @fontsource-variable/plus-jakarta-sans | 5.3.0 | OFL-1.1 |
| @fontsource/jetbrains-mono | 5.3.0 | OFL-1.1 |
| @imgly/background-removal | 1.7.0 | **AGPL-3.0** (lihat `LICENSE.md` paket) |
| aws4fetch | 1.0.20 | MIT |
| croner | 11.0.0 | MIT |
| dompurify | 3.4.17 | MPL-2.0 OR Apache-2.0 |
| highlight.js | 11.12.0 | BSD-3-Clause |
| marked | 18.1.3 | MIT |
| mermaid | 12.3.0 | MIT |
| pdf-lib | 1.17.1 | MIT |
| pdfjs-dist | 6.5.438 | Apache-2.0 |
| qrcode | 1.5.4 | MIT |
| react / react-dom | 18.3.1 | MIT |
| yaml | 2.9.1 | ISC |

### Dependensi pengembangan

| Paket | Versi | Lisensi |
|---|---|---|
| @astrojs/check | 0.9.12 | MIT |
| @tailwindcss/vite | 4.3.4 | MIT |
| @types/qrcode | 1.5.6 | MIT |
| tailwindcss | 4.3.4 | MIT |
| typescript | 5.9.3 | Apache-2.0 |
| vitest | 5.1.0 | MIT |

### Transitive yang perlu diperhatikan

Ringkasan `license-checker --production`: 406 MIT, 54 ISC, 27 Apache-2.0, 20
BSD-3-Clause, 8 BSD-2-Clause, 4 CC0-1.0, 3 OFL-1.1, 3 BlueOak-1.0.0, 2 MPL-2.0,
2 0BSD, dan sisanya MIT/Apache/BSD varian. Yang bukan permisif murni:

| Paket | Lisensi | Catatan |
|---|---|---|
| `@imgly/background-removal` | AGPL-3.0 | Dipakai langsung oleh Pas Foto, ikut ter-bundle ke browser |
| `elkjs` (lewat mermaid) | EPL-2.0 OR GPL-3.0-or-later | Pilih EPL-2.0: copyleft tingkat berkas, aman selama pustaka tidak dimodifikasi |
| `sharp` + `@img/sharp-win32-x64` | Apache-2.0, binari native LGPL-3.0-or-later | Hanya alat build/opsional Astro, tidak ikut ke bundel klien |
| `dompurify` | MPL-2.0 OR Apache-2.0 | Pilih Apache-2.0; jangan modifikasi berkas MPL tanpa mempublikasikan perubahannya |

### Konsekuensi pilihan lisensi proyek

**Opsi A — pertahankan imgly dan rilis proyek sebagai AGPL-3.0.**
AGPL mewajibkan source lengkap tersedia bagi siapa pun yang memakai layanan
lewat jaringan (pasal 13), termasuk modifikasi. Karena imgly di-bundle ke dalam
aplikasi browser, anggap seluruh aplikasi sebagai karya turunan: publikasikan
source, sertakan naskah AGPL dan notice, dan jangan menambahkan batasan yang
lebih ketat. Konsekuensi bisnis: kode bisa dipakai kembali oleh pihak lain
selama mereka juga AGPL. Ini pilihan paling murah dari sisi teknis, tetapi
mengubah posisi lisensi seluruh proyek.

**Opsi B — ganti imgly dengan pustaka permisif.**
Contoh: MediaPipe Selfie Segmentation / Tasks Vision (Apache-2.0). Lisensi
proyek tetap bebas ditentukan (mis. MIT). Biaya: integrasi ONNX diganti,
kualitas tepi rambut dan kecepatan perlu diuji ulang, model dan ukuran unduhan
berubah, dan Pas Foto harus diuji ulang di browser. Ini pilihan yang menjaga
kebebasan lisensi tanpa biaya lisensi komersial.

**Opsi C — lisensi komersial dari img.ly.**
README paket menyebut kontak `support@img.ly` untuk opsi lisensi lain. Proyek
bisa tetap tertutup, tetapi ada biaya dan syarat kontrak yang harus disepakati.
Cocok kalau fitur hapus latar adalah nilai jual utama.

**Opsi D — hapus fitur hapus latar.**
Paling sederhana secara hukum: buang dependensi AGPL, hapus alur Pas Foto yang
memakainya, dan lisensi proyek bebas. Konsekuensi: kehilangan salah satu fitur
Pas Foto.

**Opsi E — pisahkan imgly ke Worker/route terpisah dan tawarkan source-nya.**
Secara hukum ini abu-abu: AGPL tetap menempel pada karya gabungan yang
berkomunikasi erat, dan pemisahan teknis tidak otomatis menghindari AGPL.
Jangan dipilih tanpa pendapat ahli hukum.

Catatan untuk opsi apa pun: atribusi OFL-1.1 (font), Apache-2.0 (pdfjs-dist,
TypeScript), BSD-3-Clause (highlight.js), MPL-2.0 (DOMPurify), ISC (yaml), dan
EPL-2.0 (elkjs) tetap wajib dipertahankan. Halaman `/lisensi/` sudah memuat
sebagian besar atribusi itu.

## Langkah manual deploy

1. Terapkan migrasi D1: `npx wrangler d1 migrations apply toolsman-shares --remote` (termasuk `0005_multipart.sql`, `0006_upload_usage.sql`, dan `0007_share_takedown.sql`).
2. Pastikan `NODE_ENV` tidak bernilai `development`, lalu `npm run build`.
3. Cek `dist/server/virtual_astro_middleware.mjs` memuat `securityHeadersFor`; kalau tidak, middleware terbuang dan header keamanan tidak akan terpasang.
4. Isi secret R2 dan Turnstile, lalu deploy Worker utama: `npx wrangler deploy --config dist/server/wrangler.json`.
5. Deploy ulang Worker cleanup karena kini memanggil abort multipart: `cd workers/cleanup && npx wrangler deploy`.
6. Verifikasi header: `/tools/draw` tanpa `'unsafe-eval'`, `/tools/pas-foto` dengan `'unsafe-eval'`.
7. Uji multipart: unggah berkas > 8 MB, putuskan koneksi di tengah, tekan Ulangi, dan pastikan bagian yang selesai tidak dikirim ulang.
8. Buka konsol DevTools di setiap alat (18 rute) dan pastikan tidak ada pelanggaran CSP. Minimal periksa Draw, Diagram, Pas Foto, PDF, Generator, Kirim File, QR, Kompres Gambar, Warna, Data Palsu, Hash, Toolkit Teks, Hapus Metadata, Cron, Kode ke Gambar, JSON Schema, Bank Prompt, dan Utilitas.
9. Uji link hanya-baca: link normal harus terbuka, sesi sangat besar harus ditolak dengan pesan jelas, dan link yang terpotong harus menampilkan peringatan lalu memakai draf lokal.
10. Cek `/akun/` belum ada dan tidak ditautkan; akun magic link tetap ditunda sampai prasyarat v2 terpenuhi.

## Keputusan terbuka

| Keputusan | Status | Yang dibutuhkan |
|---|---|---|
| Lisensi AGPL | Terbuka | `@imgly/background-removal` berlisensi AGPL-3.0. Pilih: rilis proyek sebagai AGPL-3.0 dengan source tersedia untuk pengguna jaringan, atau ganti ke pustaka permisif seperti MediaPipe (Apache-2.0). `LICENSE` belum diubah. |
| Domain final | Terbuka | Tentukan domain, set `PUBLIC_SITE_URL`, lalu build ulang. Domain ini juga prasyarat verifikasi Resend kalau akun magic link dilanjutkan. |
| `og:image` | Terbuka | Butuh aset merek 1200×630 dan penempatan meta `og:image` per halaman. |
| Analitik | Terbuka | Pilih Plausible (tanpa cookie, `PUBLIC_PLAUSIBLE_DOMAIN`) atau tidak sama sekali. Perlu pembaruan halaman privasi sebelum diaktifkan. |
| `npm audit` | Terbuka | 7 temuan tersisa (2 low, 2 moderate, 3 high). Semua perbaikan butuh lompat mayor atau downgrade langsung; lihat tabel audit dependensi. |
| Multipart R2 | Terbuka | Jalankan uji end-to-end setelah kredensial R2 dan migrasi `0005_multipart.sql` tersedia. |
