# SETUP

Panduan singkat untuk menjalankan, membangun, dan merawat Toolsman.

## 1. Nilai build: taruh di `.env`

Astro membaca `PUBLIC_*` saat build. Simpan nilainya di berkas `.env` di akar
proyek, bukan hanya di variabel terminal. Variabel terminal hilang saat sesi
berakhir, dan build berikutnya akan memakai nilai kosong tanpa disadari.

Buat `.env`:

```dotenv
PUBLIC_SITE_URL=https://toolsman.anakkampus.workers.dev
PUBLIC_TURNSTILE_SITE_KEY=<site key Turnstile>
```

`.env` sudah masuk `.gitignore`. Jangan commit nilainya. `.env.example` hanya
contoh, bukan berkas yang dibaca Astro.

## 2. Turnstile

Turnstile melindungi Kirim File dari unggahan bot. Ada dua nilai:

| Nilai | Jenis | Tempat |
|---|---|---|
| `PUBLIC_TURNSTILE_SITE_KEY` | publik, dipakai browser | `.env`, dibaca saat build |
| `TURNSTILE_SECRET_KEY` | rahasia, dipakai Worker | secret Worker |

`npm run build` berhenti dengan pesan jelas kalau `PUBLIC_TURNSTILE_SITE_KEY`
kosong. Ini disengaja: build tanpa site key akan menampilkan situs tanpa
widget, dan rute unggah akan menolak semua permintaan karena server tidak bisa
memverifikasi token.

Untuk pengembangan lokal, isi pasangan kunci uji Cloudflare di `.env` dan
`.dev.vars`:

```dotenv
# .env
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA

# .dev.vars
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

Kunci uji selalu lolos. Jangan pakai kunci uji di produksi.

Set secret produksi:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
```

## 3. R2 dan D1

Isi secret Worker:

```bash
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_BUCKET
```

`R2_BUCKET` untuk proyek ini adalah `toolsman-files`. Kunci akses R2 dibuat di
dashboard Cloudflare: R2 → Manage API Tokens → Object Read & Write.

Jalankan migrasi D1 sebelum deploy:

```bash
npx wrangler d1 migrations apply toolsman-shares --remote
```

Cron pembersih ada di Worker terpisah. Deploy setelah migrasi:

```bash
npx wrangler deploy --config workers/cleanup/wrangler.jsonc
```

## 4. Build dan deploy

```bash
npm test
npm run check
npm run build
npx wrangler deploy
```

Build memakai nilai dari `.env`. Kalau nilai `PUBLIC_*` berubah, build ulang;
deploy ulang saja tidak cukup.

## 5. Kuota unggahan

Batas bawaan ada di `src/features/kirim-file/quota.ts`:

- `DAILY_BYTES_PER_IP`: 500 MB per IP per hari.
- `DAILY_BYTES_GLOBAL`: 20 GB untuk seluruh layanan per hari.

Hari dihitung dalam UTC. Ubah konstanta itu kalau perlu, lalu build ulang.
Kuota dicatat di tabel `upload_usage` (migrasi `0006_upload_usage.sql`).

## 6. Laporan penyalahgunaan (webhook)

Kalau `ABUSE_WEBHOOK_URL` diisi, setiap laporan dari halaman unduh dikirim ke
URL itu sebagai `POST` JSON. Isinya hanya `shareId`, `fileCount`, `reason`, dan
`reportedAt`. Tidak ada kata sandi, nama berkas, atau isi berkas.

```bash
npx wrangler secret put ABUSE_WEBHOOK_URL
```

Tanpa nilai itu, laporan tetap disimpan di D1 dan tidak ada webhook yang
dikirim. Ini perilaku normal, bukan error.

## 7. Takedown manual

Untuk menonaktifkan satu link dan menghapus berkasnya:

```bash
npm run takedown -- <id-link>
```

`<id-link>` adalah 32 karakter hex dari URL `/s/<id-link>`. Perintah ini:

1. menandai link `takedown_at` dan status `deleted` di D1, sehingga halaman
   langsung membalas 410;
2. menghapus semua objek R2 milik link itu;
3. menghapus baris `share_files`, `upload_parts`, dan `reports` kalau semua
   objek berhasil dihapus.

Kalau ada objek yang gagal dihapus, perintah berhenti dengan exit code 1 dan
menyebutkan kuncinya. Jalankan ulang perintah yang sama; link sudah nonaktif,
jadi aman diulang.

Perintah ini memakai login wrangler yang sama dengan deploy. Untuk mencoba di
data lokal, tambahkan `--local`:

```bash
npm run takedown -- <id-link> --local
```

Halaman `/s/<id>` untuk link yang di-takedown membalas 410 dengan pesan bahwa
link dinonaktifkan karena melanggar ketentuan, bukan halaman "tidak ditemukan".

## 8. Health check

`GET /api/health` memeriksa D1 dan membalas `{"ok":true}` (200) atau
`{"ok":false}` (503). Tidak ada detail internal di badannya, jadi aman dipakai
uptime monitor.

