# RoomMaster - Property Management System 🏨

## 📜 Deskripsi Proyek

RoomMaster adalah aplikasi web **Property Management System (PMS)** yang sedang dikembangkan sebagai solusi terintegrasi untuk manajemen jaringan hotel (multi-hotel). Proyek ini dibangun menggunakan tumpukan teknologi modern dengan visi untuk menyediakan platform yang **aman**, **modular**, dan **scalable**, memungkinkan pengelolaan terpusat oleh administrator utama (Super Admin) serta pengelolaan operasional mandiri oleh setiap hotel (melalui Hotel Admin dan peran-peran di bawahnya).

## ✨ Fitur Utama (Pasca Refactor Backend)

Aplikasi ini dirancang dengan dua peran utama saat ini, dengan rencana pengembangan sistem multi-peran yang lebih granular di bawah Hotel Admin:

### 👑 Super Admin
* **Manajemen Hotel Global:** CRUD (Create, Read, Update, Delete) data properti hotel.
* **Manajemen User (Administrator Hotel):** Membuat akun untuk Hotel Admin, melihat daftar user, dan **mengelola penetapan peran dan hotel** melalui sistem `user_roles` yang baru. (*Catatan: UI untuk ini sedang direfactor*).
* **(Rencana)** **Analitik Agregat:** Melihat ringkasan performa seluruh jaringan hotel (okupansi, pendapatan, dll.).
* **Tidak Lagi Mengelola Operasional:** Fitur manajemen tipe kamar dan kamar telah dipindahkan dari Super Admin ke level Hotel Admin.

### 🧑‍💼 Hotel Admin & Sub-Roles (Dalam Pengembangan)
* **Fokus Operasional Hotel:** Mengelola semua aspek operasional hotel yang ditugaskan.
* **Sistem Multi-Role (Baru):** Fondasi backend telah dibangun untuk mendukung peran berjenjang di bawah Hotel Admin (contoh: Manager, Supervisor, Front Office, Finance) dengan hak akses berbeda (RBAC - Role-Based Access Control). *Implementasi penuh RBAC di frontend dan RLS detail sedang berlangsung.*
* **Manajemen Master Data Hotel:**
    * CRUD Tipe Kamar (Standard, Deluxe, Suite, dll.)
    * CRUD Kamar (Nomor kamar, status: tersedia, terisi, maintenance)
* **Manajemen Operasional:**
    * CRUD Tamu
    * CRUD Reservasi (termasuk pemilihan tamu, kamar, tanggal check-in/out, kalkulasi harga, status pembayaran)
* **Dashboard Hotel:** Melihat statistik kunci untuk hotel yang dikelola (kamar tersedia, check-in hari ini, dll.).

## 🚀 Tumpukan Teknologi (Tech Stack)

* **Frontend:** Next.js (App Router), TypeScript
* **UI Library:** Mantine UI
* **Backend & Database:** Supabase
    * Database: PostgreSQL
    * Authentication: Supabase Auth
    * Realtime & Storage: (Potensial digunakan di masa depan)
    * Keamanan: Row Level Security (RLS)

## 📊 Status Proyek & Progres Terbaru

* Proyek sedang dalam **pengembangan aktif**.
* **Refactor Backend Besar:** Telah dilakukan restrukturisasi signifikan pada skema database untuk mendukung sistem **multi-role** dan **RBAC**. Ini melibatkan:
    * Penambahan tabel: `roles`, `permissions`, `role_permissions`, `user_roles`.
    * Perubahan logika peran dari kolom `role` di tabel `profiles` ke tabel `user_roles`.
    * Penyesuaian Primary Key dan constraint pada `user_roles`.
    * Migrasi data peran awal dari `profiles` ke `user_roles`.
* **Adaptasi Frontend Awal:**
    * Komponen inti terkait autentikasi (`useAuth`, `LoginForm`, `RegisterForm`, `ProtectedRoute`) telah **diperbarui** untuk menggunakan struktur peran baru dari `user_roles`.
* **Langkah Berikutnya:**
    * Menulis ulang **kebijakan RLS** di Supabase agar sesuai dengan skema `user_roles` dan `permissions`.
    * **Refactor UI** halaman Super Admin User Management (`/super-admin/users`) untuk mengelola peran melalui tabel `user_roles`.
    * Implementasi penuh **pengecekan izin (permissions)** di frontend dan backend untuk fitur-fitur operasional.
    * Mengembangkan fitur spesifik untuk sub-role di bawah Hotel Admin.
    * Mengimplementasikan fitur analitik untuk Super Admin.


```
roommaster
├─ docs
├─ eslint.config.mjs
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ public
│  ├─ assets
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ README.md
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ dashboard
│  │  │  │  └─ page.tsx
│  │  │  ├─ guests
│  │  │  │  └─ page.tsx
│  │  │  ├─ layout.tsx
│  │  │  ├─ reservations
│  │  │  │  └─ page.tsx
│  │  │  ├─ room-types
│  │  │  │  └─ page.tsx
│  │  │  └─ rooms
│  │  │     └─ page.tsx
│  │  ├─ api
│  │  ├─ auth
│  │  │  ├─ layout.tsx
│  │  │  ├─ login
│  │  │  │  └─ page.tsx
│  │  │  └─ register
│  │  │     └─ page.tsx
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  └─ super-admin
│  │     ├─ dashboard
│  │     │  └─ page.tsx
│  │     ├─ hotels
│  │     │  ├─ page.tsx
│  │     │  └─ [hotelId]
│  │     ├─ layout.tsx
│  │     └─ users
│  │        └─ page.tsx
│  ├─ components
│  │  ├─ charts
│  │  ├─ feedback
│  │  ├─ forms
│  │  └─ layout
│  ├─ core
│  │  ├─ config
│  │  │  ├─ env.ts
│  │  │  ├─ routes.ts
│  │  │  └─ supabaseClient.ts
│  │  ├─ constants
│  │  │  └─ roles.ts
│  │  ├─ hooks
│  │  ├─ providers
│  │  │  └─ AppProvider.tsx
│  │  ├─ types
│  │  │  └─ database.ts
│  │  └─ utils
│  ├─ features
│  │  ├─ admin
│  │  │  ├─ components
│  │  │  ├─ hooks
│  │  │  ├─ models
│  │  │  ├─ repositories
│  │  │  └─ services
│  │  ├─ auth
│  │  │  ├─ components
│  │  │  │  ├─ LoginForm.tsx
│  │  │  │  ├─ ProtectedRoute.tsx
│  │  │  │  └─ RegisterForm.tsx
│  │  │  ├─ hooks
│  │  │  │  └─ useAuth.ts
│  │  │  ├─ models
│  │  │  ├─ repositories
│  │  │  └─ services
│  │  ├─ guest
│  │  ├─ master-data
│  │  │  ├─ hooks
│  │  │  ├─ models
│  │  │  ├─ repositories
│  │  │  └─ services
│  │  ├─ reservation
│  │  ├─ room
│  │  ├─ super-admin
│  │  │  ├─ components
│  │  │  ├─ hooks
│  │  │  ├─ models
│  │  │  ├─ repositories
│  │  │  └─ services
│  │  │     └─ index.ts
│  │  └─ transaction
│  ├─ global.css
│  ├─ lib
│  └─ middleware.ts
├─ supabase
│  └─ migrations
│     ├─ 001_create_profiles_and_hotels.sql
│     └─ RBAC_Schema.sql
└─ tsconfig.json

```