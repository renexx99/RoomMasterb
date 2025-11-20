'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerActionClient({ 
    cookies: () => cookieStore as any 
  });
}

/**
 * Mengupdate profil staf (hanya nama, karena email terikat Auth)
 */
export async function updateStaffProfile(id: string, fullName: string) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/staff');
  return { success: true };
}

/**
 * Mendaftarkan data staf ke database (Profiles & User Roles)
 * Dipanggil SETELAH sukses signUp di client-side.
 */
export async function registerStaffInDb(params: {
  userId: string;
  email: string;
  fullName: string;
  roleId: string;
  hotelId: string;
}) {
  const supabase = await getSupabase();
  const { userId, email, fullName, roleId, hotelId } = params;

  // 1. Insert ke tabel profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: email,
      full_name: fullName,
      role: null, // Field legacy
      hotel_id: null, // Field legacy
    });

  if (profileError) return { error: `Gagal membuat profil: ${profileError.message}` };

  // 2. Insert ke tabel user_roles
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role_id: roleId,
      hotel_id: hotelId,
    });

  if (roleError) return { error: `Gagal menetapkan peran: ${roleError.message}` };

  revalidatePath('/admin/staff');
  return { success: true };
}

/**
 * Menetapkan (Assign) atau Mengubah Peran Staf
 */
export async function assignStaffRole(userId: string, roleId: string, hotelId: string) {
  const supabase = await getSupabase();

  // Upsert: Update jika ada, Insert jika belum (dengan asumsi constraint user_id + hotel_id unik)
  // Jika constraint belum ada, ini akan insert baris baru. 
  // Untuk keamanan logika, kita coba DELETE dulu lalu INSERT (atau update jika id diketahui).
  // Menggunakan upsert pada conflict (user_id, hotel_id) adalah cara terbaik jika constraint ada.
  // Jika tidak yakin, kita gunakan strategi: Delete existing for this hotel -> Insert new.
  
  // Strategi Aman: Hapus role lama user ini di hotel ini, lalu insert baru.
  // Ini memastikan 1 user hanya punya 1 role per hotel.
  
  const { error: deleteError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('hotel_id', hotelId);

  if (deleteError) return { error: `Gagal menghapus peran lama: ${deleteError.message}` };

  const { error: insertError } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role_id: roleId,
      hotel_id: hotelId,
    });

  if (insertError) return { error: insertError.message };

  revalidatePath('/admin/staff');
  return { success: true };
}

/**
 * Menghapus Peran Staf dari Hotel (Revoke Access)
 */
export async function removeStaffRole(userId: string, hotelId: string) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('hotel_id', hotelId);

  if (error) return { error: error.message };

  revalidatePath('/admin/staff');
  return { success: true };
}