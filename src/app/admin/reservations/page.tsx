// src/app/admin/reservations/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ReservationsManagementClient from './client';
import { Reservation, Guest, Room, RoomType } from '@/core/types/database';

export interface ReservationDetails extends Reservation {
  guest?: Pick<Guest, 'id' | 'full_name' | 'email'>;
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

export default async function ReservationsPage() {
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
    return <ReservationsManagementClient 
      initialReservations={[]} 
      guests={[]} 
      availableRooms={[]} 
      hotelId={null} 
    />;
  }

  // 3. Fetch Data Secara Paralel
  const [reservationsRes, guestsRes, roomsRes] = await Promise.all([
    supabase
      .from('reservations')
      .select(`
        *,
        guest:guests(id, full_name, email),
        room:rooms(id, room_number, 
          room_type:room_types(id, name, price_per_night)
        )
      `)
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false }),

    supabase
      .from('guests')
      .select('id, full_name, email')
      .eq('hotel_id', hotelId)
      .order('full_name', { ascending: true }),

    supabase
      .from('rooms')
      .select(`*, room_type:room_types(*)`)
      .eq('hotel_id', hotelId)
      .eq('status', 'available')
      .order('room_number', { ascending: true })
  ]);

  return (
    <ReservationsManagementClient 
      initialReservations={(reservationsRes.data as ReservationDetails[]) || []}
      guests={(guestsRes.data as GuestOption[]) || []}
      availableRooms={(roomsRes.data as RoomWithDetails[]) || []}
      hotelId={hotelId}
    />
  );
}