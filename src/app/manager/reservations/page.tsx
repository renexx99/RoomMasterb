// src/app/manager/reservations/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ManagerReservationsClient from './client';
import { Reservation, Guest, Room, RoomType, Hotel } from '@/core/types/database';

export interface ReservationDetails extends Reservation {
  guest?: Pick<Guest, 'id' | 'full_name' | 'email' | 'phone_number'>;
  room?: Pick<Room, 'id' | 'room_number'> & {
    room_type?: Pick<RoomType, 'id' | 'name' | 'price_per_night'>;
  };
  // [BARU] Tambahkan relasi ke hotel
  hotel?: Pick<Hotel, 'name' | 'address'>;
}

export interface RoomWithDetails extends Room {
    room_type?: RoomType;
}

export interface GuestOption {
    id: string;
    full_name: string;
    email: string;
}

export default async function ManagerReservationsPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  // --- LOGIKA IMPERSONASI & ROLE ---
  let hotelId: string | null = null;
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('*, role:roles(name)')
    .eq('user_id', session.user.id);

  const isSuperAdmin = userRoles?.some((ur: any) => ur.role?.name === 'Super Admin');

  if (isSuperAdmin) {
    hotelId = cookieStore.get('impersonated_hotel_id')?.value || null;
    if (!hotelId) redirect('/super-admin/dashboard');
  } else {
    // Role Manager
    const managerRole = userRoles?.find((ur: any) => 
      ur.hotel_id && 
      ['Hotel Manager', 'Hotel Admin'].includes(ur.role?.name || '')
    );
    hotelId = managerRole?.hotel_id || null;
  }

  if (!hotelId) {
    return <ManagerReservationsClient initialReservations={[]} guests={[]} rooms={[]} hotelId={null} />;
  }

  // 3. Fetch Data
  const [reservationsRes, roomsRes, guestsRes] = await Promise.all([
    supabase
      .from('reservations')
      .select(`
        *,
        guest:guests(id, full_name, email, phone_number),
        room:rooms(id, room_number, room_type:room_types(id, name, price_per_night)),
        hotel:hotels(name, address)
      `)
      .eq('hotel_id', hotelId)
      .neq('payment_status', 'cancelled') 
      .order('check_in_date', { ascending: false }),
    
    // Fetch SEMUA kamar
    supabase.from('rooms').select(`*, room_type:room_types(*)`)
      .eq('hotel_id', hotelId)
      .order('room_number', { ascending: true }),

    supabase.from('guests').select('id, full_name, email')
      .eq('hotel_id', hotelId).order('full_name', { ascending: true })
  ]);

  return (
    <ManagerReservationsClient 
      initialReservations={(reservationsRes.data as ReservationDetails[]) || []}
      rooms={(roomsRes.data as RoomWithDetails[]) || []}
      guests={(guestsRes.data as GuestOption[]) || []}
      hotelId={hotelId}
    />
  );
}