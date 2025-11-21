// src/app/fo/availability/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FoAvailabilityClient from './client';
import { Room, RoomType, Reservation, Guest } from '@/core/types/database';

// Interface untuk data yang lengkap
export interface RoomWithDetails extends Room {
  room_type?: RoomType | null;
}

export interface ReservationDetails extends Reservation {
    guest?: Pick<Guest, 'id' | 'full_name' | 'email'>;
}

export default async function AvailabilityPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  // --- LOGIKA IMPERSONASI (Singkat) ---
  let hotelId: string | null = null;
  const { data: userRoles } = await supabase.from('user_roles').select('*, role:roles(name)').eq('user_id', session.user.id);
  const isSuperAdmin = userRoles?.some((ur: any) => ur.role?.name === 'Super Admin');

  if (isSuperAdmin) {
    hotelId = cookieStore.get('impersonated_hotel_id')?.value || null;
    if (!hotelId) redirect('/super-admin/dashboard');
  } else {
    const operationalRole = userRoles?.find((ur: any) => ur.hotel_id && ['Front Office', 'Hotel Manager', 'Hotel Admin'].includes(ur.role?.name || ''));
    hotelId = operationalRole?.hotel_id || null;
  }

  if (!hotelId) {
    return <FoAvailabilityClient initialRooms={[]} initialReservations={[]} roomTypes={[]} />;
  }

  // 1. Fetch Rooms (Urutkan biar rapi di chart)
  const { data: rooms } = await supabase
    .from('rooms')
    .select(`*, room_type:room_types(*)`)
    .eq('hotel_id', hotelId)
    .order('room_number', { ascending: true });

  // 2. Fetch Room Types (Untuk Filter)
  const { data: types } = await supabase
    .from('room_types')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('name', { ascending: true });

  // 3. Fetch Active Reservations (Untuk Chart)
  // Kita ambil reservasi yang aktif (bukan cancelled) 
  // dan dalam range waktu relatif luas (misal +/- 1 bulan dari sekarang)
  // Untuk optimasi, di real app gunakan filter tanggal dinamis. 
  // Disini kita ambil semua yang aktif untuk simplifikasi chart.
  const { data: reservations } = await supabase
    .from('reservations')
    .select(`
        *,
        guest:guests(id, full_name, email)
    `)
    .eq('hotel_id', hotelId)
    .neq('payment_status', 'cancelled');

  return (
    <FoAvailabilityClient 
      initialRooms={(rooms as RoomWithDetails[]) || []}
      initialReservations={(reservations as ReservationDetails[]) || []}
      roomTypes={(types as RoomType[]) || []}
    />
  );
}