SKILL YANG WAJIB DIPAKAI
- antislop-ui: semua keputusan visual dan komponen. Hindari tampilan generik ala template AI (gradien ungu, kartu seragam tanpa hierarki, ikon emoji, glassmorphism berlebihan).
- antislop-copywriting: semua teks di UI (hero, deskripsi alat, error, tombol, FAQ). Pakai bahasa Indonesia santai (kamu), spesifik, tanpa klise marketing.
- antislop: kode dan keputusan umum. Tanpa komentar basa-basi, tanpa abstraksi yang tidak perlu, tanpa dependensi yang tidak dipakai.

TAHAP 1 (kerjakan hanya ini dulu)
1. Inisialisasi Next.js (App Router) + TypeScript + Tailwind sesuai PRD bagian 9.
2. Pasang design tokens dari design.md bagian 3 (CSS variables + konfigurasi Tailwind), termasuk dark mode yang mengikuti sistem dan bisa di-toggle.
3. Pasang font (Plus Jakarta Sans, Inter, JetBrains Mono) dengan next/font.
4. Buat komponen dasar: Button, Input, Dropzone, ToolCard, Chip, Tabs, Toast, Modal, Progress.
5. Buat layout global: header sticky, footer, dan palet pencarian Ctrl+K.
6. Buat beranda sesuai design.md bagian 7.1. Katalog kartu dibangun otomatis dari file meta.ts tiap alat (konvensi di PRD bagian 9), dengan 7 modul MVP sebagai data awal (halaman alatnya masih placeholder).
7. Buat template halaman alat generik (design.md bagian 7.2) yang nanti dipakai semua alat.

ATURAN
- Jangan mengerjakan alat apa pun (Draw, PDF, dll.) di tahap ini.
- Jangan menambah fitur di luar PRD.
- Aksesibilitas WCAG AA sejak awal: fokus keyboard, kontras, target sentuh 44 px.
- Uji tampilan di 360 px, 768 px, dan 1280 px.
- Jangan pakai warna atau ukuran hardcode di luar token.

SEBELUM MULAI
Rangkum rencanamu dalam maksimal 10 baris dan sebutkan asumsi yang kamu ambil. Lalu langsung kerjakan, tanpa menunggu persetujuan kecuali ada keputusan yang tidak bisa diulang.

SETELAH SELESAI
Jalankan build + lint, perbaiki error, lalu laporkan: apa yang jadi, cara menjalankannya, dan satu langkah berikutnya yang disarankan.
