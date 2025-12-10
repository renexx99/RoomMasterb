import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import CheckInClient from './client';
import { Reservation, Guest, Room, RoomType } from '@/core/types/database';

export interface ReservationDetails extends Reservation {
  booking_source: any;
  guest?: Pick<Guest, 'id' | 'full_name' | 'email' | 'phone_number' | 'loyalty_tier'>;
  room?: Pick<Room, 'id' | 'room_number' | 'status' | 'cleaning_status'> & {
    room_type?: Pick<RoomType, 'id' | 'name' | 'price_per_night'>;
  };
}

// Accept searchParams to handle Date selection
export default async function CheckInPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  // --- IMPERSONATION LOGIC ---
  let hotelId: string | null = null;
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('*, role:roles(name)')
    .eq('user_id', session.user.id);

  const isSuperAdmin = userRoles?.some((ur: any) => ur.role?.name === 'Super Admin');

  if (isSuperAdmin) {
    hotelId = cookieStore.get('impersonated_hotel_id')?.value || null;
    if (!hotelId) redirect('/super-admin/dashboard');
  } else {
    const operationalRole = userRoles?.find((ur: any) => 
      ur.hotel_id && 
      ['Front Office', 'Hotel Manager', 'Hotel Admin'].includes(ur.role?.name || '')
    );
    hotelId = operationalRole?.hotel_id || null;
  }

  if (!hotelId) {
    return <CheckInClient initialArrivals={[]} initialDepartures={[]} hotelId={null} selectedDate={new Date().toISOString()} />;
  }

  // --- FETCH DATA ---
  // Default to today if no param provided
  const targetDate = (await searchParams).date || new Date().toISOString().split('T')[0];

  const commonSelect = `
    *,
    guest:guests(id, full_name, email, phone_number, loyalty_tier),
    room:rooms(id, room_number, status, cleaning_status, room_type:room_types(id, name, price_per_night))
  `;

  const [arrivalsRes, departuresRes] = await Promise.all([
    // Expected Arrivals: Check-in date matches AND not yet checked in
    supabase.from('reservations')
      .select(commonSelect)
      .eq('hotel_id', hotelId)
      .eq('check_in_date', targetDate)
      .is('checked_in_at', null) // Only show those who haven't arrived yet
      .neq('payment_status', 'cancelled')
      .order('created_at', { ascending: true }),

    // Expected Departures: Check-out date matches AND currently In-House (checked in but not out)
    supabase.from('reservations')
      .select(commonSelect)
      .eq('hotel_id', hotelId)
      .eq('check_out_date', targetDate)
      .not('checked_in_at', 'is', null) // Must have checked in
      .is('checked_out_at', null) // Has not checked out yet
      .neq('payment_status', 'cancelled')
      .order('room_id', { ascending: true }) // Sort by room for easier check
  ]);

  return (
    <CheckInClient 
      initialArrivals={(arrivalsRes.data as ReservationDetails[]) || []}
      initialDepartures={(departuresRes.data as ReservationDetails[]) || []}
      hotelId={hotelId}
      selectedDate={targetDate}
    />
  );
}