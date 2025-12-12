// src/app/manager/reservations/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { PaymentStatus, PaymentMethod } from '@/core/types/database';

async function getSupabase() {
  const cookieStore = await cookies();
  // @ts-ignore
  return createServerActionClient({ cookies: () => cookieStore });
}

export interface ReservationData {
  hotel_id: string;
  guest_id: string;
  room_id: string;
  check_in_date: Date;
  check_out_date: Date;
  total_price: number;
  payment_status: PaymentStatus;
  // [BARU] Tambahkan field payment_method
  payment_method?: PaymentMethod | null;
}

// --- CREATE ---
export async function createReservation(data: ReservationData) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('reservations')
    .insert(data);

  if (error) return { error: error.message };

  revalidatePath('/manager/reservations');
  return { success: true };
}

// --- UPDATE ---
export async function updateReservation(id: string, data: Partial<ReservationData>) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('reservations')
    .update(data)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/manager/reservations');
  return { success: true };
}

// --- DELETE ---
export async function deleteReservation(id: string) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/manager/reservations');
  return { success: true };
}

// --- HELPER: CREATE GUEST ON THE FLY ---
export async function createGuestForReservation(guestData: {
  hotel_id: string;
  title: string;
  full_name: string;
  email: string;
  phone_number?: string;
}) {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('guests')
    .insert({
      hotel_id: guestData.hotel_id,
      title: guestData.title,
      full_name: guestData.full_name,
      email: guestData.email,
      phone_number: guestData.phone_number
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: 'Email tamu sudah terdaftar.' };
    }
    return { error: error.message };
  }

  return { success: true, guestId: data.id };
}