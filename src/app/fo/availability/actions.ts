// src/app/fo/availability/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

async function getSupabase() {
  const cookieStore = await cookies();
  // @ts-ignore
  return createServerActionClient({ cookies: () => cookieStore });
}

export async function getAvailabilityData(hotelId: string, startDate: string, endDate: string) {
  const supabase = await getSupabase();

  // 1. Ambil Kamar (Urutkan)
  const { data: rooms, error: roomError } = await supabase
    .from('rooms')
    .select(`
      *,
      room_type:room_types(*)
    `)
    .eq('hotel_id', hotelId)
    .order('room_number', { ascending: true });

  if (roomError) throw new Error(roomError.message);

  // 2. Ambil Reservasi yang beririsan dengan range tanggal
  // Logika: (CheckIn < EndDate) AND (CheckOut > StartDate)
  const { data: reservations, error:QHError } = await supabase
    .from('reservations')
    .select(`
      *,
      guest:guests(id, full_name, email)
    `)
    .eq('hotel_id', hotelId)
    .neq('payment_status', 'cancelled')
    .lt('check_in_date', endDate)
    .gt('check_out_date', startDate);

  if (QHError) throw new Error(QHError.message);

  return { rooms, reservations };
}