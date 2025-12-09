// src/app/fo/availability/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();
  // @ts-ignore
  return createServerActionClient({ cookies: () => cookieStore });
}

export async function getAvailabilityData(hotelId: string, startDate: string, endDate: string) {
  const supabase = await getSupabase();

  const { data: rooms, error: roomError } = await supabase
    .from('rooms')
    .select(`*, room_type:room_types(*)`)
    .eq('hotel_id', hotelId)
    .order('room_number', { ascending: true });

  if (roomError) throw new Error(roomError.message);

  const { data: reservations, error: resError } = await supabase
    .from('reservations')
    .select(`*, guest:guests(id, full_name, email)`)
    .eq('hotel_id', hotelId)
    .neq('payment_status', 'cancelled')
    .or(`check_in_date.lte.${endDate},check_out_date.gte.${startDate}`);

  if (resError) throw new Error(resError.message);

  return { rooms, reservations };
}

export async function updateRoomStatus(
  roomId: string, 
  status: 'available' | 'occupied' | 'maintenance',
  cleaningStatus: 'clean' | 'dirty'
) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('rooms')
    .update({ status: status, cleaning_status: cleaningStatus })
    .eq('id', roomId);

  if (error) return { error: error.message };
  revalidatePath('/fo/availability');
  return { success: true };
}