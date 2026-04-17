// src/app/ta/availability/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

async function getSupabase() {
  const cookieStore = await cookies();
  // @ts-ignore
  return createServerActionClient({ cookies: () => cookieStore });
}

export async function getTaAvailabilityData(hotelId: string, startDate: string, endDate: string) {
  const supabase = await getSupabase();

  // 1. Fetch all rooms with their room type info
  const { data: rooms, error: roomError } = await supabase
    .from('rooms')
    .select(`
      *,
      room_type:room_types(*)
    `)
    .eq('hotel_id', hotelId)
    .order('room_number', { ascending: true });

  if (roomError) throw new Error(roomError.message);

  // 2. Fetch reservations that overlap with the date range
  // Logic: (CheckIn < EndDate) AND (CheckOut > StartDate)
  const { data: reservations, error: resError } = await supabase
    .from('reservations')
    .select(`
      *,
      guest:guests(id, full_name, email)
    `)
    .eq('hotel_id', hotelId)
    .neq('payment_status', 'cancelled')
    .lt('check_in_date', endDate)
    .gt('check_out_date', startDate);

  if (resError) throw new Error(resError.message);

  return { rooms, reservations };
}
