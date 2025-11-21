// src/app/fo/billing/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import BillingClient from './client';
import { Reservation, Guest, Room, RoomType } from '@/core/types/database';

export interface ReservationDetails extends Reservation {
  guest?: Pick<Guest, 'id' | 'full_name' | 'email'>;
  room?: Pick<Room, 'id' | 'room_number'> & {
    room_type?: Pick<RoomType, 'id' | 'name' | 'price_per_night'>;
  };
}

export default async function BillingPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('hotel_id')
    .eq('user_id', session.user.id)
    .not('hotel_id', 'is', null)
    .maybeSingle();

  const hotelId = userRole?.hotel_id;

  if (!hotelId) {
    return <BillingClient initialReservations={[]} hotelId={null} />;
  }

  const today = new Date().toISOString().split('T')[0];

  // Fetch Tamu In-House (Check-in <= Today && Check-out >= Today)
  const { data: reservations } = await supabase
    .from('reservations')
    .select(`
        *,
        guest:guests(id, full_name, email),
        room:rooms(id, room_number, room_type:room_types(id, name, price_per_night))
    `)
    .eq('hotel_id', hotelId)
    .lte('check_in_date', today)
    .gte('check_out_date', today)
    .neq('payment_status', 'cancelled')
    .order('check_in_date', { ascending: true });

  return (
    <BillingClient 
      initialReservations={(reservations as ReservationDetails[]) || []}
      hotelId={hotelId}
    />
  );
}