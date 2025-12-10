'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();
  // @ts-ignore
  return createServerActionClient({ cookies: () => cookieStore });
}

export async function checkInGuest(reservationId: string, roomId: string) {
  const supabase = await getSupabase();
  const now = new Date().toISOString();

  // 1. Update Reservation: Set timestamp & status
  const { error: resError } = await supabase
    .from('reservations')
    .update({ 
      checked_in_at: now,
      // Optional: Force status to 'paid' or keep existing logic
      // payment_status: 'paid' 
    }) 
    .eq('id', reservationId);

  if (resError) return { error: `Failed to update reservation: ${resError.message}` };

  // 2. Update Room: Set status to 'occupied'
  const { error: roomError } = await supabase
    .from('rooms')
    .update({ status: 'occupied' })
    .eq('id', roomId);

  if (roomError) return { error: `Failed to update room status: ${roomError.message}` };

  revalidatePath('/fo/check-in');
  revalidatePath('/fo/dashboard');
  revalidatePath('/fo/availability');
  return { success: true };
}

export async function checkOutGuest(reservationId: string, roomId: string) {
  const supabase = await getSupabase();
  const now = new Date().toISOString();

  // 1. Update Room: Set status to 'maintenance' (or available but dirty)
  // Logic: Guest leaves -> Room becomes Dirty
  const { error: roomError } = await supabase
    .from('rooms')
    .update({ 
      status: 'available', // Room is physically available, but...
      cleaning_status: 'dirty' // ...it needs cleaning
    })
    .eq('id', roomId);

  if (roomError) return { error: `Failed to update room status: ${roomError.message}` };

  // 2. Update Reservation: Set checkout timestamp
  const { error: resError } = await supabase
    .from('reservations')
    .update({ checked_out_at: now })
    .eq('id', reservationId);

  if (resError) return { error: `Failed to update reservation: ${resError.message}` };

  revalidatePath('/fo/check-in');
  revalidatePath('/fo/dashboard');
  revalidatePath('/fo/availability');
  return { success: true };
}