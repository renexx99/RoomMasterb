-- 1. Buat Tabel `roles`
-- Menyimpan daftar peran yang tersedia dalam sistem.
CREATE TABLE IF NOT EXISTS public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,          -- Nama peran (e.g., 'Super Admin', 'Hotel Manager', 'Front Office')
    description text,                   -- Deskripsi singkat peran
    -- level integer,                   -- Opsional: Level hierarki jika diperlukan
    created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.roles IS 'Daftar peran pengguna dalam sistem.';
COMMENT ON COLUMN public.roles.name IS 'Nama unik untuk peran.';
-- COMMENT ON COLUMN public.roles.level IS 'Level hierarki peran (opsional).';

-- 2. Buat Tabel `permissions`
-- Menyimpan daftar izin/hak akses yang bisa dimiliki oleh peran.
CREATE TABLE IF NOT EXISTS public.permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action text NOT NULL UNIQUE,        -- Nama aksi/izin (e.g., 'manage_hotels', 'create_reservation', 'view_reports')
    description text,                   -- Deskripsi singkat izin
    created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.permissions IS 'Daftar izin/hak akses spesifik dalam sistem.';
COMMENT ON COLUMN public.permissions.action IS 'Nama unik untuk aksi/izin.';

-- 3. Buat Tabel Hubung `role_permissions` (Many-to-Many)
-- Menghubungkan peran dengan izin yang dimilikinya.
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (role_id, permission_id) -- Composite primary key
);
COMMENT ON TABLE public.role_permissions IS 'Tabel penghubung antara peran dan izin.';

-- 4. Buat Tabel Hubung `user_roles` (Many-to-Many)
-- Menghubungkan pengguna (profiles) dengan peran yang mereka miliki di hotel tertentu.
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE, -- Bisa NULL untuk Super Admin
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, role_id, hotel_id) -- User bisa punya role sama di hotel berbeda? Jika tidak, PK cukup (user_id, role_id)
    -- Jika user hanya bisa punya SATU role per hotel, tambahkan UNIQUE constraint:
    -- CONSTRAINT user_hotel_unique_role UNIQUE (user_id, hotel_id)
);
COMMENT ON TABLE public.user_roles IS 'Menetapkan peran untuk pengguna di hotel tertentu (jika relevan).';
COMMENT ON COLUMN public.user_roles.hotel_id IS 'Hotel tempat peran ini berlaku. NULL jika peran global (misal Super Admin).';


-- 5. (Opsional tapi Direkomendasikan) Ubah Kolom `role` lama di `profiles`
-- Anda bisa membuatnya nullable atau menghapusnya setelah migrasi data selesai.
-- Membuatnya nullable memungkinkan transisi bertahap.
ALTER TABLE public.profiles
  ALTER COLUMN role DROP NOT NULL,           -- Hapus constraint NOT NULL
  ALTER COLUMN role DROP CONSTRAINT profiles_role_check; -- Hapus constraint CHECK lama

-- Anda mungkin ingin mengganti nama kolom lama untuk menandainya sebagai usang
-- ALTER TABLE public.profiles RENAME COLUMN role TO old_role;

-- Tambahkan CHECK constraint baru jika kolom 'role' dipertahankan untuk sementara (opsional)
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check_nullable CHECK (role IS NULL OR role = ANY (ARRAY['super_admin'::text, 'hotel_admin'::text]));


-- 6. (Sangat Penting) Aktifkan RLS pada Tabel Baru
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 7. Buat Kebijakan RLS Dasar untuk Tabel Baru (CONTOH - HARUS DISESUAIKAN!)
-- Kebijakan ini sangat permisif dan HANYA sebagai contoh awal.
-- ANDA HARUS membuat kebijakan yang lebih spesifik sesuai kebutuhan keamanan Anda.

-- Contoh: Hanya authenticated user yang bisa membaca roles dan permissions
CREATE POLICY "Allow authenticated read access to roles" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access to permissions" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access to role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- Contoh: User bisa melihat roles mereka sendiri, Super Admin bisa lihat semua
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Super Admins can view all user roles" ON public.user_roles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')); -- Menggunakan kolom 'role' lama untuk sementara

-- Contoh: Hanya Super Admin yang bisa memodifikasi roles, permissions, role_permissions
CREATE POLICY "Allow Super Admins full access to roles" ON public.roles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Allow Super Admins full access to permissions" ON public.permissions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Allow Super Admins full access to role_permissions" ON public.role_permissions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Contoh: Super Admin bisa manage semua user_roles, Hotel Admin bisa manage user di hotelnya (Perlu disesuaikan!)
CREATE POLICY "Allow Super Admins full access to user_roles" ON public.user_roles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
-- Kebijakan untuk Hotel Admin mengelola user di hotelnya perlu logika yang lebih kompleks


-- 8. Isi Data Awal untuk Roles (Contoh)
INSERT INTO public.roles (name, description) VALUES
    ('Super Admin', 'Manajemen sistem secara keseluruhan'),
    ('Hotel Admin', 'Administrator utama untuk satu hotel'),
    ('Hotel Manager', 'Manajer operasional hotel'),
    ('Front Office', 'Staf resepsionis'),
    ('Housekeeping Supervisor', 'Supervisor kebersihan')
ON CONFLICT (name) DO NOTHING; -- Hindari duplikasi jika skrip dijalankan ulang


-- 9. Isi Data Awal untuk Permissions (Contoh)
INSERT INTO public.permissions (action, description) VALUES
    ('manage_system_settings', 'Mengelola pengaturan global sistem'),
    ('manage_all_hotels', 'CRUD untuk semua data hotel'),
    ('manage_all_users', 'CRUD untuk semua pengguna dan peran'),
    ('view_all_reports', 'Melihat laporan agregat semua hotel'),
    ('manage_hotel_details', 'Mengubah detail hotel sendiri'),
    ('manage_hotel_roles', 'Mengelola peran pengguna di hotel sendiri'),
    ('manage_hotel_staff', 'CRUD staf di hotel sendiri'),
    ('manage_room_types', 'CRUD tipe kamar di hotel sendiri'),
    ('manage_rooms', 'CRUD kamar di hotel sendiri'),
    ('manage_guests', 'CRUD tamu di hotel sendiri'),
    ('manage_reservations', 'CRUD reservasi di hotel sendiri'),
    ('view_hotel_reports', 'Melihat laporan spesifik hotel sendiri'),
    ('create_reservation', 'Membuat reservasi baru'),
    ('check_in_guest', 'Melakukan proses check-in tamu'),
    ('check_out_guest', 'Melakukan proses check-out tamu'),
    ('view_reservations', 'Melihat daftar reservasi'),
    ('update_room_status', 'Mengubah status kamar (e.g., cleaning, maintenance)')
ON CONFLICT (action) DO NOTHING;


-- 10. Hubungkan Roles dengan Permissions (Contoh - HARUS DISESUAIKAN!)
-- Super Admin: Punya semua hak
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'Super Admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Hotel Admin: Punya semua hak di hotelnya KECUALI yang sistem global
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'Hotel Admin'
AND p.action NOT IN ('manage_system_settings', 'manage_all_hotels', 'manage_all_users', 'view_all_reports')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Front Office: Hanya terkait reservasi dan tamu
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'Front Office'
AND p.action IN ('create_reservation', 'check_in_guest', 'check_out_guest', 'view_reservations', 'manage_guests', 'view_hotel_reports') -- Tambahkan view_hotel_reports
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Tambahkan mapping untuk peran lain sesuai kebutuhan...