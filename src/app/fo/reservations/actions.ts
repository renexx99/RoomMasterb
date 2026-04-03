// src/app/fo/reservations/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { PaymentStatus, PaymentMethod } from '@/core/types/database';
import { awardStayPoints } from '@/app/manager/loyalty/actions';

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
  payment_method?: PaymentMethod | null;
}

// --- CREATE ---
export async function createReservation(data: ReservationData) {
  const supabase = await getSupabase();

  // 1. Insert Reservasi
  const { data: insertedId, error: insertError } = await supabase
    .from('reservations')
    .insert(data)
    .select('id')
    .single();

  if (insertError) return { error: insertError.message };

  // 2. Fetch Data Lengkap untuk Invoice (Join Guest, Room, & Hotel)
  const { data: fullReservation, error: fetchError } = await supabase
    .from('reservations')
    .select(`
      *,
      guest:guests(id, full_name, email, phone_number),
      room:rooms(id, room_number, 
        room_type:room_types(id, name, price_per_night)
      ),
      hotel:hotels(name, address)
    `)
    .eq('id', insertedId.id)
    .single();

  if (fetchError) return { error: "Reservasi dibuat tapi gagal memuat data invoice." };

  // 3. Award loyalty points if payment is 'paid'
  if (data.payment_status === 'paid' && fullReservation) {
    try {
      const checkIn = new Date(data.check_in_date);
      const checkOut = new Date(data.check_out_date);
      const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
      await awardStayPoints(
        data.guest_id,
        data.hotel_id,
        insertedId.id,
        nights,
        data.total_price
      );
    } catch (e) {
      console.error('Failed to award loyalty points:', e);
    }
  }

  revalidatePath('/fo/reservations');
  return { success: true, data: fullReservation };
}

// --- UPDATE ---
export async function updateReservation(id: string, data: Partial<ReservationData>) {
  const supabase = await getSupabase();

  // If updating payment_status to 'paid', check if points were already awarded
  let shouldAwardPoints = false;
  let existingReservation: any = null;

  if (data.payment_status === 'paid') {
    const { data: existing } = await supabase
      .from('reservations')
      .select('*, guest_id, hotel_id, check_in_date, check_out_date, total_price, payment_status')
      .eq('id', id)
      .single();

    if (existing && existing.payment_status !== 'paid') {
      shouldAwardPoints = true;
      existingReservation = existing;
    }
  }

  const { error } = await supabase
    .from('reservations')
    .update(data)
    .eq('id', id);

  if (error) return { error: error.message };

  // Award loyalty points if status just changed to 'paid'
  if (shouldAwardPoints && existingReservation) {
    try {
      const checkIn = new Date(existingReservation.check_in_date);
      const checkOut = new Date(existingReservation.check_out_date);
      const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
      await awardStayPoints(
        existingReservation.guest_id,
        existingReservation.hotel_id,
        id,
        nights,
        existingReservation.total_price
      );
    } catch (e) {
      console.error('Failed to award loyalty points:', e);
    }
  }

  revalidatePath('/fo/reservations');
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

  revalidatePath('/fo/reservations');
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