import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RoomTypesClient from './client';
import { RoomType } from '@/core/types/database';

export default async function ManagerRoomTypesPage() {
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
    return <RoomTypesClient initialRoomTypes={[]} hotelId="" />;
  }

  // 2. Fetch Data
  const { data: roomTypes } = await supabase
    .from('room_types')
    .select('*')
    .eq('hotel_id', hotelId);

  return (
    <RoomTypesClient 
      initialRoomTypes={(roomTypes as RoomType[]) || []} 
      hotelId={hotelId} 
    />
  );
}