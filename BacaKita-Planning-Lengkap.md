# Planning Pengembangan Aplikasi — BacaKita (Platform Buku Digital)

## 1. Ringkasan Kondisi Saat Ini

Kode yang di-upload adalah **prototype frontend** hasil generate dari AI Studio (Google), dengan stack:

- **React 19 + Vite 6 + TypeScript**
- **Tailwind CSS 4**
- State management: `useState` biasa di level `App.tsx` (tidak ada Redux/Zustand/Context global)
- Data buku: **mock data statis** (`src/data/mockBooks.ts`)
- Belum ada backend, database, autentikasi nyata, maupun payment gateway — semuanya disimulasikan di frontend
- Dependency `@google/genai` sudah terpasang tapi **belum dipakai** untuk fitur AI apa pun (baru scaffolding bawaan template)

### Fitur yang sudah ada (UI-nya, secara simulasi)
| Modul | Komponen | Status |
|---|---|---|
| Navbar & Sidebar | `Navbar.tsx`, `Sidebar.tsx` | ✅ UI jadi |
| Hero & Search & Genre filter | `Hero.tsx`, `SearchBar.tsx`, `Genre.tsx` | ✅ UI jadi |
| Katalog buku | `BookSection.tsx`, `BookCard.tsx` | ✅ UI jadi |
| Detail buku | `BookDetailModal.tsx` | ✅ UI jadi |
| E-reader | `ReaderModal.tsx` | ✅ UI jadi (baca per bab dari mock data) |
| Keranjang & Checkout | `CartModal.tsx` | ✅ UI jadi (checkout dummy, tanpa payment gateway asli) |
| Langganan (subscription) | `SubscriptionModal.tsx` | ✅ UI jadi (tanpa billing asli) |
| Login/Register | `AuthModal.tsx` | ✅ UI jadi (dummy, tanpa auth backend) |
| Rak buku saya (My Library) | `MyLibraryModal.tsx` | ✅ UI jadi |
| Riwayat baca & transaksi | `HistoryView.tsx` | ✅ UI jadi |
| Progress baca & target bulanan | terintegrasi di `UserProfile` (types.ts) | ✅ struktur data ada |
| Notifikasi toast | `Toast.tsx` | ✅ jadi |

### Yang belum ada sama sekali
- Backend/API server
- Database (buku, user, transaksi, progress baca)
- Autentikasi & otorisasi asli (JWT/session, hashing password)
- Penyimpanan file buku asli (PDF/EPUB) + streaming/DRM sederhana
- Persistensi data (refresh halaman = semua data hilang, karena hanya `useState`)
- Search & filter di sisi server (saat ini di-filter di client dari data mock)
- Sistem admin/CMS untuk penerbit menambah buku

---

## 2. Target Arsitektur

```
┌─────────────────────┐        ┌──────────────────────┐        ┌────────────────┐
│   Frontend (React)  │  REST  │   Backend API         │  ORM   │   Database      │
│  Vite + TS + Tailwind│◄──────►│  Node.js (Express/    │◄──────►│  PostgreSQL     │
│  (kode yang sudah ada)│      │  Nest.js) atau         │        │                 │
└─────────┬────────────┘       │  Next.js API routes    │        └────────────────┘
          │                    └──────────┬─────────────┘
          │                               │
   ┌──────▼──────┐               ┌────────▼─────────┐        ┌──────────────┐
   │ Object Storage│              │ Payment (Simulasi)│        │  Auth Provider│
   │ (S3/Cloud     │              │ diproses di server │        │ (JWT/Firebase/│
   │ Storage) utk  │              │ sendiri, tanpa      │        │  Supabase Auth)│
   │ file buku &   │              │ gateway pihak ketiga│        └──────────────┘
   │ cover         │              └───────────────────┘
   └───────────────┘
```

**Rekomendasi stack backend** (pilih salah satu, disesuaikan tim/skill):
- **Cepat & simpel**: Supabase (Postgres + Auth + Storage jadi satu) — cocok untuk MVP solo/tim kecil
- **Custom penuh**: Node.js + Express/Nest.js + Prisma ORM + PostgreSQL, deploy di Railway/Render/VPS
- **Full-stack framework**: Next.js (migrasi dari Vite) dengan API routes + Prisma, deploy di Vercel

---

## 3. Data Model yang Perlu Dibuat di Backend

Berdasarkan `types.ts` yang sudah ada di frontend, tabel yang dibutuhkan:

- **users** — id, name, email, password_hash, avatar, is_subscribed, subscription_plan, subscription_expiry
- **books** — id, title, author, cover_url, price, rating, review_count, genre, badge, pages, publisher, publish_year, description, is_premium_only
- **chapters** — id, book_id, title, content/file_url, order
- **owned_books** — user_id, book_id, acquired_at (hasil beli/subscription)
- **favorites** — user_id, book_id
- **reading_progress** — user_id, book_id, last_chapter_index, progress_percentage, last_read_date, is_completed
- **cart_items** — user_id, book_id, added_at
- **transactions** — id, user_id, subtotal, discount, tax, total, payment_method, status, created_at
- **transaction_items** — transaction_id, book_id, price
- **monthly_goals** — user_id, target_books, read_books, month/year

---

## 4. Roadmap Pengembangan (Fase)

### Fase 0 — Persiapan (1–2 minggu)
- Setup repo backend, pilih stack (lihat rekomendasi di atas)
- Setup database & migrasi skema di atas
- Setup environment (dev/staging/prod) & CI/CD dasar
- Definisikan kontrak API (endpoint list, request/response shape) berdasarkan kebutuhan komponen yang sudah ada

### Fase 1 — Autentikasi & User (2 minggu)
- Endpoint register/login/logout, hash password (bcrypt), JWT/session
- Ganti `AuthModal.tsx` dari dummy → panggil API asli
- Simpan profil user (nama, email, avatar) di database, bukan di `useState`

### Fase 2 — Katalog Buku & Backend Konten (2–3 minggu)
- Migrasi `mockBooks.ts` → tabel `books` + `chapters` di database
- Endpoint list/detail/search/filter buku (genre, badge, kata kunci) — pindahkan logic filter dari client ke server (mendukung pagination)
- Upload cover ke object storage (S3/Cloud Storage), bukan URL statis
- Panel admin sederhana untuk CRUD buku (bisa mulai dari internal tool sederhana)

### Fase 3 — Transaksi: Cart, Beli, Langganan (2–3 minggu)
- Endpoint cart (tambah/hapus item, tersimpan per user di DB)
- **Payment tetap simulasi** (tidak pakai gateway pihak ketiga seperti Midtrans/Xendit) — endpoint `POST /checkout` langsung tandai transaksi sebagai "Berhasil" (atau bisa dibuat ada opsi delay/gagal untuk simulasi lebih realistis)
- Setelah "bayar" sukses → masukkan buku ke `owned_books` atau aktifkan `is_subscribed`
- Riwayat transaksi (`HistoryView.tsx`) diambil dari tabel `transactions`, bukan state lokal

### Fase 4 — E-Reader & Progress Baca (2 minggu)
- Simpan isi bab (`Chapter.content`) di storage/DB, dengan opsi format teks atau file EPUB/PDF
- Endpoint update `reading_progress` setiap kali user pindah bab/halaman
- Sinkronisasi target baca bulanan (`monthlyGoal`) ke backend
- Pertimbangkan proteksi konten dasar (mis. batasi akses bab jika buku premium & user belum bayar/berlangganan)

### Fase 5 — Penyempurnaan & Fitur Tambahan (ongoing)
- Rekomendasi buku personalisasi (di sinilah `@google/genai` yang sudah ter-install bisa dipakai, misalnya rekomendasi berbasis riwayat baca atau ringkasan buku otomatis)
- Notifikasi (reminder baca, promo langganan)
- Rating & review asli dari user (saat ini `rating`/`reviewCount` masih statis di mock data)
- Optimasi performa: caching, lazy load cover, infinite scroll katalog
- Testing (unit test komponen, e2e checkout flow) & monitoring error (Sentry dsb)

---

## 5. Estimasi Timeline Total

| Fase | Durasi | Kumulatif |
|---|---|---|
| Fase 0 — Persiapan | 1–2 minggu | minggu ke-2 |
| Fase 1 — Auth & User | 2 minggu | minggu ke-4 |
| Fase 2 — Katalog Buku | 2–3 minggu | minggu ke-7 |
| Fase 3 — Transaksi & Payment | 3 minggu | minggu ke-10 |
| Fase 4 — E-Reader & Progress | 2 minggu | minggu ke-12 |
| Fase 5 — Penyempurnaan | ongoing | pasca-launch |

**Estimasi MVP siap (Fase 0–4): ± 3 bulan** dengan 1–2 developer full-stack. Bisa lebih cepat jika pakai Supabase (mengurangi waktu Fase 0 & 1 karena auth/DB sudah disediakan).

---

## 6. Hal-Hal yang Perlu Diputuskan Lebih Dulu

1. **Format file buku**: teks biasa di database, atau upload EPUB/PDF asli? Ini menentukan desain `ReaderModal` dan storage.
2. ~~Model bisnis & payment gateway~~ — **sudah diputuskan**: hybrid (beli per buku + langganan), dengan pembayaran **simulasi** (tidak pakai gateway pihak ketiga seperti Midtrans/Xendit).
3. **Siapa yang menambah buku**: admin internal saja, atau ada portal penerbit pihak ketiga?
4. **Platform target**: web saja, atau nanti juga mobile app (perlu API yang sama bisa dipakai React Native/Flutter)?

---

## 7. Sprint Planning (MVP)

### Metode Pengembangan
- **Framework:** Scrum
- **Durasi Sprint:** 2 minggu
- **Total Sprint:** 7 Sprint (±14 minggu)

### Prinsip Alur Utama
- **Browse tanpa login**: siapa saja bisa lihat-lihat katalog buku (list, filter, cari, baca detail & sinopsis) tanpa perlu daftar/login — mirip toko buku online pada umumnya.
- **Login baru muncul saat aksi transaksi/baca**: begitu user klik **"Beli"**, **"Baca Sekarang"**, atau **"Berlangganan"**, sistem cek status login. Kalau belum login → diarahkan ke Login/Register dulu, setelah berhasil baru lanjut ke aksi yang tadi dituju.
- **Navigasi 4 menu**: Beranda, Katalog, Tentang Kami, dan Profil (kalau sudah login) / Login (kalau belum).
- **Pembayaran tetap simulasi**: tidak terhubung ke payment gateway pihak ketiga (Midtrans/Xendit dsb). Perhitungan harga tetap jalan normal, hanya eksekusi "bayar"-nya berupa tombol simulasi berhasil/gagal.

---

### Sprint 0 — Persiapan Lingkungan Pengembangan

**Tujuan:** Menyiapkan seluruh kebutuhan pengembangan agar tim dapat mulai membangun aplikasi.

**Backlog**

*Project Setup*
- [ ] Membuat repository GitHub
- [ ] Migrasi/inisialisasi project (Vite/Next.js + TypeScript) — lanjutan dari prototype `BacaKita` yang sudah ada
- [ ] Konfigurasi Tailwind CSS
- [ ] Konfigurasi ESLint & Prettier
- [ ] Menyusun struktur folder project (backend terpisah dari frontend)

*Database*
- [ ] Membuat project Supabase (atau setup PostgreSQL + Prisma jika custom backend)
- [ ] Membuat tabel database: `users`, `books`, `chapters`, `owned_books`, `favorites`, `reading_progress`, `cart_items`, `transactions`, `transaction_items`, `monthly_goals`
- [ ] Konfigurasi Storage (cover buku & file/konten bab)
- [ ] Konfigurasi Row Level Security (RLS)

*Authentication Helper*
- [ ] Middleware session
- [ ] Helper `getCurrentUser()`

*Landing Page*
- [ ] Hero Section
- [ ] Navbar
- [ ] Footer

**Acceptance Criteria**
- [ ] Project berhasil dijalankan
- [ ] Database berhasil terkoneksi
- [ ] Landing Page tampil dengan baik

---

### Sprint 1 — Landing Page, Navigasi & Browse Katalog Buku (Tanpa Login)

**Tujuan:** Memungkinkan siapa saja (belum login) mencari dan melihat detail buku, dengan navigasi utama yang final.

**Backlog**

*Navigasi Utama (Navbar)*
- [ ] Menu **Beranda**
- [ ] Menu **Katalog**
- [ ] Menu **Tentang Kami**
- [ ] Menu **Profil** (jika sudah login) / **Login** (jika belum login) — kondisional berdasarkan status session
- [ ] Navbar responsive (mobile menu, mengganti `Sidebar.tsx` yang sudah ada)

*Landing Page (Beranda)*
- [ ] Hero + Search Bar
- [ ] Genre highlight (`Genre.tsx`)
- [ ] Buku Populer / Best Seller / Editor's Pick (`BookSection.tsx`)
- [ ] Responsive

*Halaman Katalog (List Buku)*
- [ ] Daftar buku (`BookCard.tsx`)
- [ ] Search (judul, penulis)
- [ ] Filter (genre, badge, harga)
- [ ] Sorting (terbaru, termurah, rating)
- [ ] Pagination / infinite scroll
- [ ] Empty State (buku tidak ditemukan)

*Detail Buku*
- [ ] `BookDetailModal.tsx` → dipindah/disesuaikan jadi halaman detail berbasis data API
- [ ] Sinopsis, penulis, penerbit, tahun terbit, jumlah halaman, rating & jumlah ulasan
- [ ] Daftar bab (preview judul bab saja)
- [ ] Tombol **"Beli"** dan **"Baca Sekarang"** (belum memicu login di sprint ini — cek auth dilakukan di Sprint 3)

*Halaman Tentang Kami*
- [ ] Konten profil BacaKita
- [ ] Kontak

**Testing**
- [ ] Semua halaman di atas bisa diakses tanpa login
- [ ] Search berjalan
- [ ] Filter genre & badge berjalan
- [ ] Sorting berjalan
- [ ] Detail buku tampil lengkap
- [ ] Navbar menampilkan menu yang benar sesuai status login

**Acceptance Criteria**
- Pengunjung (belum login) dapat browsing, mencari, dan melihat detail buku sepenuhnya
- Navbar hanya berisi 4 menu sesuai ketentuan
- Tidak ada fitur di sprint ini yang mewajibkan login

---

### Sprint 2 — Authentication & Role Management

**Tujuan:** Membangun sistem autentikasi dan hak akses pengguna, sebagai prasyarat sebelum beli/baca/langganan (Sprint 3).

**Backlog**

*Authentication*
- [ ] Registrasi akun (ganti `AuthModal.tsx` dari dummy ke API asli)
- [ ] Login
- [ ] Logout
- [ ] Forgot Password
- [ ] Reset Password
- [ ] Verifikasi Email

*Role Management*
- [ ] Role Pembaca (customer)
- [ ] Role Admin
- [ ] Protected Route (khusus halaman beli, baca, dan dashboard di sprint berikutnya)
- [ ] Session Management

*Profil*
- [ ] Lihat Profil (nama, email, avatar)
- [ ] Edit Profil
- [ ] Ganti Password

**Testing**
- [ ] Login berhasil
- [ ] Login gagal
- [ ] Logout
- [ ] Reset Password
- [ ] Hak akses sesuai role
- [ ] Menu Navbar berubah dari "Login" jadi "Profil" setelah login berhasil

**Acceptance Criteria**
- User dapat register & login
- Session berjalan
- Hak akses sesuai role
- Setelah login, navbar menampilkan menu Profil

---

### Sprint 3 — Cart, Beli Buku & Baca (Wajib Login)

**Tujuan:** Membangun proses tambah keranjang, beli langsung, dan akses e-reader. Login baru diwajibkan di titik ini — saat user menekan "Beli" atau "Baca Sekarang".

**Backlog**

*Alur Redirect ke Login*
- [ ] Cek status login saat klik "Beli" / "Baca Sekarang" / "Berlangganan"
- [ ] Jika belum login → redirect ke halaman Login/Register, simpan intent buku yang dipilih
- [ ] Setelah login sukses → otomatis lanjut ke aksi yang tadi dituju (cart/reader)

*Cart & Beli*
- [ ] Tambah ke keranjang (`CartModal.tsx` → API asli, tersimpan per user)
- [ ] Hapus item dari keranjang
- [ ] Beli langsung (direct buy) tanpa lewat keranjang
- [ ] Cek buku sudah dimiliki (`owned_books`) sebelum bisa ditambah lagi

*E-Reader (untuk buku yang sudah dimiliki / sampel gratis)*
- [ ] `ReaderModal.tsx` ambil konten bab dari API/storage
- [ ] Proteksi akses: bab premium hanya terbuka jika buku sudah dibeli/berlangganan
- [ ] Update `reading_progress` (bab terakhir, persentase, tanggal terakhir baca) tiap kali user membaca

**Testing**
- [ ] User belum login diarahkan ke login saat klik Beli/Baca/Berlangganan
- [ ] Setelah login, kembali otomatis ke buku yang tadi dipilih
- [ ] Tambah ke keranjang berhasil
- [ ] Buku yang sudah dimiliki tidak bisa dibeli ulang
- [ ] Progress baca tersimpan dan muncul lagi saat buku dibuka ulang

**Acceptance Criteria**
- Beli dan baca hanya bisa dilakukan oleh user yang sudah login
- Keranjang tersimpan per user, tidak hilang saat refresh
- Progress baca konsisten antar sesi

---

### Sprint 4 — Pembayaran (Simulasi) & Langganan

**Tujuan:** Membangun alur checkout, langganan, dan perubahan status transaksi, tanpa integrasi payment gateway sungguhan. Perhitungan harga tetap berjalan normal, hanya eksekusi pembayarannya yang disimulasikan (auto-success/auto-failed, tidak connect ke bank/e-wallet asli).

**Backlog**

*Perhitungan Harga*
- [ ] Hitung subtotal, diskon, pajak dari isi keranjang
- [ ] Tampilkan rincian harga di ringkasan checkout (`CartModal.tsx`)

*Payment (Simulasi)*
- [ ] Halaman/step Pilih Metode Pembayaran (tampilan saja — transfer bank, e-wallet, dll, tidak terhubung ke API pihak ketiga)
- [ ] Tombol "Simulasi Bayar Berhasil"
- [ ] Tombol "Simulasi Bayar Gagal" (untuk testing skenario gagal)
- [ ] Klik simulasi → langsung update status transaksi di database (tanpa verifikasi/webhook eksternal)
- [ ] Halaman/state sukses
- [ ] Halaman/state gagal

*Langganan*
- [ ] `SubscriptionModal.tsx` → pilih paket (Bulanan/Tahunan) terhubung ke checkout simulasi
- [ ] Setelah "bayar" sukses → aktifkan `is_subscribed` & set `subscription_expiry`
- [ ] Buku `isPremiumOnly` otomatis terbuka untuk user berlangganan aktif

*Transaction Status*
- [ ] Pending
- [ ] Berhasil
- [ ] Diproses
- [ ] Gagal

*Notification*
- [ ] Notifikasi buku berhasil dibeli
- [ ] Notifikasi status pembayaran (`Toast.tsx`)

**Testing**
- [ ] Total harga terhitung benar (termasuk diskon/pajak)
- [ ] Simulasi pembayaran berhasil → buku masuk `owned_books` / langganan aktif
- [ ] Simulasi pembayaran gagal → status transaksi jadi "Gagal", buku tidak masuk ke akun
- [ ] Status berubah otomatis sesuai hasil simulasi

**Acceptance Criteria**
- Total harga tampil dan terhitung dengan benar
- User bisa menyelesaikan alur "pembayaran" lewat simulasi (tanpa payment gateway sungguhan)
- Status transaksi & kepemilikan buku/langganan berubah sesuai hasil simulasi

---

### Sprint 5 — Dashboard Customer & Admin

**Tujuan:** Menyediakan dashboard untuk pembaca dan admin, diakses lewat menu Profil.

**Backlog**

*Dashboard Pembaca (di dalam menu Profil)*
- [ ] Ringkasan Akun (status langganan, target baca bulanan)
- [ ] Rak Buku Saya (`MyLibraryModal.tsx` — buku dimiliki, favorit)
- [ ] Riwayat Baca & Transaksi (`HistoryView.tsx` — dari database, bukan state lokal)
- [ ] Edit Profil (terhubung dengan Sprint 2)

*Dashboard Admin*
- [ ] Dashboard ringkasan (jumlah user, buku, transaksi)
- [ ] CRUD Buku & Bab (upload cover, tulis/upload konten bab)
- [ ] Kelola Transaksi (lihat semua transaksi & status)
- [ ] Kelola User (lihat daftar user, status langganan)

**Testing**
- [ ] CRUD buku berjalan
- [ ] Dashboard admin menampilkan data realtime dari database
- [ ] Pembaca hanya melihat data miliknya sendiri (rak buku, riwayat, progress)

**Acceptance Criteria**
- Pembaca melihat rak buku & riwayat lewat menu Profil
- Admin bisa mengelola buku, transaksi, dan user

---

### Sprint 6 — Review, Laporan, Finishing & Deployment

**Tujuan:** Melengkapi fitur pendukung, menyelesaikan MVP, dan deployment.

**Backlog**

*Review*
- [ ] Rating buku
- [ ] Ulasan (comment) — mengganti `rating`/`reviewCount` statis di mock data jadi dinamis

*Laporan*
- [ ] Laporan Transaksi & Buku Terlaris (Admin)
- [ ] Export ke PDF/Excel

*Testing*
- [ ] Functional Testing (seluruh alur: browse → login → beli/langganan → baca → dashboard)
- [ ] Integration Testing
- [ ] Bug Fix

*Deployment*
- [ ] Deploy (Vercel/Railway/dsb)
- [ ] Konfigurasi Environment
- [ ] Verifikasi Production

**Acceptance Criteria**
- Seluruh fitur MVP berjalan sesuai alur: browse bebas → login saat beli/baca → bayar simulasi → dashboard
- Tidak ada bug kritis
- Aplikasi berhasil di-deploy

---

### Ringkasan Sprint

| Sprint | Fokus | Output |
|--------|-------|--------|
| Sprint 0 | Persiapan Lingkungan | Project siap dikembangkan |
| Sprint 1 | Landing, Navigasi & Browse Katalog | Beranda, 4 menu navbar, list & detail buku tanpa login |
| Sprint 2 | Authentication | Login, Register, Role Management, Profil |
| Sprint 3 | Cart, Beli & Baca | Redirect login saat "Beli/Baca", cart, e-reader dengan progress |
| Sprint 4 | Pembayaran (Simulasi) & Langganan | Hitung harga, simulasi bayar, status transaksi, langganan aktif |
| Sprint 5 | Dashboard | Rak buku & riwayat (Pembaca), Dashboard Admin |
| Sprint 6 | Finishing | Review, Laporan, Testing & Deployment |

### Diagram Alur Pengguna (User Flow)

```
[Halaman: Beranda]
   Navbar: Beranda | Katalog | Tentang Kami | Login (belum login) / Profil (sudah login)
        │
        ├──> klik "Tentang Kami" ──> [Halaman: Tentang Kami] (jalur buntu, sekadar info)
        │
        └──> klik "Katalog" (atau search box di Beranda)
                 │
                 ▼
        [Halaman: Katalog Buku]
           - Search
           - Filter (genre, badge, harga)
           - Sorting
           - Pagination
                 │
                 ▼
        [Halaman: Detail Buku]
           - Sinopsis, penulis, rating, daftar bab
           - Tombol "Beli" / "Baca Sekarang" / "Berlangganan"
                 │
                 ▼
        [Cek status login]
                 │
        ┌────────┴────────┐
     belum login        sudah login
        │                    │
        ▼                    │
[Halaman: Login/Register]     │
   - Login / Daftar akun      │
   - Setelah sukses, sistem   │
     ingat buku/aksi tadi     │
        │                    │
        └────────┬───────────┘
                 ▼
        ┌────────┴─────────┐
     "Beli"              "Baca Sekarang"
        │                    │
        ▼                    ▼
[Halaman: Keranjang]   [Cek: buku dimiliki/premium?]
   - Ringkasan harga         │
   - Tombol "Checkout"   ┌───┴───┐
        │               ya      tidak
        ▼                │       │
[Halaman: Metode          ▼       ▼
 Pembayaran]        [E-Reader] [ke alur "Beli"/"Berlangganan"]
   - Pilih metode
     (tampilan saja)
   - Tombol "Bayar Sekarang"
        │
        ▼
[Halaman: Simulasi Pembayaran]
   - Tombol "Simulasi Berhasil" / "Simulasi Gagal"
        │
   ┌────┴────┐
Berhasil    Gagal
   │           │
   ▼           ▼
[Buku masuk  [Halaman: Pembayaran
 ke akun /      Gagal]
 langganan      - Tombol "Coba Lagi"
 aktif]         (balik ke Metode Pembayaran)
   │
   ▼
[Menu: Profil > Rak Buku Saya / Riwayat]
   - Lihat buku dimiliki & progress baca
   - Beri Rating & Ulasan (setelah baca)
```

---

*Dokumen ini dibuat berdasarkan analisis kode prototype yang di-upload (BacaKita — Platform Buku Digital, React + Vite + Tailwind, AI Studio).*

---

### Lampiran Khusus: Aturan Akses (Access Control Strict Mode)

Sesuai dengan instruksi utama proyek, aturan ini bersifat mutlak dan tidak boleh dilanggar dalam sprint apa pun:

**1. Sebelum Login (Guest)**
- Guest **hanya dapat melihat (view only)**.
- Halaman yang diizinkan: **Beranda, Katalog Buku, Detail Buku, Pencarian, Genre/Kategori**.
- Aktivitas yang diizinkan: Melihat daftar buku, detail buku, banner, rekomendasi, pencarian, dan penjelajahan genre.
- **Dilarang keras:** Membeli, membaca isi buku, menambahkan favorit/wishlist/keranjang, checkout, berlangganan, melihat dashboard, riwayat, atau profil.
- Apabila Guest menekan tombol aktivitas apa pun yang dilarang, **sistem wajib membelokkan (redirect) pengguna ke halaman Login**.

**2. Setelah Login (Authenticated User)**
- Status berubah menjadi Authenticated User.
- Semua fitur baru dapat digunakan (Membeli, Berlangganan, Membaca, Favorit, Keranjang, Checkout, Riwayat, Dashboard, Profil).
- Seluruh transaksi dan interaksi manipulasi data wajib terlindungi oleh login.

**3. Logout**
- Session & token wajib dihapus.
- Status kembali murni menjadi Guest (View Only).
- Pengguna **langsung diarahkan kembali ke Beranda (Home)** setelah logout.
- Ingin bertransaksi lagi? Wajib login kembali.
