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

  // 1. Update Room: Guest leaves -> Room becomes Vacant Dirty
  const { error: roomError } = await supabase
    .from('rooms')
    .update({ 
      status: 'available',
      cleaning_status: 'dirty',
      updated_at: now,
    })
    .eq('id', roomId);

  if (roomError) return { error: `Failed to update room status: ${roomError.message}` };

  // 2. Update Reservation: Set checkout timestamp
  const { error: resError } = await supabase
    .from('reservations')
    .update({ checked_out_at: now })
    .eq('id', reservationId);

  if (resError) return { error: `Failed to update reservation: ${resError.message}` };

  // 3. Auto-generate Housekeeping Task for this room
  const { data: roomData } = await supabase
    .from('rooms')
    .select('hotel_id')
    .eq('id', roomId)
    .single();

  if (roomData?.hotel_id) {
    await supabase.from('housekeeping_tasks').insert({
      hotel_id: roomData.hotel_id,
      room_id: roomId,
      task_type: 'cleaning',
      priority: 'normal',
      status: 'pending',
      notes: `Auto-generated after checkout of reservation ${reservationId}`,
    });
  }

  revalidatePath('/fo/check-in');
  revalidatePath('/fo/dashboard');
  revalidatePath('/fo/availability');
  revalidatePath('/housekeeping/dashboard');
  revalidatePath('/housekeeping/tasks');
  return { success: true };
}