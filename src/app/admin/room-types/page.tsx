import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RoomTypesManagementClient from './client';
import { RoomType } from '@/core/types/database';

export default async function RoomTypesPage() {
  const cookieStore = await cookies();
  // @ts-ignore - workaround type Next.js 15
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
    return <RoomTypesManagementClient initialRoomTypes={[]} hotelId={null} />;
  }

  // 3. Fetch Data Room Types
  const { data: roomTypes } = await supabase
    .from('room_types')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('name', { ascending: true });

  return (
    <RoomTypesManagementClient 
      initialRoomTypes={roomTypes as RoomType[] || []} 
      hotelId={hotelId} 
    />
  );
}