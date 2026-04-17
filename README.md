# 🏨 RoomMaster — Hotel Property Management System

RoomMaster adalah aplikasi web **Property Management System (PMS)** modern yang dirancang untuk mengelola operasional hotel secara terpusat maupun per-properti. Dibangun dengan arsitektur **multi-hotel** dan sistem **Role-Based Access Control (RBAC)** yang granular, RoomMaster memungkinkan berbagai peran staf hotel — mulai dari Super Admin hingga Housekeeping — untuk bekerja dalam satu platform yang terintegrasi.

---

## ✨ Fitur Utama

### 👑 Super Admin
Mengelola seluruh jaringan hotel dari satu dashboard terpusat.

| Fitur | Deskripsi |
|---|---|
| Manajemen Hotel | CRUD properti hotel (nama, lokasi, kontak, jam operasional) |
| Manajemen User | Membuat akun staf dan menetapkan peran & hotel melalui sistem `user_roles` |
| Dashboard Global | Ringkasan statistik seluruh jaringan hotel |

---

### 🧑‍💼 Hotel Admin
Mengelola master data dan konfigurasi operasional hotel yang ditugaskan.

| Fitur | Deskripsi |
|---|---|
| Tipe Kamar | CRUD tipe kamar (Standard, Deluxe, Suite, dll.) |
| Manajemen Kamar | CRUD kamar, status kamar (available, occupied, maintenance) |
| Manajemen Tamu | CRUD data tamu |
| Manajemen Staf | Kelola daftar staf hotel |
| Dashboard Hotel | Statistik kunci: kamar tersedia, check-in hari ini, pendapatan |

---

### 📋 Hotel Manager
Mengawasi operasional dan performa hotel secara keseluruhan.

| Fitur | Deskripsi |
|---|---|
| Dashboard | Overview performa hotel dan KPI harian |
| Reports | Laporan pendapatan, okupansi, dan aktivitas |
| Tipe & Kamar | Pantau status tipe kamar dan kamar |
| Reservasi | Kelola dan pantau semua reservasi |
| Guest Folio | Data lengkap tamu dan riwayat menginap |
| Loyalty Program | Kelola program loyalitas tamu |

---

### 🛎️ Front Office (FO)
Menangani operasional meja depan alias reception desk sehari-hari.

| Fitur | Deskripsi |
|---|---|
| Dashboard | Ringkasan aktivitas hari ini |
| Check-In / Check-Out | Proses check-in dan check-out tamu |
| Reservasi | Buat dan kelola reservasi |
| Guest Folio | Lihat dan update data tamu |
| Room Availability | Cek ketersediaan kamar secara real-time |
| Billing & Folio | Kelola tagihan dan folio pembayaran tamu |

---

### 🧹 Housekeeping
Portal khusus untuk tim kebersihan dan pemeliharaan kamar.

| Fitur | Deskripsi |
|---|---|
| Dashboard | Ringkasan tugas dan status kamar |
| My Tasks | Daftar tugas pembersihan yang ditugaskan |
| Report | Laporkan kerusakan atau masalah di kamar |

---

## 🚀 Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) + React 19 |
| **Language** | TypeScript |
| **UI Library** | [Mantine UI v8](https://mantine.dev/) |
| **Icons** | [Tabler Icons](https://tabler.io/icons) |
| **Database** | PostgreSQL (via Supabase) |
| **Auth** | Supabase Auth |
| **ORM / API Client** | Supabase JS Client v2 |
| **Data Fetching** | TanStack Query v5 + SWR |
| **Forms & Validation** | Mantine Form + Zod |
| **Tables** | Mantine DataTable |
| **Charts** | ApexCharts + Recharts |
| **Calendar** | FullCalendar (daygrid, timegrid, resource-timeline) |
| **AI Integration** | OpenAI API |
| **Date Utility** | Day.js |
| **Drag & Drop** | DND Kit |
| **Styling** | Tailwind CSS v4 + PostCSS Mantine |
| **Linting** | ESLint (Next.js config) |

---

## 🏗️ Arsitektur Sistem

### Struktur Role (RBAC)

```
Super Admin
└── mengelola seluruh jaringan hotel & user

Hotel Admin          ← ditugaskan ke 1 hotel
├── Hotel Manager    ← laporan, reservasi, loyalty
├── Front Office     ← check-in/out, billing, tamu
└── Housekeeping     ← tugas kebersihan, laporan kamar
```

Setiap role memiliki panel/dashboard terpisah dengan navigasi dan akses data yang disesuaikan. Proteksi dilakukan lewat:
- **Middleware Next.js** — memeriksa sesi sebelum halaman di-render
- **`ProtectedRoute` Component** — validasi `role_name` di sisi client
- **Supabase Row Level Security (RLS)** — keamanan di level database

### Struktur Database Utama

```
hotels
profiles          ← data user (nama, dll.)
user_roles        ← relasi user ↔ role ↔ hotel
roles
permissions
role_permissions
room_types        ← tipe kamar per hotel
rooms             ← kamar individual
guests            ← data tamu
reservations      ← data reservasi
housekeeping_tasks ← tugas housekeeping
loyalty_members   ← program loyalitas
```

---

## 📁 Struktur Proyek

```
src/
├── app/
│   ├── super-admin/       # Dashboard, Hotels, Users
│   ├── admin/             # Dashboard, Room Types, Rooms, Guests, Staff
│   ├── manager/           # Dashboard, Reports, Rooms, Reservations, Loyalty
│   ├── fo/                # Dashboard, Check-In, Reservations, Billing
│   ├── housekeeping/      # Dashboard, Tasks, Report
│   └── auth/              # Login, Register
│
├── features/
│   ├── auth/              # useAuth, LoginForm, RegisterForm, ProtectedRoute
│   ├── admin/             # Fitur Hotel Admin
│   ├── super-admin/       # Fitur Super Admin
│   ├── master-data/       # Room types, Rooms
│   ├── guest/             # Manajemen tamu
│   ├── reservation/       # Manajemen reservasi
│   ├── room/              # Status & ketersediaan kamar
│   └── transaction/       # Billing & transaksi
│
├── core/
│   ├── config/            # supabaseClient, env, routes
│   ├── constants/         # Daftar roles
│   ├── hooks/             # Shared hooks
│   ├── providers/         # AppProvider (Mantine, QueryClient, dll.)
│   └── types/             # database.ts (generated types)
│
└── components/
    ├── charts/
    ├── feedback/
    ├── forms/
    └── layout/

supabase/
└── migrations/            # SQL schema & migration files
```

---

## 🛠️ Cara Menjalankan Secara Lokal

### Prasyarat

- Node.js >= 18
- npm
- Akun [Supabase](https://supabase.com/) (project aktif)

### Langkah Instalasi

```bash
# 1. Clone repositori
git clone <repo-url>
cd roommaster

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.local.example .env.local
# Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Scripts

| Command | Deskripsi |
|---|---|
| `npm run dev` | Jalankan dev server (Turbopack) |
| `npm run build` | Build production (Turbopack) |
| `npm run start` | Jalankan production server |
| `npm run lint` | Lint kode dengan ESLint |

---

## 🔐 Environment Variables

Buat file `.env.local` di root project dengan variabel berikut:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-key   # Opsional, untuk fitur AI Agent
```

---

## 📌 Status Proyek

> ⚠️ Proyek ini sedang dalam **pengembangan aktif**.

Beberapa area yang masih dikembangkan:
- Implementasi penuh kebijakan **RLS** untuk semua peran
- Penambahan fitur **AI Agent** di panel Manager & FO
- Pengembangan **Loyalty Program** lebih lanjut
- Analitik agregat untuk **Super Admin**