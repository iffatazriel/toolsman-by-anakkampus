# Kontribusi Prompt

Terima kasih mau menambah prompt ke Bank Prompt. Panduan ini singkat: satu
berkas untuk satu prompt, diperiksa otomatis, lalu tampil di `/tools/prompt/`.

## Bentuk berkas

Satu prompt = satu berkas YAML di `content/prompts/<kategori>/<id>.yaml`.

- `<kategori>` harus salah satu: `belajar`, `laporan`, `menulis`, `kode`,
  `riset`, `karier`.
- `<id>` hanya huruf kecil, angka, dan tanda hubung (`debug-error-express`),
  dan harus sama dengan nilai `id` di dalam berkas.

Contoh lengkap:

```yaml
id: ringkas-bab-jadi-catatan
judul: Ringkas satu bab jadi catatan yang bisa dipelajari ulang
kategori: belajar
tag: [ringkasan, catatan, penjelasan]
ai: [umum, chatgpt, claude]
bahasa: id
level: pemula
variabel:
  - nama: judul_bab
    label: Judul bab
    tipe: pendek
    contoh: "Basis data relasional"
  - nama: isi_bab
    label: Isi bab
    tipe: panjang
    contoh: "Tempel isi bab atau catatanmu di sini."
  - nama: gaya
    label: Gaya catatan
    tipe: pilihan
    contoh: Poin singkat
    pilihan: [Poin singkat, Paragraf, Tabel]
prompt: |
  Kamu tutor yang membantu saya membuat catatan belajar.
  Bab: {{judul_bab}}
  Gaya catatan: {{gaya}}

  Isi bab:
  {{isi_bab}}

  Buat catatan dengan urutan: satu kalimat inti, 5 poin utama yang
  saling terkait, 3 istilah penting beserta artinya, dan 2 pertanyaan
  untuk menguji pemahaman. Pakai hanya isi bab di atas; kalau ada yang
  belum jelas, tandai "perlu dicek".
catatan: |
  Catatan ini untuk belajar, bukan menggantikan membaca bab. Cocok dipakai
  sebagai rangkuman sebelum mengerjakan latihan.
penulis: Nama Kamu
lisensi: CC0-1.0
dibuat: "2026-11-09"
```

## Aturan isian

| Key | Aturan |
|---|---|
| `id` | Huruf kecil, angka, tanda hubung. Sama dengan nama berkas. Maksimal 80 karakter. |
| `judul` | 5–90 karakter, menjelaskan hasilnya, bukan sekadar topik. |
| `kategori` | Salah satu dari enam kategori di atas. |
| `tag` | 1–6 tag dari daftar di `src/lib/prompt-taxonomy.ts`. Jangan mengarang tag baru. |
| `ai` | 1–5 dari `umum`, `chatgpt`, `claude`, `gemini`, `copilot`. Pakai `umum` kalau jalan di semua model. |
| `bahasa` | `id` atau `en`. |
| `level` | `pemula`, `menengah`, `mahir`. |
| `variabel` | Maksimal 8. Setiap variabel punya `nama`, `label`, `tipe` (`pendek`, `panjang`, `pilihan`), `contoh`; `pilihan` wajib berisi 2–8 opsi untuk tipe `pilihan`. |
| `prompt` | 20–4000 karakter. Setiap variabel dipakai sebagai `{{nama}}`; placeholder dan daftar variabel harus cocok dua arah. |
| `catatan` | Maksimal 600 karakter. Markdown ringan: tebal, miring, kode sebaris, dan daftar. |
| `penulis` | Nama atau nama samaran, 2–60 karakter. |
| `lisensi` | `CC0-1.0` atau `CC-BY-4.0`. |
| `dibuat` | Tanggal `YYYY-MM-DD`, pakai tanda kutip. |

## Aturan isi

- **Tulis sendiri.** Jangan menyalin prompt dari pustaka, blog, atau unggahan
  orang lain. Kalau idenya terinspirasi dari suatu tempat, tulis ulang dengan
  kata-katamu dan sebutkan di catatan.
- **Satu hasil yang jelas.** Prompt harus punya keluaran yang bisa diperiksa,
  bukan sekadar "jelaskan topik ini".
- **Jangan mengarang data.** Instruksikan model untuk memakai hanya bahan yang
  diberikan, menandai ketidakpastian, dan tidak menambah angka atau sitasi.
- **Untuk belajar, bukan menyalin.** Prompt yang membantu tugas kampus harus
  mendorong pengguna menulis ulang dan menyebut sumber, bukan menyerahkan
  jawaban mentah.
- **Tanpa konten terlarang.** Tidak boleh ada tautan http, alamat email, nomor
  telepon, ajakan jailbreak, atau cara menghindari pemeriksaan plagiarisme.
  Pemeriksa menolak semua itu.

## Periksa sebelum membuka PR

```bash
npm install
npm run prompts:check
```

Kalau ada yang salah, pesannya menyebut berkas dan baris:

```
content/prompts/kode/debug-error-express.yaml:12  variabel "sudah_dicoba" tidak dipakai di "prompt" ({{sudah_dicoba}}).
```

Ulangi sampai muncul:

```
✓ 31 prompt valid (belajar 5, laporan 5, menulis 5, kode 5, riset 5, karier 6).
```

CI menjalankan perintah yang sama untuk setiap PR yang mengubah
`content/prompts/`.

## Lisensi kontribusi

Dengan mengirim prompt, kamu setuju prompt itu dirilis dengan lisensi yang
kamu tulis di berkas: `CC0-1.0` (domain publik, bebas dipakai tanpa atribusi)
atau `CC-BY-4.0` (bebas dipakai dengan atribusi ke `penulis`). Jangan kirim
materi milik orang lain.

Lisensi di sini hanya berlaku untuk isi `content/prompts/`. Kode situs dirilis
MIT, lihat `LICENSE`.
