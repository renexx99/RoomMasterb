// src/app/admin/rooms/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RoomsManagementClient from './client';
import { Room, RoomType } from '@/core/types/database';

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

  // --- LOGIKA IMPERSONASI ---
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
    const adminRole = userRoles?.find((ur: any) => 
      ur.hotel_id && 
      ['Hotel Admin', 'Hotel Manager'].includes(ur.role?.name || '')
    );
    hotelId = adminRole?.hotel_id || null;
  }
  // --- AKHIR LOGIKA IMPERSONASI ---

  if (!hotelId) {
    return <RoomsManagementClient initialRooms={[]} roomTypes={[]} hotelId={null} />;
  }

  // 3. Fetch Data
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