// src/app/fo/guests/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();
  // @ts-ignore
  return createServerActionClient({ cookies: () => cookieStore });
}

export interface GuestData {
  hotel_id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
}

export async function createGuest(data: GuestData) {
  const supabase = await getSupabase();
  
  const { error } = await supabase
    .from('guests')
    .insert(data);

  if (error) {
    if (error.code === '23505') {
      return { error: 'Email tamu sudah terdaftar di hotel ini.' };
    }
    return { error: error.message };
  }

  revalidatePath('/fo/guests');
  return { success: true };
}

export async function updateGuest(id: string, data: Partial<GuestData>) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('guests')
    .update(data)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/fo/guests');
  return { success: true };
}

export async function deleteGuest(id: string) {
  const supabase = await getSupabase();

  // 1. Cek apakah tamu memiliki reservasi terkait
  const { count, error: checkError } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('guest_id', id);

  if (checkError) return { error: checkError.message };
  
  if (count && count > 0) {
    return { error: `Tidak dapat menghapus tamu karena memiliki ${count} reservasi terkait.` };
  }

  // 2. Hapus tamu jika aman
  const { error } = await supabase
    .from('guests')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/fo/guests');
  return { success: true };
}