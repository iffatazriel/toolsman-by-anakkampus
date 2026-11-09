# Toolsman

Kotak perkakas gratis untuk mahasiswa informatika dan developer pemula: kanvas gambar, diagram, olah PDF, pas foto, kirim file, generator teks, utilitas, QR code, kompres gambar, cek warna, data uji, dan bank prompt AI. Gratis, tanpa akun, dan sebagian besar file diproses di browser.

Proyek ini memakai Astro (bukan Next.js seperti di PRD bagian 9). `PRD.md` dan `design.md` tetap jadi acuan isi dan tampilan.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:4321
npm run check    # cek tipe dan diagnostik .astro, dipakai juga sebagai lint
npm test         # unit test logika (vitest)
npm run prompts:check  # validasi isi content/prompts/ (juga jalan di prebuild dan CI)
npm run build    # hasil di dist/client (statis) dan dist/server (Worker)
```

## Status

Semua alat MVP sudah terpasang dan bisa dipakai:

- Generator Teks: Markdown, README, JSON, konversi JSON/CSV/YAML, .gitignore, dan LICENSE dengan tab terpisah
- Olah PDF: gabung, pisah, kompres, gambar menjadi PDF, PDF menjadi gambar (PNG/JPG), serta putar dan hapus halaman, dijalankan di Web Worker
- Kanvas Gambar: Excalidraw yang dimuat lazy, simpan otomatis, tema mengikuti toggle situs, salin gambar ke clipboard, ekspor PNG/SVG/.excalidraw
- Diagram Mermaid: split view, template, penanda baris error, ekspor PNG/SVG, plus editor diagrams.net yang di-embed dan bisa mengunduh `.drawio`
- Pas Foto: hapus latar di browser, pilih warna, ukuran 2×3/3×4/4×6 pada 300 DPI, atur kecerahan dan penghalusan tepi, lalu susun lembar cetak 4R atau A4
- Utilitas Teks: Base64, URL encode/decode, JWT decoder, UUID, konverter timestamp, regex tester, dan diff checker
- QR Code: teks atau URL ke PNG/SVG dengan pilihan ukuran, koreksi error, dan margin
- Kompres Gambar: perkecil ukuran, batasi dimensi, dan konversi ke JPG/PNG/WebP di browser
- Warna & Kontras: cek rasio WCAG AA/AAA dan buat palet turunan dari satu warna
- Data Palsu: data uji JSON/CSV dengan field, jumlah baris, dan seed yang bisa diulang
- Hash Teks & Berkas: SHA-256/512/384/1 untuk teks atau berkas, plus pembanding hash
- Toolkit Teks: ubah huruf, slug, nama variabel, lorem ipsum, dan hitung kata/karakter
- Hapus Metadata Foto: buang EXIF, GPS, XMP, dan komentar dari JPG/PNG tanpa mengompres ulang
- Cron Builder: ekspresi 5 field, 5 jadwal berikutnya per zona waktu, penjelasan Indonesia
- Kode ke Gambar: highlight.js, tema terang/gelap, padding dan sudut, ekspor PNG
- Validator JSON Schema: draft 4/7/2019-09/2020-12, error per path dalam bahasa Indonesia
- Bank Prompt: 30 prompt AI orisinal (belajar, laporan, menulis, kode, riset, karier), pencarian dan filter tersimpan di URL, form variabel dengan pratinjau langsung, salin atau unduh `.md`
- Berbagi sesi: link hanya-baca untuk Kanvas Gambar dan Diagram, data terkompresi di URL tanpa server. Batas token 7.000 karakter dan URL 8.000 karakter; sesi lebih besar ditolak dengan saran ekspor.
- Bilingual: toggle Indonesia/Inggris untuk shell, beranda, katalog, palette, dan metadata alat. Copy di dalam workspace alat masih Indonesia.
- Kirim File: unggah ke Cloudflare R2 lewat presigned URL, berkas di atas 8 MB diunggah per bagian dan bisa dilanjutkan, link berlaku 1 jam, 24 jam, atau 7 hari, bisa dikunci kata sandi dan dibatasi sekali unduh per berkas
- Favorit dan alat terakhir: disimpan di `localStorage` dan muncul sebagai rak di beranda

## Pas Foto dan model

Secara bawaan penghapus latar mengambil model dari CDN `staticimgly.com` (sekitar 120 MB sekali unduh). Kalau ingin model di-host sendiri:

```bash
npm run models:fetch
# lalu isi PUBLIC_IMGLY_PATH=/models/imgly/ di .env
```

Model masuk ke `public/models/imgly/` dan ikut tersalin ke `dist/client`, jadi ukuran deploy bertambah sekitar 120 MB. Tanpa langkah ini alat tetap jalan, hanya modelnya diambil dari CDN.

## Kirim File: yang perlu diisi

Alur unggah memakai Cloudflare R2 (penyimpanan berkas), D1 (metadata link), dan satu Worker cron untuk menghapus berkas kedaluwarsa.

1. Buat bucket R2 dan database D1:

   ```bash
   npx wrangler r2 bucket create toolsman-files
   npx wrangler d1 create toolsman-shares
   ```

2. Kedua berkas wrangler (`wrangler.jsonc` dan `workers/cleanup/wrangler.jsonc`) sudah memuat `database_id` untuk database `toolsman-shares`. Kalau kamu membuat database baru, ganti `database_id` di kedua tempat itu.

3. Terapkan skema:

   ```bash
   npx wrangler d1 migrations apply toolsman-shares --remote
   ```

4. Isi variabel berikut sebagai secret Worker utama **dan** Worker cleanup: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`. Lihat `.env.example`.

   ```bash
   npx wrangler secret put R2_ACCOUNT_ID
   ```

5. Build dan deploy Worker utama. Pakai konfigurasi hasil build karena adapter menambahkan binding `SESSION` dan entry `entry.mjs` di sana:

   ```bash
   npm run build
   npx wrangler deploy --config dist/server/wrangler.json
   ```

6. Deploy Worker pembersih:

   ```bash
   cd workers/cleanup
   npx wrangler deploy
   ```

`wrangler.jsonc` di akar proyek adalah sumber binding yang dibaca saat build. Binding yang dipakai:

| Binding | Jenis | Isi |
|---|---|---|
| `DB` | D1 | metadata link dan laporan |
| `UPLOAD_LIMIT` | Rate limit | 10 unggahan per 60 detik per IP |
| `REPORT_LIMIT` | Rate limit | 5 laporan per 60 detik per IP |
| `PASSWORD_LIMIT` | Rate limit | 10 percobaan kata sandi per 60 detik, dihitung per IP dan per link |
| `ASSETS` | Aset statis | `dist/client` |

Catatan: `namespace_id` pada rate limit masih angka contoh (`1001`, `1002`, `1003`). Ganti dengan angka unik milikmu. Worker terpisah dipakai untuk cron karena entry adapter hanya mengekspor `fetch`, bukan `scheduled`.

### Header keamanan dan CSP

Header dipasang di dua tempat:

- `public/_headers` untuk halaman dan aset statis yang dilayani langsung oleh asset Worker.
- `src/middleware.ts` untuk rute on-demand (`/s/[id]` dan `/api/*`).

CSP final ada di `src/lib/security-headers.ts`, dan `public/_headers` harus memuat nilai yang sama. `src/lib/security-headers.test.ts` menjaga keduanya tidak berbeda.

Yang perlu dilonggarkan dan alasannya:

- CSP dasar **tidak** memakai `'unsafe-eval'`. `'wasm-unsafe-eval'` dan `blob:` tetap ada untuk WASM dan modul perekat ONNX.
- `'unsafe-eval'` hanya dipasang di `/tools/pas-foto` lewat `securityHeadersFor`. ONNX Runtime Web di `@imgly/background-removal` mengevaluasi string JavaScript saat menyiapkan WASM. Rute lain memakai CSP dasar.
- `style-src 'unsafe-inline'`: Excalidraw dan Mermaid menyuntikkan `<style>` dan style attribute saat runtime.
- `connect-src` mengizinkan `*.r2.cloudflarestorage.com` untuk presigned URL, `staticimgly.com` untuk model, `challenges.cloudflare.com` untuk Turnstile, dan `plausible.io` untuk analitik.
- `frame-src` mengizinkan Turnstile dan `embed.diagrams.net`.

Penting saat build: jangan menjalankan `npm run build` dengan `NODE_ENV=development`. Astro akan menganggap build sebagai mode dev dan membuang middleware header. Build dengan `NODE_ENV` tidak diisi (atau `production`), lalu pastikan `dist/server/virtual_astro_middleware.mjs` memuat `securityHeadersFor` sebelum deploy.

Font Excalidraw disalin ke `public/excalidraw/fonts` oleh `npm run build` (prebuild) atau `npm run dev` (predev), dan `public/theme-init.js` menetapkan `window.EXCALIDRAW_ASSET_PATH = '/excalidraw/'` sebelum modul Excalidraw dimuat. Jadi font tidak diambil dari esm.sh.

Kalau Pas Foto diganti dengan pustaka tanpa `eval`, hapus `'unsafe-eval'` dari CSP dan jalankan ulang uji browser.

### Turnstile di Kirim File

1. Buka Cloudflare Dashboard, menu Turnstile, lalu Add site. Isi hostname `toolsman.anakkampus.workers.dev` atau domain final.
2. Salin **Site Key** ke `PUBLIC_TURNSTILE_SITE_KEY` di berkas `.env` (bukan hanya variabel terminal). Nilai ini dibaca saat `npm run build`, jadi build ulang setelah mengubahnya. Build berhenti dengan pesan jelas kalau nilainya kosong.
3. Simpan **Secret Key** sebagai secret Worker:

   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```

4. Deploy ulang. Rute unggah membalas 503 kalau secret belum diatur, dan menolak permintaan tanpa token yang valid. Tidak ada jalur yang melewati verifikasi diam-diam.
5. Untuk pengembangan lokal, isi pasangan kunci uji resmi Cloudflare di `.env` dan `.dev.vars` seperti dijelaskan di `SETUP.md`.


### Keamanan kata sandi link

- Kata sandi tidak disimpan sebagai teks. Yang masuk D1 hanya hash PBKDF2-SHA256, 100.000 iterasi, salt acak 16 byte, panjang kunci 256 bit, dengan format `pbkdf2$iterasi$salt$hash`.
- Perbandingan hash memakai akumulasi XOR per byte, bukan perbandingan string biasa.
- Percobaan kata sandi dibatasi `PASSWORD_LIMIT`: 10 kali per 60 detik untuk tiap IP dan tiap link. Batas ini dicek sebelum hashing, baik di halaman unduh maupun di endpoint unduh.
- Catatan: OWASP 2023 menyarankan 600.000 iterasi untuk PBKDF2-SHA256. Nilai 100.000 dipilih agar tetap murah di Cloudflare Workers; naikkan `ITERATIONS` di `src/features/kirim-file/password.ts` kalau mau lebih ketat. Hash lama tetap bisa diverifikasi karena jumlah iterasinya ikut tersimpan.

### Berkas besar dan resume

Berkas sampai 8 MB memakai satu presigned PUT. Di atas 8 MB, browser memotong berkas
menjadi bagian 8 MB dan mengirim tiap bagian ke Worker
(`/api/shares/:id/multipart/part`). Worker meneruskannya ke R2 dengan SigV4, jadi tidak
perlu mengatur CORS R2 atau mengekspos ETag ke browser.

- ETag tiap bagian disimpan di tabel `upload_parts`, bersama `upload_id` di `share_files`
  (migrasi `0005_multipart.sql`).
- Kalau koneksi putus, bagian yang gagal diulang sampai dua kali. Kalau masih gagal,
  tombol **Ulangi unggahan** memakai sesi yang sama dan melewati bagian yang sudah selesai.
- Tombol **Batalkan** menghentikan bagian yang sedang berjalan dan memanggil endpoint abort
  supaya bagian yang belum selesai tidak menumpuk di R2.
- Progres keseluruhan dan progres tiap berkas ditampilkan, termasuk "per bagian".

Konsekuensinya, berkas besar melewati Worker (bukan langsung browser ke R2). Ini disengaja
supaya resume tidak bergantung pada konfigurasi CORS bucket.

### Pembersihan otomatis

`workers/cleanup/` adalah Cron Trigger per jam (`0 * * * *`) yang menjalankan dua tugas:

1. `purgeExhaustedFiles`: menghapus objek R2 untuk berkas yang kuota unduhannya habis walaupun link induknya belum kedaluwarsa. Baris `share_files` ditandai `purged`, metadata nama berkas tetap ada supaya penerima melihat "sudah diunduh" dan nomor berkas tidak bergeser.
2. `removeExpiredShares`: menghapus semua objek R2 milik link kedaluwarsa, menghapus baris `share_files`, lalu menandai baris `shares` sebagai `deleted`.

Mengaktifkannya:

```bash
cd workers/cleanup
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_BUCKET
npx wrangler deploy
```

`workers/cleanup/wrangler.jsonc` sudah memuat cron dan binding `DB` dengan `database_id` yang sama seperti Worker utama.

## Langkah manual setelah kredensial siap

Jalankan berurutan dari akar proyek.

```bash
# 1. Ganti namespace rate limit di wrangler.jsonc kalau perlu
#    namespace_id: ganti 1001, 1002, 1003 dengan angka unik milikmu
#    database_id sudah terisi untuk toolsman-shares; tidak perlu diubah.
#    PUBLIC_SITE_URL dan PUBLIC_TURNSTILE_SITE_KEY dibaca saat build, bukan runtime.

# 2. Simpan kredensial R2 dan Turnstile sebagai secret Worker utama
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_BUCKET
npx wrangler secret put TURNSTILE_SECRET_KEY

# 3. Terapkan semua migrasi ke D1 produksi (0001 sampai 0007)
npx wrangler d1 migrations apply toolsman-shares --remote

# 4. Build dan deploy Worker utama
#    PUBLIC_* dibaca saat build. Isi kalau memakai Turnstile atau domain lain.
#    PowerShell:
#    $env:PUBLIC_SITE_URL="https://toolsman.anakkampus.workers.dev"
#    $env:PUBLIC_TURNSTILE_SITE_KEY="site-key-dari-dashboard"
npm run build
npx wrangler deploy --config dist/server/wrangler.json

# 5. Simpan secret yang sama untuk Worker pembersih, lalu deploy
cd workers/cleanup
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_BUCKET
npx wrangler deploy
```

Cek cepat setelah deploy:

```powershell
curl.exe -sI https://toolsman.anakkampus.workers.dev/ | Select-String -Pattern "content-security-policy|strict-transport|x-content-type|referrer-policy|permissions-policy|x-frame-options"
curl.exe -s https://toolsman.anakkampus.workers.dev/sitemap.xml
curl.exe -s https://toolsman.anakkampus.workers.dev/robots.txt
```

`/sitemap.xml` harus memuat semua halaman alat, dan `robots.txt` harus memuat baris `Sitemap:`.

Setelah deploy, uji alur nyata:

1. Buka `/tools/kirim-file`, unggah satu berkas kecil, pilih masa berlaku 1 jam, nyalakan "Kunci dengan kata sandi" dan isi sandi, lalu tekan Unggah dan buat link.
2. Buka link di jendela incognito. Pastikan daftar berkas tidak terlihat sebelum sandi dimasukkan, sandi salah menampilkan error, dan sandi benar menampilkan berkas.
3. Unduh berkas, lalu bandingkan hash dengan aslinya.
   ```bash
   certutil -hashfile "berkas-asli.pdf" SHA256
   certutil -hashfile "berkas-terunduh.pdf" SHA256
   ```
4. Ulangi dengan "Sekali unduh (per berkas)". Unduhan pertama harus berhasil, percobaan kedua harus dibalas 410.
5. Setelah cron berjalan (maksimal satu jam), pastikan objek R2 dan baris D1 hilang.
   ```bash
   npx wrangler tail toolsman-cleanup
   npx wrangler d1 execute toolsman-shares --remote --command "SELECT id, status, expires_at FROM shares ORDER BY created_at DESC LIMIT 5"
   npx wrangler d1 execute toolsman-shares --remote --command "SELECT share_id, name, downloads, purged FROM share_files LIMIT 10"
   ```
6. Untuk menguji pembersihan lebih cepat tanpa menunggu satu jam, buat link 1 jam, lalu set `expires_at` ke waktu lampau dan jalankan cron manual dari dashboard Cloudflare (Worker `toolsman-cleanup`, tombol Trigger Cron).
7. Uji multipart: unggah berkas > 8 MB, putuskan koneksi di tengah, lalu tekan **Ulangi unggahan**. Pastikan progres melanjutkan dari bagian terakhir (bukan 0%), dan tombol **Batalkan** tidak meninggalkan bagian yatim di R2.
8. Verifikasi CSP setelah deploy: `/tools/draw` harus tanpa `'unsafe-eval'`, sedangkan `/tools/pas-foto` harus memuat `'unsafe-eval'`.



## Kerentanan npm

`npm audit` sekarang melaporkan 7 temuan: 2 low, 2 moderate, 3 high. Sebelumnya 14.

Yang sudah diperbaiki tanpa lompat mayor (ada di `overrides` `package.json`):

- `lodash-es` 4.17.21 → 4.18.1. Menutup 7 temuan yang menular ke chevrotain, langium, @mermaid-js/parser, dan @excalidraw/mermaid-to-excalidraw.
- `nanoid` 3.3.3 di dalam `@excalidraw/excalidraw` → 3.3.20. Menutup salinan 3.x.

Tujuh temuan yang tersisa semuanya butuh keputusan karena perbaikannya lompat mayor atau menurunkan paket langsung:

| Paket | Severity | Perbaikan yang tersedia | Risiko |
|---|---|---|---|
| `@excalidraw/excalidraw` | moderate | turun ke 0.17.6 | breaking, fitur Excalidraw berubah |
| `@excalidraw/mermaid-to-excalidraw` | moderate | ikut downgrade Excalidraw | transitive |
| `@imgly/background-removal` | high | turun ke 1.1.5 | breaking, Pas Foto berisiko rusak |
| `katex` 0.16.47 (nested) | low | override ke 0.19.1 | 0.x minor dianggap breaking |
| `mermaid` 11.x (nested) | low | override ke 12.3.0 | lompat mayor dari `^11.12.1` |
| `nanoid` 4.0.2 (nested) | high | override ke 5.1.16 | lompat mayor |
| `zod` 3.x (nested di imgly) | high | override ke 4.6.7 | lompat mayor, paling berisiko |

Dampak praktisnya kecil: semua paket itu mengolah input pengguna sendiri di browser, bukan menerima masukan dari pihak lain. `npm audit fix --force` menurunkan `@excalidraw/excalidraw` ke 0.17.6 dan `@imgly/background-removal` ke 1.1.5, jadi belum dijalankan tanpa persetujuan. Pilihan paling aman jangka panjang adalah menunggu Excalidraw dan imgly memperbarui dependensinya.

## Lisensi

| Bagian | Lisensi |
|---|---|
| Kode (semua isi repo selain `content/prompts/`) | MIT, lihat `LICENSE` |
| Isi `content/prompts/` | CC0-1.0 atau CC-BY-4.0 per berkas, lihat field `lisensi` di tiap YAML |
| Dependensi pihak ketiga | ikut lisensinya masing-masing, lihat tabel di bawah |

Prompt sengaja tidak memakai MIT: CC0/CC-BY lebih pas untuk teks yang orang mau pakai ulang bebas. Panduan kontribusi prompt ada di `CONTRIBUTING-PROMPTS.md`.

### Lisensi dependensi

Dependensi runtime yang ikut terkirim ke browser:

| Paket | Lisensi | Kewajiban utama |
|---|---|---|
| Astro, @astrojs/*, React, React DOM | MIT | sertakan copyright dan izin |
| croner, @cfworker/json-schema | MIT | sertakan copyright dan izin |
| @excalidraw/excalidraw | MIT | sertakan copyright dan izin |
| Mermaid | MIT | sertakan copyright dan izin |
| marked, pdf-lib, qrcode, aws4fetch | MIT | sertakan copyright dan izin |
| yaml | ISC | sertakan copyright dan izin |
| pdfjs-dist | Apache-2.0 | sertakan LICENSE/NOTICE, klausul paten |
| DOMPurify | MPL-2.0 OR Apache-2.0 | pilih salah satu; Apache-2.0 paling sederhana |
| highlight.js | BSD-3-Clause | atribusi, tidak memakai nama kontributor untuk promosi |
| @fontsource-variable/inter, plus-jakarta-sans, jetbrains-mono | OFL-1.1 | sertakan OFL; jangan jual font sendiri atau ubah namanya |
| **@imgly/background-removal** | **AGPL-3.0** | **pengguna jaringan berhak atas source versi yang berjalan** |

Konsekuensi lisensi:

- Kode dirilis MIT. Semua dependensi kecuali `@imgly/background-removal` berlisensi permisif (MIT/ISC/Apache/BSD/OFL), jadi tidak ada benturan.
- `@imgly/background-removal` berlisensi AGPL-3.0 dan dipakai Pas Foto. AGPL §13 mewajibkan pengguna jaringan bisa mendapat source versi yang berjalan; repo ini publik dan memuat seluruh source, jadi kewajiban itu terpenuhi tanpa perlu mengubah lisensi proyek.
- Kalau nanti Pas Foto dijual, dipakai internal tanpa publikasi source, atau lisensi ini dipakai untuk produk komersial tertutup: ganti `@imgly/background-removal` dengan pustaka permisif (mis. MediaPipe Selfie Segmentation, Apache-2.0). Sampai saat itu, tidak ada yang perlu diubah.



## Struktur

```
src/
  features/<slug>/meta.ts   data alat: nama, kategori, tagline, sinonim, privasi, rencana
  features/<slug>/tool.astro  UI alat; dimuat hanya kalau status meta 'siap'
  lib/tools.ts              katalog dirakit otomatis dari semua meta.ts
  components/               layout dan komponen dasar
  pages/tools/[slug].astro  template halaman alat
  pages/tools/prompt/[id].astro  halaman detail prompt, dibuat per berkas YAML
  pages/prompts/             indeks dan JSON per prompt (prerender)
  pages/s/[id].astro        halaman unduh Kirim File (dirender di Worker)
  pages/api/shares/         endpoint unggah, info, selesai, dan laporan
  styles/global.css         token dan gaya komponen
content/prompts/<kategori>/<id>.yaml  isi Bank Prompt, satu berkas per prompt
scripts/prompts-check.mjs   validasi prompt (npm run prompts:check)
workers/cleanup/            Worker cron pembersih berkas kedaluwarsa
```

Menambah alat: buat `src/features/<slug>/meta.ts`, lalu halaman `/tools/<slug>/` muncul sendiri. Beranda tidak perlu diubah. Isi `status: 'siap'` dan sediakan `tool.astro` supaya UI-nya tampil.

Menambah prompt: taruh satu berkas YAML di `content/prompts/<kategori>/<id>.yaml`, lalu jalankan `npm run prompts:check`. Build berhenti kalau ada berkas yang tidak lolos skema, dengan pesan `berkas:baris`. Panduan lengkap ada di `CONTRIBUTING-PROMPTS.md`.

## Catatan desain

Alasan di balik keputusan yang tidak kelihatan dari kode:

- **Palet dari `design.md` bagian 3.** Netral hangat dengan satu aksen amber. Amber hanya dipakai untuk tombol utama, chip aktif, dan penanda fokus, supaya aksi utama langsung terbaca.
- **Warna kategori hanya di tile ikon dan label.** Enam warna kategori akan jadi noise kalau dipakai sebagai latar; di tile 12% warnanya menandai modul tanpa mengubah nada halaman.
- **Chip aktif memakai teks `--text`, bukan warna aksen.** Amber di atas krem hanya sekitar 2,4:1 dan gagal WCAG AA. Latar tetap `--accent-soft`.
- **`--text-faint` tidak dipakai untuk teks.** Nilainya sekitar 3:1 di permukaan terang, jadi tidak lolos AA. Untuk teks sekunder dipakai `--text-muted`.
- **Bayangan hanya di kartu saat hover dan di modal/palet.** Keduanya memang naik di atas halaman; elemen lain tetap datar.
- **Gerak sebatas hover dan transisi 120 sampai 200 ms.** Tidak ada animasi berulang, dan semuanya berhenti saat `prefers-reduced-motion`.
- **Tanpa gradient, glass, atau glow.** Tidak ada peran hierarki yang butuh salah satunya.
- **Logo masih wordmark teks dan favicon huruf T.** Aset logo asli ada di daftar design.md bagian 16, jadi yang dipakai sekarang penanda sementara, bukan logo final.
- **Delapan belas kartu alat.** "Landing & Katalog" di PRD adalah halaman ini sendiri, jadi katalog berisi alat saja. Kategori Utilitas ditambahkan setelah Generator mulai penuh; Cron, Kode ke Gambar, dan Validator JSON Schema menyusul di sana. Bank Prompt memakai kategori AI tersendiri dan menjadi kartu kedelapan belas.

## Catatan teknis

- Tailwind v4 lewat `@tailwindcss/vite`; token didefinisikan di `src/styles/global.css`.
- Tema memakai `light-dark()` dan `color-scheme`, jadi preferensi sistem jalan tanpa JavaScript. Toggle manual hanya mengubah `color-scheme` di `<html>`.
- `vite.css.postcss` sengaja diisi objek kosong. Ada `postcss.config.mjs` di luar folder proyek yang ikut terdeteksi Vite dan mematahkan build.
