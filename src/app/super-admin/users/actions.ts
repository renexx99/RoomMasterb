'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerActionClient({ cookies: () => cookieStore as any });
}

export interface UserFormData {
  email: string;
  full_name: string;
  role_id: string; // Kita simpan ID Role, bukan nama string
  hotel_id?: string;
  password?: string;
}

// --- CREATE USER ---
export async function createUserAction(data: UserFormData) {
  // CATATAN PENTING:
  // Fungsi ini hanya simulasi insert data ke tabel 'profiles' dan 'user_roles'.
  // Untuk membuat user Auth (login) yang sebenarnya, Anda harus menggunakan:
  // 1. Supabase Admin Auth Client (butuh service_role key), ATAU
  // 2. User melakukan Sign Up sendiri di halaman register.
  
  const supabase = await getSupabase();

  // 1. (Simulasi) Create Profile - Asumsi user ID diambil dari Auth (disini kita pakai dummy UUID untuk demo jika auth belum integrasi)
  // Pada real-app, profile ini otomatis terbuat via Trigger saat user Sign Up.
  // Untuk Admin Create User, kita biasanya memanggil Edge Function atau API Route khusus.
  return { error: "Fitur Create User (Auth) memerlukan konfigurasi Service Role. Silakan gunakan halaman Register untuk saat ini." };
}

// --- UPDATE USER ---
export async function updateUserAction(userId: string, data: Partial<UserFormData>) {
  const supabase = await getSupabase();

  // 1. Update Nama di Profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: data.full_name })
    .eq('id', userId);

  if (profileError) return { error: `Gagal update profil: ${profileError.message}` };

  // 2. Update Role & Hotel (di tabel user_roles)
  if (data.role_id) {
    // Strategi: Hapus role lama, masukkan role baru (agar bersih 1 user = 1 role aktif)
    
    // A. Hapus relasi lama
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteError) return { error: `Gagal menghapus role lama: ${deleteError.message}` };

    // B. Masukkan relasi baru
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: data.role_id,
        hotel_id: data.hotel_id || null, // Hotel ID bisa null jika Super Admin
      });

    if (insertError) return { error: `Gagal set role baru: ${insertError.message}` };
  }

  revalidatePath('/super-admin/users');
  return { success: true };
}

// --- DELETE USER ---
export async function deleteUserAction(id: string) {
  const supabase = await getSupabase();

  // Hapus role dulu (jika tidak cascade)
  await supabase.from('user_roles').delete().eq('user_id', id);
  
  // Hapus profile
  const { error } = await supabase.from('profiles').delete().eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/super-admin/users');
  return { success: true };
}