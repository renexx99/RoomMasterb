// src/app/ta/availability/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TaAvailabilityClient from './client';

export interface RoomTypeAvailability {
  id: string;
  name: string;
  capacity: number;
  bed_type: string | null;
  view_type: string | null;
  totalRooms: number;
  availableRooms: number;
}

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

  // Fetch room types with room counts
  const { data: roomTypes } = await supabase
    .from('room_types')
    .select(`
      id,
      name,
      capacity,
      bed_type,
      view_type,
      rooms:rooms(id, status)
    `)
    .eq('hotel_id', hotelId)
    .order('name');

  const availability: RoomTypeAvailability[] = (roomTypes || []).map((rt: any) => ({
    id: rt.id,
    name: rt.name,
    capacity: rt.capacity,
    bed_type: rt.bed_type,
    view_type: rt.view_type,
    totalRooms: rt.rooms?.length || 0,
    availableRooms: rt.rooms?.filter((r: any) => r.status === 'available').length || 0,
  }));

  // Get hotel name
  const { data: hotel } = await supabase
    .from('hotels')
    .select('name')
    .eq('id', hotelId)
    .single();

  return (
    <TaAvailabilityClient
      availability={availability}
      hotelName={hotel?.name || 'Hotel'}
    />
  );
}
