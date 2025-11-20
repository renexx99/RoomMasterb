import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ReservationsManagementClient from './client';
import { Reservation, Guest, Room, RoomType } from '@/core/types/database';

// Definisikan tipe gabungan untuk passing ke Client
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
  // @ts-ignore - workaround tipe Next.js 15
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
    return <ReservationsManagementClient 
      initialReservations={[]} 
      guests={[]} 
      availableRooms={[]} 
      hotelId={null} 
    />;
  }

  // 3. Fetch Data Secara Paralel
  const [reservationsRes, guestsRes, roomsRes] = await Promise.all([
    // a. Fetch Reservasi (dengan join)
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
      .order('created_at', { ascending: false }), // Default sort created_at desc untuk data awal

    // b. Fetch Daftar Tamu (untuk dropdown)
    supabase
      .from('guests')
      .select('id, full_name, email')
      .eq('hotel_id', hotelId)
      .order('full_name', { ascending: true }),

    // c. Fetch Kamar Tersedia (untuk dropdown form)
    // Catatan: Idealnya ini memfilter kamar yang benar-benar kosong di tanggal tertentu,
    // tapi untuk MVP kita ambil yang statusnya 'available' di master data.
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