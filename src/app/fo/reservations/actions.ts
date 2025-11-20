'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { PaymentStatus } from '@/core/types/database';

// Helper Supabase
async function getSupabase() {
  const cookieStore = await cookies();
  return createServerActionClient({ 
    cookies: () => cookieStore as any 
  });
}

export interface ReservationData {
  hotel_id: string;
  guest_id: string;
  room_id: string;
  check_in_date: Date;
  check_out_date: Date;
  total_price: number;
  payment_status: PaymentStatus;
}

// --- Actions ---

export async function createReservation(data: ReservationData) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('reservations')
    .insert(data);

  if (error) return { error: error.message };

  revalidatePath('/fo/reservations');
  return { success: true };
}

export async function updateReservation(id: string, data: Partial<ReservationData>) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('reservations')
    .update(data)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/fo/reservations');
  return { success: true };
}

export async function deleteReservation(id: string) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/fo/reservations');
  return { success: true };
}

// Action khusus untuk membuat Guest baru dari Form Reservasi FO
export async function createGuestForReservation(guestData: {
  hotel_id: string;
  full_name: string;
  email: string;
  phone_number?: string;
}) {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('guests')
    .insert(guestData)
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