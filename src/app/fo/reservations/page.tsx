// src/app/fo/reservations/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FoReservationsClient from './client';
import { Reservation, Guest, Room, RoomType } from '@/core/types/database';

export interface ReservationDetails extends Reservation {
  guest?: Pick<Guest, 'id' | 'full_name' | 'email' | 'phone_number'>;
  room?: Pick<Room, 'id' | 'room_number'> & {
    room_type?: Pick<RoomType, 'id' | 'name' | 'price_per_night'>;
  };
}

export interface RoomWithDetails extends Room {
    room_type?: RoomType;
}

export interface GuestOption {
    id: string;
    full_name: string;
    email: string;
}

export default async function FoReservationsPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  // --- LOGIKA IMPERSONASI ---
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
    const operationalRole = userRoles?.find((ur: any) => 
      ur.hotel_id && 
      ['Front Office', 'Hotel Manager', 'Hotel Admin'].includes(ur.role?.name || '')
    );
    hotelId = operationalRole?.hotel_id || null;
  }

  if (!hotelId) {
    return <FoReservationsClient initialReservations={[]} guests={[]} rooms={[]} hotelId={null} />;
  }

  // 3. Fetch Data
  const [reservationsRes, roomsRes, guestsRes] = await Promise.all([
    supabase
      .from('reservations')
      .select(`
        *,
        guest:guests(id, full_name, email, phone_number),
        room:rooms(id, room_number, room_type:room_types(id, name, price_per_night))
      `)
      .eq('hotel_id', hotelId)
      .neq('payment_status', 'cancelled') // Hanya tampilkan yang aktif di timeline
      .order('check_in_date', { ascending: false }),
    
    // Fetch SEMUA kamar (bukan cuma available) untuk timeline
    supabase.from('rooms').select(`*, room_type:room_types(*)`)
      .eq('hotel_id', hotelId)
      .order('room_number', { ascending: true }),

    supabase.from('guests').select('id, full_name, email')
      .eq('hotel_id', hotelId).order('full_name', { ascending: true })
  ]);

  return (
    <FoReservationsClient 
      initialReservations={(reservationsRes.data as ReservationDetails[]) || []}
      rooms={(roomsRes.data as RoomWithDetails[]) || []}
      guests={(guestsRes.data as GuestOption[]) || []}
      hotelId={hotelId}
    />
  );
}