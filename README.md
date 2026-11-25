# 🍗 FinStocks — Sistem Informasi Manajemen Keuangan & Persediaan

> Aplikasi web untuk UMKM **Mak Tunik** yang mendigitalisasi pencatatan transaksi, monitoring stok bahan baku, dan pembuatan laporan keuangan otomatis.

---

## 📋 Deskripsi

FinStocks adalah Sistem Informasi Manajemen berbasis web yang dirancang khusus untuk UMKM Mak Tunik (gerai ayam bakar). Sistem ini menggantikan pencatatan manual menjadi digital dengan fitur:

- **Dashboard Analitik** — Ringkasan penjualan, stok kritis, menu terlaris
- **Manajemen Transaksi** — Input POS kasir, riwayat, filter, detail
- **Monitoring Persediaan** — CRUD bahan baku, restock, riwayat stok, level indikator
- **Laporan Keuangan** — Pendapatan, pengeluaran, laba bersih per periode + export PDF/Excel
- **Manajemen Pengguna** — CRUD user dengan role OWNER & KARYAWAN
- **Role-Based Access Control** — Owner akses penuh, Karyawan sesuai izin fitur
- **Autentikasi** — Login dengan email/username atau akun Google, lupa password via email
- **Pendaftaran Akun dengan Persetujuan Owner** — Pendaftar memverifikasi email, akun baru dibuat setelah owner (superadmin) menyetujui
- **Aturan Password** — 8–16 karakter, minimal 1 huruf besar dan 1 angka

> 📖 Detail arsitektur, alur, dan konfigurasi autentikasi: [docs/AUTH.md](docs/AUTH.md)

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 19 (Vite), Tailwind CSS 3, Zustand, Recharts |
| Backend | Node.js, Express 5, Prisma ORM 5 |
| Database | MySQL 8 |
| Auth | JWT (jsonwebtoken) + bcryptjs, Google Identity Services (google-auth-library), express-rate-limit |
| Email | nodemailer (SMTP Gmail + App Password) |
| Export | pdfkit (PDF), exceljs (Excel) |

---

## 🚀 Cara Menjalankan (Development)

### Prasyarat

- Node.js ≥ 20.x
- MySQL 8.x (running di localhost:3306)
- npm atau yarn

### 1. Clone Repository

```bash
git clone <repo-url>
cd finstocks
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Salin file environment
cp .env.example .env
# Edit .env → isi DATABASE_URL, JWT_SECRET
# Opsional: GOOGLE_CLIENT_ID (login Google) dan SMTP_* (pengiriman email)
# Tanpa SMTP, isi email (link verifikasi/reset) dicetak di terminal backend

# Buat database MySQL
# mysql -u root -p -e "CREATE DATABASE finstocks_db;"

# Jalankan migrasi Prisma
npx prisma migrate dev

# Isi data awal (seed)
npx prisma db seed

# Jalankan server backend
npm run dev
```

Server backend akan berjalan di `http://localhost:5000`

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Salin file environment
cp .env.example .env
# Opsional: isi VITE_GOOGLE_CLIENT_ID untuk menampilkan tombol "Masuk dengan Google"

# Jalankan frontend
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

### 4. Akun Default (Seed Data)

| Username | Password | Role |
|---|---|---|
| `owner` | `Owner123` | OWNER |
| `karyawan1` | `Karyawan123` | KARYAWAN |
| `karyawan2` | `Karyawan123` | KARYAWAN |

> Database yang di-seed sebelum aturan password baru tetap memakai password lama (`owner123` / `karyawan123`). Aturan password hanya berlaku saat password dibuat atau diubah.
>
> Setelah login pertama, owner sebaiknya mengisi **email** di halaman Pengguna agar menerima notifikasi pendaftaran baru, bisa masuk dengan Google, dan bisa memakai fitur lupa password.

---

## 📁 Struktur Folder

```
finstocks/
├── backend/
│   ├── prisma/              # Schema & seed
│   ├── src/
│   │   ├── config/          # Koneksi database, konfigurasi auth, daftar izin
│   │   ├── middlewares/      # Auth, role, validasi, rate limit
│   │   ├── modules/          # 10 modul (auth, pendaftaran, transaksi, persediaan, dll)
│   │   ├── services/         # Layanan lintas modul (email, notifikasi, Google, log)
│   │   ├── utils/            # Response, JWT, AppError, asyncHandler, password, token
│   │   └── index.js          # Entry point Express
│   ├── Dockerfile
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/              # Axios instance + modul API (authApi, pendaftaranApi)
    │   ├── components/       # UI, Layout, auth/ (form login), pengguna/ (persetujuan akun)
    │   ├── constants/        # Daftar izin fitur
    │   ├── hooks/            # Custom hooks (useGoogleIdentity, useSortableData)
    │   ├── pages/            # Halaman aplikasi + pages/auth (login, daftar, reset, verifikasi)
    │   ├── store/            # Zustand auth store
    │   └── utils/            # Format, aturan password, helper error & Google
    ├── vercel.json
    └── package.json
```

---

## 🔌 API Endpoints

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Login (email/username + password) | ❌ |
| POST | `/api/auth/google` | Login dengan akun Google | ❌ |
| POST | `/api/auth/forgot-password` | Kirim link reset password ke email | ❌ |
| POST | `/api/auth/reset-password` | Simpan password baru dari link email | ❌ |
| GET | `/api/auth/me` | Profil user login | ✅ |
| POST | `/api/auth/logout` | Logout | ✅ |
| POST | `/api/pendaftaran` | Ajukan pendaftaran akun | ❌ |
| POST | `/api/pendaftaran/verifikasi-email` | Verifikasi email pendaftar | ❌ |
| GET | `/api/pendaftaran` | List permintaan akun | ✅ OWNER |
| PUT | `/api/pendaftaran/:id/setujui` | Setujui & buat akun | ✅ OWNER |
| PUT | `/api/pendaftaran/:id/tolak` | Tolak permintaan akun | ✅ OWNER |
| GET/POST | `/api/transaksi` | List / Buat transaksi | ✅ |
| GET/PUT/DELETE | `/api/transaksi/:id` | Detail / Update / Hapus | ✅ |
| PUT | `/api/transaksi/:id/status` | Update status | ✅ OWNER |
| GET/POST | `/api/persediaan` | List / Tambah bahan | ✅ OWNER |
| PUT/DELETE | `/api/persediaan/:id` | Edit / Hapus bahan | ✅ OWNER |
| POST | `/api/persediaan/:id/restock` | Input stok masuk | ✅ OWNER |
| GET | `/api/persediaan/riwayat` | Riwayat stok | ✅ OWNER |
| GET/POST | `/api/menu` | List / Tambah menu | ✅ |
| PUT/DELETE | `/api/menu/:id` | Edit / Hapus menu | ✅ OWNER |
| GET | `/api/dashboard/summary` | Ringkasan hari ini | ✅ |
| GET | `/api/dashboard/grafik` | Data grafik 7 hari | ✅ |
| GET | `/api/dashboard/menu-terlaris` | Top 5 menu | ✅ |
| GET | `/api/dashboard/stok-kritis` | Peringatan stok | ✅ |
| GET | `/api/laporan/keuangan` | Data laporan periode | ✅ OWNER |
| GET | `/api/laporan/export/pdf` | Download PDF | ✅ OWNER |
| GET | `/api/laporan/export/excel` | Download Excel | ✅ OWNER |
| GET/POST | `/api/pengguna` | List / Tambah pengguna | ✅ OWNER |
| PUT/DELETE | `/api/pengguna/:id` | Edit / Hapus pengguna | ✅ OWNER |
| PUT | `/api/pengguna/:id/reset-password` | Reset password | ✅ OWNER |

---

## 🚢 Deployment

### Frontend → Vercel

1. Push repo ke GitHub
2. Import project di [vercel.com](https://vercel.com)
3. Set **Root Directory** = `frontend`
4. Set **Build Command** = `npm run build`
5. Set **Output Directory** = `dist`
6. Tambahkan Environment Variable: `VITE_API_BASE_URL` = URL backend production, `VITE_GOOGLE_CLIENT_ID` = Client ID Google

### Backend → Railway / Render

1. Import repo di [railway.app](https://railway.app) atau [render.com](https://render.com)
2. Set **Root Directory** = `backend`
3. Tambahkan MySQL add-on (Railway) atau gunakan PlanetScale
4. Set Environment Variables:
   - `DATABASE_URL` = MySQL connection string
   - `JWT_SECRET` = Secret key untuk JWT
   - `JWT_EXPIRES_IN` = `8h`
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = URL frontend Vercel (juga dipakai untuk link di email)
   - `GOOGLE_CLIENT_ID` = Client ID OAuth Google (tambahkan URL Vercel ke *Authorized JavaScript origins*)
   - `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` = akun Gmail + App Password (wajib di production)
5. Deploy

---

## 📄 Lisensi

Hak Milik UMKM Mak Tunik © 2026
Dibuat oleh Tim Pengembangan FinStocks — Mata Kuliah MPPL
