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

  // --- LOGIKA IMPERSONASI ---
  let hotelId: string | null = null;

  // 1. Ambil roles user saat ini
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('*, role:roles(name)')
    .eq('user_id', session.user.id);

  // 2. Cek apakah Super Admin
  const isSuperAdmin = userRoles?.some((ur: any) => ur.role?.name === 'Super Admin');

  if (isSuperAdmin) {
    // 3a. Jika Super Admin, ambil dari Cookie
    const impersonatedId = cookieStore.get('impersonated_hotel_id')?.value;
    if (impersonatedId) {
      hotelId = impersonatedId;
    } else {
      // Jika tidak ada cookie, kembalikan ke dashboard utama super admin
      redirect('/super-admin/dashboard');
    }
  } else {
    // 3b. Jika User Biasa, ambil dari DB
    const operationalRole = userRoles?.find((ur: any) => 
      ur.hotel_id && 
      ['Front Office', 'Hotel Manager', 'Hotel Admin'].includes(ur.role?.name || '')
    );
    hotelId = operationalRole?.hotel_id || null;
  }
  // --- AKHIR LOGIKA IMPERSONASI ---

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