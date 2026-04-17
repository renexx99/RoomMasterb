// src/app/ta/reservations/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TaReservationsClient from './client';

export interface TaReservationRow {
  id: string;
  check_in_date: string;
  check_out_date: string;
  payment_status: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  special_requests: string | null;
  created_at: string;
  guest: {
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
  } | null;
  room: {
    id: string;
    room_number: string;
    room_type: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export default async function TaReservationsPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  // Get agent's hotel name
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('hotel_id, role:roles(name)')
    .eq('user_id', session.user.id);

  const taRole = userRoles?.find((ur: any) => ur.role?.name === 'Travel Agent');
  const hotelId = taRole?.hotel_id;

  let hotelName = 'Hotel';
  if (hotelId) {
    const { data: hotel } = await supabase
      .from('hotels')
      .select('name')
      .eq('id', hotelId)
      .single();
    hotelName = hotel?.name || 'Hotel';
  }

  // Fetch all reservations by this agent
  const { data: reservations } = await supabase
    .from('reservations')
    .select(`
      id,
      check_in_date,
      check_out_date,
      payment_status,
      checked_in_at,
      checked_out_at,
      special_requests,
      created_at,
      guest:guests(id, full_name, email, phone_number),
      room:rooms(id, room_number, room_type:room_types(id, name))
    `)
    .eq('agent_id', session.user.id)
    .order('created_at', { ascending: false });

  return (
    <TaReservationsClient
      reservations={(reservations as unknown as TaReservationRow[]) || []}
      hotelName={hotelName}
    />
  );
}
