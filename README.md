# Toolsman

Kotak perkakas gratis untuk mahasiswa informatika dan developer pemula. Rencananya: kanvas gambar, diagram, olah PDF, pas foto, kirim file, dan generator teks. Gratis, tanpa akun, dan sebagian besar file diproses di browser.

Proyek ini memakai Astro (bukan Next.js seperti di PRD bagian 9). `PRD.md` dan `design.md` tetap jadi acuan isi dan tampilan.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:4321
npm run check    # cek tipe dan diagnostik .astro, dipakai juga sebagai lint
npm test         # unit test logika (vitest)
npm run build    # hasil di dist/client (statis) dan dist/server (Worker)
```

## Status

Semua alat MVP sudah terpasang dan bisa dipakai:

- Generator Teks: Markdown, README, dan JSON dengan tab terpisah
- Olah PDF: gabung, pisah, kompres, dan gambar menjadi PDF, dijalankan di Web Worker
- Kanvas Gambar: Excalidraw yang dimuat lazy, simpan otomatis, ekspor PNG/SVG/.excalidraw
- Diagram Mermaid: split view, template, penanda baris error, ekspor PNG/SVG
- Pas Foto: hapus latar di browser, pilih warna, ukuran 2×3/3×4/4×6 pada 300 DPI
- Kirim File: unggah ke Cloudflare R2 lewat presigned URL, link berlaku 1 jam, 24 jam, atau 7 hari, bisa dikunci kata sandi dan dibatasi sekali unduh per berkas

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

2. Isi `database_id` hasil perintah D1 ke `wrangler.jsonc` dan `workers/cleanup/wrangler.jsonc` (sekarang masih `GANTI_DENGAN_ID_D1`).

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

- `script-src 'unsafe-eval'`: dibutuhkan backend ONNX Runtime Web di `@imgly/background-removal`. Runtime itu mengevaluasi string JavaScript saat menyiapkan WASM, jadi Pas Foto gagal tanpa izin ini. Ini pengecualian tertulis, bukan default. `'unsafe-inline'` tetap tidak dipakai di `script-src`.
- `script-src 'wasm-unsafe-eval'` dan `blob:`: WASM dan modul perekat ONNX dimuat dari blob URL.
- `style-src 'unsafe-inline'`: Excalidraw dan Mermaid menyuntikkan `<style>` dan style attribute saat runtime.
- `connect-src` mengizinkan `*.r2.cloudflarestorage.com` untuk presigned URL, `staticimgly.com` untuk model, `challenges.cloudflare.com` untuk Turnstile, dan `plausible.io` untuk analitik.
- `frame-src` mengizinkan Turnstile dan `embed.diagrams.net`.

Font Excalidraw disalin ke `public/excalidraw/fonts` oleh `npm run build` (prebuild) atau `npm run dev` (predev), dan `public/theme-init.js` menetapkan `window.EXCALIDRAW_ASSET_PATH = '/excalidraw/'` sebelum modul Excalidraw dimuat. Jadi font tidak diambil dari esm.sh.

Kalau Pas Foto diganti dengan pustaka tanpa `eval`, hapus `'unsafe-eval'` dari CSP dan jalankan ulang uji browser.

### Turnstile di Kirim File

1. Buka Cloudflare Dashboard, menu Turnstile, lalu Add site. Isi hostname `toolsman.anakkampus.workers.dev` atau domain final.
2. Salin **Site Key** ke `PUBLIC_TURNSTILE_SITE_KEY` di environment build. Nilai ini dibaca saat `npm run build`, jadi build ulang setelah mengubahnya.
3. Simpan **Secret Key** sebagai secret Worker:

   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```

4. Deploy ulang. Kalau hanya salah satu dari site key atau secret yang terisi, unggahan ditolak dengan pesan konfigurasi, bukan diloloskan diam-diam.
5. Saat pengembangan lokal tanpa kedua nilai itu, widget tidak dimuat dan verifikasi dilewati.


### Keamanan kata sandi link

- Kata sandi tidak disimpan sebagai teks. Yang masuk D1 hanya hash PBKDF2-SHA256, 100.000 iterasi, salt acak 16 byte, panjang kunci 256 bit, dengan format `pbkdf2$iterasi$salt$hash`.
- Perbandingan hash memakai akumulasi XOR per byte, bukan perbandingan string biasa.
- Percobaan kata sandi dibatasi `PASSWORD_LIMIT`: 10 kali per 60 detik untuk tiap IP dan tiap link. Batas ini dicek sebelum hashing, baik di halaman unduh maupun di endpoint unduh.
- Catatan: OWASP 2023 menyarankan 600.000 iterasi untuk PBKDF2-SHA256. Nilai 100.000 dipilih agar tetap murah di Cloudflare Workers; naikkan `ITERATIONS` di `src/features/kirim-file/password.ts` kalau mau lebih ketat. Hash lama tetap bisa diverifikasi karena jumlah iterasinya ikut tersimpan.

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

`workers/cleanup/wrangler.jsonc` sudah memuat cron dan binding `DB`. Ganti `database_id` di sana dengan ID D1 produksi.

## Langkah manual setelah kredensial siap

Jalankan berurutan dari akar proyek.

```bash
# 1. Isi ID D1 dan namespace rate limit di wrangler.jsonc dan workers/cleanup/wrangler.jsonc
#    database_id: hasil `npx wrangler d1 create toolsman-shares`
#    namespace_id: ganti 1001, 1002, 1003 dengan angka unik milikmu
#    PUBLIC_SITE_URL dan PUBLIC_TURNSTILE_SITE_KEY dibaca saat build, bukan runtime.

# 2. Simpan kredensial R2 dan Turnstile sebagai secret Worker utama
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_BUCKET
npx wrangler secret put TURNSTILE_SECRET_KEY

# 3. Terapkan semua migrasi ke D1 produksi (0001 sampai 0004)
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



## Kerentanan npm

`npm audit` melaporkan 14 temuan: 2 low, 1 moderate, 11 high. Semuanya berasal dari dependensi transitif tiga paket langsung:

- `@excalidraw/excalidraw` 0.18.1: nanoid 3.3.3 dan 4.0.2, katex 0.16.47 lewat Mermaid 11, serta rangkaian langium/chevrotain yang bergantung pada lodash-es 4.17.21.
- `@imgly/background-removal` 1.7.0: zod 3.25.76.
- `mermaid` 12.3.0: rantai katex dari paket Mermaid yang dibawa Excalidraw.

`npm audit fix` biasa tidak mengubah apa pun di proyek ini (`up to date`), jadi semua temuan hanya bisa ditutup dengan `--force` atau `overrides`. `npm audit fix --force` menurunkan `@excalidraw/excalidraw` ke 0.17.6 dan `@imgly/background-removal` ke 1.1.5, keduanya perubahan mayor yang berisiko mematahkan Kanvas Gambar dan Pas Foto, jadi belum dijalankan tanpa persetujuan.

Dampak praktisnya kecil: semua paket itu mengolah input pengguna sendiri di browser, bukan menerima masukan dari pihak lain. Kandidat perbaikan tanpa menurunkan paket langsung, semuanya butuh persetujuan karena mengubah pohon dependensi:

- `overrides` `lodash-es` ke 4.18.1: menutup lodash-es, chevrotain, langium, dan @mermaid-js/parser (7 temuan, masih satu mayor).
- `overrides` `nanoid` 3.x ke 3.3.20: menutup salinan 3.3.3 di Excalidraw. Salinan 4.0.2 butuh nanoid 5.1.16 (lompat mayor) atau pembaruan Excalidraw.
- `overrides` `katex` ke 0.18.10: menutup salinan Mermaid 11 di Excalidraw, tetapi lompat dari 0.16.
- `overrides` `zod` ke 4.6.6 di `@imgly/background-removal`: lompat mayor, paling berisiko.

Pilihan paling aman jangka panjang adalah menunggu Excalidraw dan imgly merilis versi yang memperbarui dependensinya.



## Struktur

```
src/
  features/<slug>/meta.ts   data alat: nama, kategori, tagline, sinonim, privasi, rencana
  features/<slug>/tool.astro  UI alat; dimuat hanya kalau status meta 'siap'
  lib/tools.ts              katalog dirakit otomatis dari semua meta.ts
  components/               layout dan komponen dasar
  pages/tools/[slug].astro  template halaman alat
  pages/s/[id].astro        halaman unduh Kirim File (dirender di Worker)
  pages/api/shares/         endpoint unggah, info, selesai, dan laporan
  styles/global.css         token dan gaya komponen
workers/cleanup/            Worker cron pembersih berkas kedaluwarsa
```

Menambah alat: buat `src/features/<slug>/meta.ts`, lalu halaman `/tools/<slug>/` muncul sendiri. Beranda tidak perlu diubah. Isi `status: 'siap'` dan sediakan `tool.astro` supaya UI-nya tampil.

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
- **Enam kartu alat, bukan tujuh.** "Landing & Katalog" di PRD adalah halaman ini sendiri, jadi katalog berisi enam modul alat.

## Catatan teknis

- Tailwind v4 lewat `@tailwindcss/vite`; token didefinisikan di `src/styles/global.css`.
- Tema memakai `light-dark()` dan `color-scheme`, jadi preferensi sistem jalan tanpa JavaScript. Toggle manual hanya mengubah `color-scheme` di `<html>`.
- `vite.css.postcss` sengaja diisi objek kosong. Ada `postcss.config.mjs` di luar folder proyek yang ikut terdeteksi Vite dan mematahkan build.
