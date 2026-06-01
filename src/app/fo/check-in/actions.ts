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

  // Use RPC (SECURITY DEFINER) to bypass RLS
  // This atomically: sets room to occupied+clean, sets checked_in_at on reservation
  const { data, error } = await supabase.rpc('check_in_room', {
    p_reservation_id: reservationId,
    p_room_id: roomId,
  });

  if (error) return { error: `Failed to check in guest: ${error.message}` };
  if (!data) return { error: 'Room or reservation not found.' };

  revalidatePath('/fo/check-in');
  revalidatePath('/fo/dashboard');
  revalidatePath('/fo/availability');
  revalidatePath('/housekeeping/dashboard');
  revalidatePath('/housekeeping/tasks');
  return { success: true };
}

export async function checkOutGuest(reservationId: string, roomId: string) {
  const supabase = await getSupabase();

  // Use RPC (SECURITY DEFINER) to bypass RLS
  // This atomically: sets room to available+dirty, sets checked_out_at,
  // and auto-creates a housekeeping cleaning task
  const { data, error } = await supabase.rpc('check_out_room', {
    p_reservation_id: reservationId,
    p_room_id: roomId,
  });

  if (error) return { error: `Failed to check out guest: ${error.message}` };
  if (!data) return { error: 'Room or reservation not found.' };

  revalidatePath('/fo/check-in');
  revalidatePath('/fo/dashboard');
  revalidatePath('/fo/availability');
  revalidatePath('/housekeeping/dashboard');
  revalidatePath('/housekeeping/tasks');
  return { success: true };
}