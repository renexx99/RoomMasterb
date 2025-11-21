// src/app/fo/check-in/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import CheckInClient from './client';
import { Reservation, Guest, Room, RoomType } from '@/core/types/database';

// Export interface ini agar bisa dipakai di Client Component & Components lain
export interface ReservationDetails extends Reservation {
  guest?: Pick<Guest, 'id' | 'full_name' | 'email'>;
  room?: Pick<Room, 'id' | 'room_number'> & {
    room_type?: Pick<RoomType, 'id' | 'name' | 'price_per_night'>;
  };
}

export default async function CheckInPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  // 1. Ambil Hotel ID
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('hotel_id')
    .eq('user_id', session.user.id)
    .not('hotel_id', 'is', null)
    .limit(1)
    .single();

  const hotelId = userRole?.hotel_id;

  if (!hotelId) {
    return <CheckInClient initialArrivals={[]} initialDepartures={[]} hotelId={null} />;
  }

  // 2. Fetch Data Kedatangan & Keberangkatan Hari Ini
  const today = new Date().toISOString().split('T')[0];
  const commonSelect = `
    *,
    guest:guests(id, full_name, email),
    room:rooms(id, room_number, room_type:room_types(id, name, price_per_night))
  `;

  const [arrivalsRes, departuresRes] = await Promise.all([
    // Arrivals: Check-in date = hari ini & belum cancelled
    supabase.from('reservations')
      .select(commonSelect)
      .eq('hotel_id', hotelId)
      .eq('check_in_date', today)
      .neq('payment_status', 'cancelled')
      .order('check_in_date', { ascending: true }),

    // Departures: Check-out date = hari ini & belum cancelled
    supabase.from('reservations')
      .select(commonSelect)
      .eq('hotel_id', hotelId)
      .eq('check_out_date', today)
      .neq('payment_status', 'cancelled')
      .order('check_out_date', { ascending: true })
  ]);

  return (
    <CheckInClient 
      initialArrivals={(arrivalsRes.data as ReservationDetails[]) || []}
      initialDepartures={(departuresRes.data as ReservationDetails[]) || []}
      hotelId={hotelId}
    />
  );
}