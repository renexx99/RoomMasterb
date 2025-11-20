import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RoomsManagementClient from './client';
import { Room, RoomType } from '@/core/types/database';

// Tipe Data Gabungan untuk Client
export interface RoomWithDetails extends Room {
  room_type?: RoomType | null;
}

export default async function RoomsPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // 1. Cek User
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/auth/login');

  // 2. Ambil Hotel ID
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('hotel_id')
    .eq('user_id', user.id)
    .not('hotel_id', 'is', null)
    .maybeSingle();

  const hotelId = userRole?.hotel_id;

  if (!hotelId) {
    return <RoomsManagementClient initialRooms={[]} roomTypes={[]} hotelId={null} />;
  }

  // 3. Fetch Data
  // Kita butuh 2 query: Daftar Kamar (dengan detail tipe) DAN Daftar Tipe Kamar (untuk dropdown)
  const [roomsRes, typesRes] = await Promise.all([
    supabase
      .from('rooms')
      .select(`
        *,
        room_type:room_types(*)
      `)
      .eq('hotel_id', hotelId)
      .order('room_number', { ascending: true }),
      
    supabase
      .from('room_types')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('name', { ascending: true })
  ]);

  return (
    <RoomsManagementClient 
      initialRooms={(roomsRes.data as RoomWithDetails[]) || []}
      roomTypes={(typesRes.data as RoomType[]) || []}
      hotelId={hotelId} 
    />
  );
}