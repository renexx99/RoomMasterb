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
  phone_number: string;
  title: string;
  loyalty_tier: string;
  preferences?: string[]; // Akan disimpan ke JSONB
}

// --- UPDATE GUEST ---
export async function updateGuestAction(id: string, data: Partial<GuestData>) {
  const supabase = await getSupabase();

  // Konversi array preferences ke JSONB jika ada
  const payload: any = { ...data };
  if (data.preferences) {
    payload.preferences = { tags: data.preferences };
  }

  const { error } = await supabase
    .from('guests')
    .update(payload)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/fo/guests');
  return { success: true };
}

// --- CREATE GUEST ---
export async function createGuestAction(data: GuestData) {
  const supabase = await getSupabase();

  const payload: any = { ...data };
  if (data.preferences) {
    payload.preferences = { tags: data.preferences };
  }

  const { error } = await supabase
    .from('guests')
    .insert(payload);

  if (error) {
    if (error.code === '23505') return { error: 'Email sudah terdaftar.' };
    return { error: error.message };
  }

  revalidatePath('/fo/guests');
  return { success: true };
}

// --- FETCH GUEST HISTORY ---
export async function getGuestHistory(guestId: string) {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id,
      check_in_date,
      check_out_date,
      total_price,
      room:rooms(room_number, room_type:room_types(name))
    `)
    .eq('guest_id', guestId)
    .order('check_in_date', { ascending: false });

  if (error) return [];
  return data;
}