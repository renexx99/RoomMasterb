// src/app/ta/book-room/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TaBookRoomClient from './client';

export interface RoomTypeOption {
  id: string;
  name: string;
  capacity: number;
  bed_type: string | null;
  price_per_night: number;
  availableRoomIds: string[];
}

export default async function TaBookRoomPage() {
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

  // Get hotel name
  const { data: hotel } = await supabase
    .from('hotels')
    .select('name')
    .eq('id', hotelId)
    .single();

  // Fetch room types with available rooms
  const { data: roomTypes } = await supabase
    .from('room_types')
    .select(`
      id,
      name,
      capacity,
      bed_type,
      price_per_night,
      rooms:rooms(id, status)
    `)
    .eq('hotel_id', hotelId)
    .order('name');

  const roomTypeOptions: RoomTypeOption[] = (roomTypes || []).map((rt: any) => ({
    id: rt.id,
    name: rt.name,
    capacity: rt.capacity,
    bed_type: rt.bed_type,
    price_per_night: Number(rt.price_per_night) || 0,
    availableRoomIds: (rt.rooms || [])
      .filter((r: any) => r.status === 'available')
      .map((r: any) => r.id),
  }));

  return (
    <TaBookRoomClient
      roomTypeOptions={roomTypeOptions}
      hotelId={hotelId}
      hotelName={hotel?.name || 'Hotel'}
      agentId={session.user.id}
    />
  );
}
