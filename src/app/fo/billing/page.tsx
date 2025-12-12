// src/app/fo/billing/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import BillingClient from './client';
import { Reservation, Guest, Room, RoomType, Hotel } from '@/core/types/database';

// [PERBAIKAN] Update interface agar cocok dengan ReservationInvoiceModal
export interface ReservationDetails extends Reservation {
  guest?: Pick<Guest, 'id' | 'full_name' | 'email' | 'phone_number'>;
  room?: Pick<Room, 'id' | 'room_number'> & {
    room_type?: Pick<RoomType, 'id' | 'name' | 'price_per_night'>;
  };
  hotel?: Pick<Hotel, 'name' | 'address'>;
}

export default async function BillingPage() {
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
    const impersonatedId = cookieStore.get('impersonated_hotel_id')?.value;
    if (impersonatedId) {
      hotelId = impersonatedId;
    } else {
      redirect('/super-admin/dashboard');
    }
  } else {
    const operationalRole = userRoles?.find((ur: any) => 
      ur.hotel_id && 
      ['Front Office', 'Hotel Manager', 'Hotel Admin'].includes(ur.role?.name || '')
    );
    hotelId = operationalRole?.hotel_id || null;
  }
  // --- AKHIR LOGIKA IMPERSONASI ---

  if (!hotelId) {
    return <BillingClient initialReservations={[]} hotelId={null} />;
  }

  const today = new Date().toISOString().split('T')[0];

  // Fetch Tamu In-House (Check-in <= Today && Check-out >= Today)
  // [PERBAIKAN] Menambahkan fetch 'hotel(name, address)' dan 'guest.phone_number'
  const { data: reservations } = await supabase
    .from('reservations')
    .select(`
        *,
        guest:guests(id, full_name, email, phone_number),
        room:rooms(id, room_number, room_type:room_types(id, name, price_per_night)),
        hotel:hotels(name, address)
    `)
    .eq('hotel_id', hotelId)
    .lte('check_in_date', today)
    .gte('check_out_date', today)
    .neq('payment_status', 'cancelled')
    .order('check_in_date', { ascending: true });

  return (
    <BillingClient 
      initialReservations={(reservations as ReservationDetails[]) || []}
      hotelId={hotelId}
    />
  );
}