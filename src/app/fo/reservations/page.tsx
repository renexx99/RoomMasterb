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

  // --- LOGIKA IMPERSONASI (DIPERBARUI) ---
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
    return <FoReservationsClient initialReservations={[]} guests={[]} rooms={[]} hotelId={null} />;
  }

  // 4. Fetch Data (Kode lama, tidak berubah, hanya menggunakan hotelId yang sudah didapat di atas)
  const [reservationsRes, roomsRes, guestsRes] = await Promise.all([
    supabase
      .from('reservations')
      .select(`
        *,
        guest:guests(id, full_name, email, phone_number),
        room:rooms(id, room_number, room_type:room_types(id, name, price_per_night))
      `)
      .eq('hotel_id', hotelId)
      .order('check_in_date', { ascending: false }),
    
    supabase.from('rooms').select(`*, room_type:room_types(*)`)
      .eq('hotel_id', hotelId).eq('status', 'available').order('room_number', { ascending: true }),

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