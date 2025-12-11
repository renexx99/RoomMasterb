import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RoomsManagementClient from './client';
import { Room, RoomType } from '@/core/types/database';

export interface RoomWithDetails extends Omit<Room, 'room_type'> {
  room_type?: RoomType | null;
}

export default async function ManagerRoomsPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // 1. Cek User
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/auth/login');

  // --- LOGIKA IMPERSONASI & ROLE ---
  let hotelId: string | null = null;

  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('*, role:roles(name)')
    .eq('user_id', user.id);

  const isSuperAdmin = userRoles?.some((ur: any) => ur.role?.name === 'Super Admin');

  if (isSuperAdmin) {
    const impersonatedId = cookieStore.get('impersonated_hotel_id')?.value;
    if (impersonatedId) {
      hotelId = impersonatedId;
    } else {
      redirect('/super-admin/dashboard');
    }
  } else {
    // Cari role manager
    const managerRole = userRoles?.find((ur: any) => 
      ur.hotel_id && 
      ['Hotel Admin', 'Hotel Manager'].includes(ur.role?.name || '')
    );
    hotelId = managerRole?.hotel_id || null;
  }

  // Jika tidak ada akses
  if (!hotelId) {
    // Bisa redirect ke dashboard atau tampilkan empty state
    return <RoomsManagementClient initialRooms={[]} roomTypes={[]} hotelId="" />;
  }

  // 2. Fetch Data Paralel
  const [typesRes, roomsRes] = await Promise.all([
    supabase.from('room_types').select('*').eq('hotel_id', hotelId),
    supabase.from('rooms').select(`*, room_type:room_types(*)`).eq('hotel_id', hotelId),
  ]);

  const roomTypes = (typesRes.data as RoomType[]) || [];
  const rooms = (roomsRes.data as RoomWithDetails[]) || [];

  return (
    <RoomsManagementClient 
      initialRooms={rooms} 
      roomTypes={roomTypes} 
      hotelId={hotelId} 
    />
  );
}