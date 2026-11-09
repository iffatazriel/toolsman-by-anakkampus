# DESIGN.md — Toolsman

> **Versi:** 1.0 · **Arah desain:** *Workshop Minimal* — bersih seperti alat developer modern, hangat seperti bengkel/kotak perkakas.
> Dokumen ini adalah sumber kebenaran untuk tampilan dan perilaku UI. Pasangan dari `PRD.md`.

---

## 1. Konsep & Kepribadian

**Metafora:** *kotak perkakas yang rapi.* Setiap alat adalah "perkakas" di rak: mudah ditemukan, jelas fungsinya, siap pakai.

**Kepribadian merek**
- **Ramah, bukan resmi.** Bahasa santai ala teman kampus, tetap jelas.
- **Fokus.** Antarmuka tidak berisik; alat adalah bintangnya.
- **Jujur.** Batasan (ukuran file, masa berlaku) selalu ditampilkan.
- **Cekatan.** Animasi singkat, tidak menghalangi kerja.

**Kata kunci visual:** netral hangat · aksen amber · sudut membulat sedang · garis tipis · label bergaya mono.

## 2. Prinsip Desain

1. **Alat dulu, dekorasi belakangan.** Ruang kerja mendapat area terbesar.
2. **Satu pola, semua alat.** Tata letak halaman alat konsisten (header alat → area kerja → panel opsi → aksi utama).
3. **Satu aksi utama per layar.** Tombol primer hanya satu dan jelas.
4. **Status selalu terlihat.** Progres, sukses, error ditampilkan di dekat sumbernya.
5. **Mobile bukan sisa.** Setiap alat dirancang bisa dipakai di 360 px.
6. **Aksesibel secara default.** Kontras, fokus keyboard, dan target sentuh diperhitungkan sejak awal.

## 3. Design Tokens

### 3.1 Warna

**Netral (hangat)**

| Token | Light | Dark | Pemakaian |
|---|---|---|---|
| `--bg` | `#FAF8F5` | `#141311` | Latar halaman |
| `--surface` | `#FFFFFF` | `#1C1B18` | Kartu, panel |
| `--surface-2` | `#F3F0EA` | `#252320` | Area sekunder, input |
| `--border` | `#E4DFD6` | `#34312C` | Garis tipis |
| `--border-strong` | `#CFC8BB` | `#4A463F` | Garis hover/fokus |
| `--text` | `#1F1D1A` | `#F2EFE9` | Teks utama |
| `--text-muted` | `#6B665D` | `#A29C90` | Teks sekunder |
| `--text-faint` | `#8E887D` | `#7A7468` | Placeholder, keterangan kecil |

**Aksen (amber — "api las")**

| Token | Light | Dark | Pemakaian |
|---|---|---|---|
| `--accent` | `#E8890C` | `#F5A524` | Tombol primer, tautan aktif |
| `--accent-hover` | `#CF7600` | `#FFB84D` | Hover |
| `--accent-soft` | `#FDF0DC` | `#3A2A10` | Latar badge/pilihan aktif |
| `--accent-text` | `#1F1D1A` | `#141311` | Teks di atas tombol aksen |

> Teks pada tombol aksen memakai warna gelap (`--accent-text`), bukan putih, agar kontras ≥ 4,5:1.

**Semantik**

| Token | Light | Dark | Arti |
|---|---|---|---|
| `--success` | `#1E8E5A` | `#3DBE86` | Berhasil |
| `--warning` | `#B7791F` | `#E0A940` | Peringatan |
| `--danger` | `#C93C3C` | `#F06B6B` | Error / hapus |
| `--info` | `#2B6CB0` | `#63A4E8` | Informasi |

**Warna kategori alat** (dipakai pada ikon & chip kategori, bukan latar besar)

| Kategori | Warna |
|---|---|
| Gambar (Draw) | `#7C5CFC` |
| Diagram | `#0EA5A4` |
| Dokumen (PDF) | `#E5484D` |
| Foto | `#E5539B` |
| Berbagi | `#2F80ED` |
| Generator | `#E8890C` |

### 3.2 Tipografi

| Peran | Font | Fallback |
|---|---|---|
| Judul & UI | **Plus Jakarta Sans** | `system-ui, sans-serif` |
| Isi teks | **Inter** | `system-ui, sans-serif` |
| Mono (label alat, kode, ukuran file) | **JetBrains Mono** | `ui-monospace, monospace` |

| Level | Ukuran / Line-height | Berat | Catatan |
|---|---|---|---|
| Display | 48 / 56 (mobile 34 / 40) | 800 | Hero beranda saja |
| H1 | 32 / 40 (mobile 26 / 34) | 700 | Judul halaman alat |
| H2 | 24 / 32 | 700 | Judul seksi |
| H3 | 18 / 28 | 600 | Judul kartu/panel |
| Body | 16 / 26 | 400 | Teks umum |
| Body-sm | 14 / 22 | 400 | Keterangan |
| Label | 12 / 16 | 500, uppercase, letter-spacing 0.06em, **mono** | Label kategori, tag |
| Code | 14 / 22 | 400, mono | Editor, hasil JSON |

### 3.3 Spasi (basis 4 px)

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`
Token: `--space-1` … `--space-9`. Padding halaman: **16 px** (mobile), **24 px** (tablet), **32 px** (desktop). Lebar konten maksimum: **1200 px** (beranda), **penuh** untuk area kerja alat.

### 3.4 Radius

| Token | Nilai | Pemakaian |
|---|---|---|
| `--radius-sm` | 6 px | Chip, input kecil |
| `--radius-md` | 10 px | Tombol, input |
| `--radius-lg` | 14 px | Kartu, panel |
| `--radius-xl` | 20 px | Modal, hero panel |
| `--radius-full` | 999 px | Badge, avatar |

### 3.5 Bayangan & Garis

Desain mengandalkan **garis tipis**, bayangan hanya untuk elemen yang melayang.

| Token | Nilai |
|---|---|
| `--shadow-sm` | `0 1px 2px rgba(31,29,26,.06)` |
| `--shadow-md` | `0 4px 14px rgba(31,29,26,.08)` |
| `--shadow-lg` | `0 12px 32px rgba(31,29,26,.14)` (modal, palet perintah) |
| `--ring` | `0 0 0 3px color-mix(in srgb, var(--accent) 35%, transparent)` (fokus) |

*Mode gelap:* kurangi bayangan, andalkan perbedaan `--surface` dan `--border`.

### 3.6 Gerak (Motion)

| Token | Nilai | Pemakaian |
|---|---|---|
| `--ease` | `cubic-bezier(.2,.8,.2,1)` | Semua transisi |
| `--dur-fast` | 120 ms | Hover, toggle |
| `--dur-base` | 200 ms | Buka panel, tab |
| `--dur-slow` | 320 ms | Modal, transisi halaman |

- Kartu alat naik 2 px dan garisnya menguat saat hover.
- Ikon kategori menguat dari 12% ke 22% campuran warnanya saat kartu hover atau fokus.
- Ring fokus kartu digambar di tepi kartu (2 px, offset 2 px), bukan di dalam padding.
- Hero: empat kartu SVG melayang 7 px dan bergeser paling jauh 9 px mengikuti kursor, dengan kedalaman berbeda per kartu (`--depth`). Hanya untuk penunjuk bermouse dan hanya di ≥1024 px.
- Hormati `prefers-reduced-motion`: matikan transisi non-esensial.
- Jangan menganimasikan area kerja (kanvas, editor).

### 3.7 Breakpoint

| Nama | Lebar |
|---|---|
| `sm` | ≥ 480 px |
| `md` | ≥ 768 px |
| `lg` | ≥ 1024 px |
| `xl` | ≥ 1280 px |

### 3.8 Kode Token (CSS)

```css
:root {
  --bg: #FAF8F5;
  --surface: #FFFFFF;
  --surface-2: #F3F0EA;
  --border: #E4DFD6;
  --border-strong: #CFC8BB;
  --text: #1F1D1A;
  --text-muted: #6B665D;
  --text-faint: #8E887D;

  --accent: #E8890C;
  --accent-hover: #CF7600;
  --accent-soft: #FDF0DC;
  --accent-text: #1F1D1A;

  --success: #1E8E5A;
  --warning: #B7791F;
  --danger: #C93C3C;
  --info: #2B6CB0;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;

  --shadow-sm: 0 1px 2px rgba(31,29,26,.06);
  --shadow-md: 0 4px 14px rgba(31,29,26,.08);
  --shadow-lg: 0 12px 32px rgba(31,29,26,.14);
  --ring: 0 0 0 3px color-mix(in srgb, var(--accent) 35%, transparent);

  --ease: cubic-bezier(.2,.8,.2,1);
  --dur-fast: 120ms;
  --dur-base: 200ms;
  --dur-slow: 320ms;

  --font-display: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}

:root[data-theme="dark"] {
  --bg: #141311;
  --surface: #1C1B18;
  --surface-2: #252320;
  --border: #34312C;
  --border-strong: #4A463F;
  --text: #F2EFE9;
  --text-muted: #A29C90;
  --text-faint: #7A7468;

  --accent: #F5A524;
  --accent-hover: #FFB84D;
  --accent-soft: #3A2A10;
  --accent-text: #141311;

  --success: #3DBE86;
  --warning: #E0A940;
  --danger: #F06B6B;
  --info: #63A4E8;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* salin nilai dark di atas */ }
}
```

**Tailwind (potongan `tailwind.config`)**
```ts
theme: {
  extend: {
    colors: {
      bg: "var(--bg)",
      surface: { DEFAULT: "var(--surface)", 2: "var(--surface-2)" },
      border: { DEFAULT: "var(--border)", strong: "var(--border-strong)" },
      text: { DEFAULT: "var(--text)", muted: "var(--text-muted)", faint: "var(--text-faint)" },
      accent: { DEFAULT: "var(--accent)", hover: "var(--accent-hover)", soft: "var(--accent-soft)" },
    },
    borderRadius: { sm: "6px", md: "10px", lg: "14px", xl: "20px" },
    fontFamily: {
      display: ["var(--font-display)"],
      body: ["var(--font-body)"],
      mono: ["var(--font-mono)"],
    },
  },
}
```

## 4. Logo & Identitas

- **Wordmark:** "Toolsman" dalam Plus Jakarta Sans 800; huruf **T** dapat diberi bentuk palu/kunci pas sederhana.
- **Ikon aplikasi/favicon:** kotak membulat berlatar amber dengan simbol kunci pas atau kurung kurawal `{ }` berwarna gelap.
- **Area aman:** sisakan ruang minimal setinggi huruf "o" di sekeliling logo.
- **Hindari:** meniru logo/maskot produk lain (Excalidraw, draw.io, iLovePDF, dll.).

## 5. Ikonografi & Ilustrasi

- **Set ikon:** Lucide (garis 1,75 px, ujung membulat), ukuran 16 / 20 / 24 px.
- Ikon alat ditempatkan dalam *tile* persegi membulat 40×40 dengan latar `kategori @ 12% opacity` dan ikon berwarna kategori.
- **Ilustrasi:** minimal; gunakan garis dan bentuk geometris sederhana. Hindari stok foto.
- **Empty state:** ikon besar garis tipis + satu kalimat + satu aksi.

## 6. Komponen

### 6.1 Tombol

| Varian | Gaya | Pemakaian |
|---|---|---|
| **Primer** | Latar `--accent`, teks `--accent-text`, tinggi 44 px, radius `md` | Satu per layar (Unduh, Unggah, Buat) |
| **Sekunder** | Latar `--surface`, border `--border-strong`, teks `--text` | Aksi pendukung |
| **Ghost** | Tanpa latar, teks `--text-muted`, hover `--surface-2` | Aksi tersier, toolbar |
| **Destruktif** | Teks/border `--danger` (isi penuh hanya saat konfirmasi) | Hapus, reset |

Status: *hover* (naik 1 tingkat warna), *active* (turun 1 px), *focus* (`--ring`), *disabled* (opacity 45%, tanpa pointer), *loading* (spinner + label tetap terbaca, lebar tidak berubah).
Target sentuh minimal **44×44 px**.

### 6.2 Input & Form

- Tinggi 44 px, latar `--surface-2`, border `--border`, radius `md`.
- Fokus: border `--accent` + `--ring`.
- Label di atas input (14 px, 500). Teks bantuan di bawah (`--text-muted`). Error: border `--danger` + ikon + pesan spesifik ("Ukuran maksimal 100 MB", bukan "Error").
- **Dropzone:** border putus-putus 2 px `--border-strong`, radius `lg`, ikon unggah di tengah; saat *drag-over* latar `--accent-soft` + border `--accent`.
- **Slider / Segmented control** untuk opsi (ukuran foto, tingkat kompresi) — bukan dropdown bila pilihan ≤ 4.

### 6.3 Kartu Alat (Tool Card)

```
┌───────────────────────────────┐
│ [ikon 40×40]        DOKUMEN   │  ← label kategori (mono, 12px)
│                               │
│ Gabung PDF                    │  ← H3
│ Satukan banyak PDF jadi satu. │  ← body-sm, --text-muted
│                               │
│ ● Tanpa unggah ke server      │  ← badge privasi (opsional)
└───────────────────────────────┘
```
- Latar `--surface`, border `--border`, radius `lg`, padding 20 px.
- Hover: border `--border-strong`, naik 2 px, `--shadow-md`.
- Seluruh kartu dapat diklik (satu tautan), fokus keyboard terlihat.
- **Badge privasi:** `Di perangkatmu` (alat client-side) atau `Pakai server` (Kirim File) — transparansi jadi nilai jual.

### 6.4 Navigasi

**Header (sticky, tinggi 64 px):** logo kiri · kolom pencarian (tengah, `Ctrl+K`) · toggle tema · tautan "Tentang" kanan.
**Mobile:** logo + ikon cari + menu; pencarian membuka layar penuh.
**Breadcrumb di halaman alat:** `Beranda / Dokumen / Gabung PDF`.
**Palet perintah (Ctrl+K):** modal `--radius-xl`, daftar alat dengan ikon, navigasi panah + Enter.

### 6.5 Tab, Segmented, Chip

- **Tab** (split editor ↔ pratinjau di mobile): garis bawah aksen 2 px pada tab aktif.
- **Chip filter kategori** di beranda: `--radius-full`, aktif = `--accent-soft` + teks aksen.

### 6.6 Umpan Balik

| Komponen | Perilaku |
|---|---|
| **Toast** | Kanan-bawah (desktop) / bawah penuh (mobile), hilang 4 dtk; berisi aksi *Batalkan* bila relevan |
| **Progress bar** | 6 px, radius penuh, `--accent`; tampilkan persen + estimasi untuk unggahan/proses > 2 dtk |
| **Skeleton** | Untuk memuat alat berat (Excalidraw, model foto) |
| **Alert inline** | Latar semantik 10% + ikon + teks; dipakai untuk peringatan batasan |
| **Dialog konfirmasi** | Hanya untuk tindakan destruktif/tak dapat dibatalkan |

### 6.7 Modal & Panel

Modal maksimum 480 px (konfirmasi) / 720 px (pengaturan), overlay `rgba(0,0,0,.5)`, tutup dengan `Esc` dan klik overlay, fokus dikunci di dalam modal, fokus kembali ke pemicu setelah ditutup.

## 7. Tata Letak Halaman

### 7.1 Beranda

```
┌──────────────────────────────────────────────────────────┐
│ Header: Logo  [ Cari alat…  Ctrl+K ]      ☀/🌙   Tentang │
├──────────────────────────────────────────────────────────┤
│ HERO                                                     │
│  "Semua perkakas kuliahmu, satu kotak."                  │
│  Gratis · Tanpa login · File diproses di perangkatmu     │
│  [ Cari alat… ]                                          │
│  Chip: Semua  Gambar  Diagram  Dokumen  Foto  Berbagi  Generator │
├──────────────────────────────────────────────────────────┤
│ Grid kartu alat (4 kol desktop · 2 tablet · 1 mobile)    │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐                              │
│ └────┘ └────┘ └────┘ └────┘                              │
├──────────────────────────────────────────────────────────┤
│ "Terakhir dipakai" & "Favorit" (jika ada)                │
├──────────────────────────────────────────────────────────┤
│ Mengapa Toolsman? 3 poin: Gratis · Privat · Cepat        │
├──────────────────────────────────────────────────────────┤
│ Footer: Privasi · Syarat · GitHub · Laporkan masalah     │
└──────────────────────────────────────────────────────────┘
```

### 7.2 Halaman Alat (pola umum)

```
┌──────────────────────────────────────────────────────────┐
│ Header global                                            │
├──────────────────────────────────────────────────────────┤
│ Breadcrumb                                               │
│ [ikon] Judul Alat (H1)           [badge privasi]         │
│ Deskripsi satu kalimat                                   │
├───────────────────────────────┬──────────────────────────┤
│                               │ PANEL OPSI               │
│   AREA KERJA                  │ - Pengaturan             │
│   (dropzone / kanvas /        │ - Pilihan                │
│    editor / pratinjau)        │                          │
│                               │ [ AKSI UTAMA ]           │
├───────────────────────────────┴──────────────────────────┤
│ Cara pakai (3 langkah) · FAQ singkat · Alat terkait      │
└──────────────────────────────────────────────────────────┘
```
Mobile: panel opsi pindah **di bawah** area kerja; tombol aksi utama menempel di bawah layar (*sticky bottom bar*).

## 8. Spesifikasi Per Alat

### 8.1 Draw (Excalidraw)
- Kanvas mengisi tinggi layar (`100dvh – header`), tanpa padding agar luas.
- Tema kanvas mengikuti tema situs.
- Bar kecil di atas kanvas: nama berkas (dapat diedit), status *"Tersimpan otomatis"*, tombol Ekspor.
- Header/footer situs dapat diciutkan (mode fokus, tombol `F`).

### 8.2 Diagram (Mermaid)
- Desktop: **split view** — editor kode (kiri, mono) | pratinjau (kanan), pembatas dapat digeser.
- Mobile: tab **Kode / Pratinjau**.
- Dropdown **Template** di atas editor; error sintaks tampil sebagai garis merah bergelombang + pesan di bawah editor.
- Tombol "Editor Visual (draw.io)" bergaya sekunder dengan ikon tautan-luar; jelaskan dalam tooltip bahwa ini membuka editor diagrams.net.

### 8.3 PDF Tools
- Halaman pemilih (grid kartu: Gabung, Pisah, Kompres, Gambar→PDF, PDF→Gambar, Putar).
- Alur 3 langkah dengan *stepper* ringkas: **Pilih file → Atur → Unduh**.
- Daftar file berupa kartu dengan *thumbnail* halaman pertama, nama, ukuran (mono), pegangan *drag* ⋮⋮, dan tombol hapus.
- Kompres: *segmented control* tiga tingkat + perbandingan ukuran "2,4 MB → 0,9 MB (−62%)".

### 8.4 Pas Foto
- Langkah: **1 Unggah → 2 Latar → 3 Ukuran & Posisi → 4 Unduh**.
- Pratinjau dengan **guide overlay** (oval kepala, garis bahu) yang bisa disembunyikan.
- Pemilih warna: *swatch* bulat besar — Merah `#DB1F26`, Biru `#0F5BD8`, Putih `#FFFFFF`, + kustom. (Nilai bawaan dapat disesuaikan dengan standar instansi.)
- *Segmented control* ukuran: `2×3` `3×4` `4×6`.
- Saat model dimuat: skeleton + progres "Menyiapkan penghapus latar (sekali saja)…".
- Catatan kecil: "Aturan pas foto tiap instansi bisa berbeda. Cek persyaratanmu."

### 8.5 Kirim File
- Dropzone besar di tengah; setelah unggah, daftar berkas + progres per file.
- Panel opsi: **Berlaku** (`1 jam` `24 jam` `7 hari`), **Sandi** (toggle), **Sekali unduh** (toggle).
- Hasil: kartu sukses dengan link (mono, tombol *Salin*), QR code, sisa waktu hitung mundur.
- Halaman unduhan penerima: nama file, ukuran, kedaluwarsa, tombol **Unduh** besar, tautan "Laporkan".
- Tampilkan batasan di bawah dropzone: *"Maks. 100 MB per berkas · dihapus otomatis"*.

### 8.6 Generator
- **Markdown:** split editor | pratinjau; toolbar (B, I, H, daftar, kode, tautan, tabel); tombol *Salin* dan *Unduh .md*.
- **README generator:** form bertahap di kiri, pratinjau langsung di kanan.
- **JSON:** dua panel (Input | Hasil), tombol `Format`, `Minify`, `Salin`; error menunjukkan baris & kolom; hasil bergaya *syntax-highlight* dengan lipatan (collapse) node.

## 9. Konten & Gaya Bahasa (UX Writing)

| Prinsip | Contoh |
|---|---|
| Santai, jelas, pakai "kamu" | "Seret file PDF kamu ke sini" |
| Kata kerja di tombol | "Gabungkan", "Unduh", "Salin link" |
| Error membantu | "File lebih dari 100 MB. Kompres dulu atau pecah jadi beberapa bagian." |
| Jujur soal privasi | "Diproses di perangkatmu — file tidak diunggah." |
| Hindari jargon & lelucon berlebihan | Tidak memakai emoji di UI fungsional |

**Judul halaman (hero):** *"Semua perkakas kuliahmu, satu kotak."*
**Placeholder pencarian:** *"Cari alat… (mis. gabung pdf, flowchart)"*

## 10. Aksesibilitas (WCAG 2.1 AA)

- Kontras teks ≥ 4,5:1 (teks besar ≥ 3:1) di kedua tema; periksa pasangan `--text-muted` pada `--surface-2`.
- Semua fungsi dapat dioperasikan dengan keyboard; urutan fokus logis; `:focus-visible` memakai `--ring`.
- Dropzone selalu menyediakan tombol **"Pilih file"** (bukan hanya drag-and-drop).
- Label ARIA untuk ikon-saja; `aria-live="polite"` untuk toast dan progres.
- Jangan mengandalkan warna saja (error juga memakai ikon + teks; kategori juga memakai label).
- Dukungan `prefers-reduced-motion` dan `prefers-color-scheme`.
- Target sentuh ≥ 44 px; ukuran teks dapat diperbesar hingga 200% tanpa kehilangan fungsi.

## 11. Responsif

| Layar | Perilaku |
|---|---|
| **< 768 px** | Satu kolom; panel opsi di bawah area kerja; *sticky action bar*; editor split → tab |
| **768–1023 px** | Grid 2 kolom di beranda; area kerja penuh, panel opsi bisa dilipat |
| **≥ 1024 px** | Area kerja + panel opsi berdampingan (panel 320–360 px) |
| **≥ 1280 px** | Grid 4 kolom di beranda; kanvas/editor memanfaatkan lebar maksimum |

## 12. Dark Mode

- Default mengikuti sistem; toggle manual tersimpan di `localStorage`.
- Gunakan token, **bukan** warna hardcode, agar semua komponen berubah otomatis.
- Gambar hasil (pas foto, ekspor diagram) tidak ikut dibalik warnanya; latar pratinjau dibuat netral/kotak-kotak (*checkerboard*) agar transparansi terlihat.

## 13. Performa Desain

- Font: *subset* Latin, `font-display: swap`, maksimal 2 keluarga dimuat di awal (Plus Jakarta Sans + Inter); JetBrains Mono dimuat hanya saat dibutuhkan.
- Ikon dimuat per-ikon (tree-shaking), bukan seluruh pustaka.
- Alat berat (Excalidraw, model foto, PDF engine) dimuat *lazy* setelah pengguna membuka halaman alat; tampilkan skeleton.
- Hindari gambar dekoratif besar; gunakan CSS/SVG.

## 14. Do & Don't

| ✅ Lakukan | ❌ Hindari |
|---|---|
| Satu tombol primer per layar | Banyak tombol berwarna aksen bersaing |
| Teks bantuan spesifik dan ramah | Pesan "Terjadi kesalahan" tanpa solusi |
| Tampilkan batasan di awal | Menyembunyikan batas ukuran sampai gagal |
| Warna aksen hemat (tombol, status aktif) | Latar penuh warna aksen di banyak area |
| Konsisten dengan token | Warna/ukuran acak per halaman |
| Badge privasi yang jujur | Klaim "100% aman" tanpa penjelasan |

## 15. Daftar Periksa Implementasi

- [ ] Token CSS & konfigurasi Tailwind terpasang; mode terang/gelap berfungsi
- [ ] Font dimuat dengan strategi performa
- [ ] Komponen dasar: Button, Input, Dropzone, Card, Tabs, Toast, Modal, Progress, Chip
- [ ] Layout beranda + palet perintah `Ctrl+K`
- [ ] Template halaman alat (header alat, area kerja, panel opsi, FAQ)
- [ ] Audit kontras & navigasi keyboard
- [ ] Uji di 360 px, 768 px, 1280 px
- [ ] `prefers-reduced-motion` dihormati

## 16. Aset yang Perlu Dibuat

1. Logo wordmark + ikon (SVG, versi terang/gelap)
2. Favicon & ikon PWA (192, 512 px)
3. Gambar OG/Twitter per kategori (1200×630)
4. Set ikon alat (Lucide + kustomisasi bila perlu)
5. Ilustrasi empty state (garis sederhana)

---

*Dokumen hidup: perbarui bersama perubahan produk. Setiap komponen baru harus memakai token di Bagian 3.*