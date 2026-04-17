// src/app/ta/availability/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TaAvailabilityClient from './client';
import { getTaAvailabilityData } from './actions';

export default async function TaAvailabilityPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  // Get agent's hotel
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('hotel_id, role:roles(name)')
    .eq('user_id', session.user.id);

  const taRole = userRoles?.find((ur: any) => ur.role?.name === 'Travel Agent');
  const hotelId = taRole?.hotel_id;

  if (!hotelId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        No hotel assignment found. Please contact the administrator.
      </div>
    );
  }

  // Set date range (today -7 to +30 for timeline)
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 7);
  const end = new Date(today);
  end.setDate(today.getDate() + 30);

  const { rooms, reservations } = await getTaAvailabilityData(
    hotelId,
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  );

  // Get room types for filter
  const { data: roomTypes } = await supabase
    .from('room_types')
    .select('*')
    .eq('hotel_id', hotelId);

  return (
    <TaAvailabilityClient
      initialRooms={rooms || []}
      initialReservations={reservations || []}
      roomTypes={roomTypes || []}
      hotelId={hotelId}
    />
  );
}
