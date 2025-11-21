// src/app/fo/availability/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FoAvailabilityClient from './client';
import { Room, RoomType } from '@/core/types/database';

// Interface Data Gabungan
export interface RoomWithDetails extends Room {
  room_type?: RoomType | null;
}

export default async function AvailabilityPage() {
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
    .maybeSingle();

  const hotelId = userRole?.hotel_id;

  if (!hotelId) {
    return <FoAvailabilityClient initialRooms={[]} roomTypes={[]} />;
  }

  // 2. Fetch Data Kamar & Tipe Kamar
  const [roomsRes, typesRes] = await Promise.all([
    supabase
      .from('rooms')
      .select(`*, room_type:room_types(*)`)
      .eq('hotel_id', hotelId)
      .order('room_number', { ascending: true }),
    
    supabase
      .from('room_types')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('name', { ascending: true })
  ]);

  return (
    <FoAvailabilityClient 
      initialRooms={(roomsRes.data as RoomWithDetails[]) || []}
      roomTypes={(typesRes.data as RoomType[]) || []}
    />
  );
}