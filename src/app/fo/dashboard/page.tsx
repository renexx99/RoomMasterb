// src/app/fo/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FoDashboardClient from './client';
import { ReservationDetails } from '../reservations/page';

// Interface untuk Data yang akan dikirim ke Client
export interface ArrivalGuest {
  guestName: string;
  title: string;
  loyaltyTier: string;
  preferences: string[];
  roomType: string;
  roomNumber: string;
}

export interface DashboardData {
  stats: {
    todayCheckIns: number;
    todayCheckOuts: number;
    availableRooms: number;
    dirtyRooms: number;
    hotelName: string;
  };
  recentReservations: ReservationDetails[];
  todayArrivals: ArrivalGuest[];
}

export default async function FoDashboardPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // 1. Cek Sesi User
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }

  // 2. Tentukan Hotel ID
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
    return <div>No Hotel Assigned</div>;
  }

  // 3. Fetch Data Dashboard Secara Paralel
  const today = new Date().toISOString().split('T')[0];

  const [
    hotelRes,
    availableRes,
    dirtyRes,
    checkInsRes,
    checkOutsRes,
    recentRes,
    arrivalsRes
  ] = await Promise.all([
    // a. Nama Hotel
    supabase.from('hotels').select('name').eq('id', hotelId).single(),
    
    // b. Kamar Tersedia
    supabase.from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('status', 'available'),

    // c. Kamar Kotor
    supabase.from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('status', 'available')
      .eq('cleaning_status', 'dirty'),

    // d. Check-in Hari Ini (Expected Arrival)
    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('check_in_date', today)
      .neq('payment_status', 'cancelled'),

    // e. Check-out Hari Ini (Expected Departure)
    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('check_out_date', today)
      .neq('payment_status', 'cancelled'),

    // f. Recent Activity (Reservations)
    supabase.from('reservations')
      .select(`
        *,
        guest:guests(id, full_name, email, phone_number),
        room:rooms(id, room_number, room_type:room_types(id, name, price_per_night)),
        hotel:hotels(name, address)
      `)
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false })
      .limit(10),

    // g. Today's Arrivals with Guest Details (untuk AI Insights)
    supabase.from('reservations')
      .select(`
        id,
        guest:guests(full_name, title, loyalty_tier, preferences),
        room:rooms(room_number, room_type:room_types(name))
      `)
      .eq('hotel_id', hotelId)
      .eq('check_in_date', today)
      .neq('payment_status', 'cancelled')
      .limit(10)
  ]);

  // Format today's arrivals for AI insights
  const todayArrivals: ArrivalGuest[] = (arrivalsRes.data || []).map((res: any) => ({
    guestName: res.guest?.full_name || 'Unknown',
    title: res.guest?.title || '',
    loyaltyTier: res.guest?.loyalty_tier || 'Bronze',
    preferences: (res.guest?.preferences as any)?.tags || [],
    roomType: res.room?.room_type?.name || 'Standard',
    roomNumber: res.room?.room_number || 'TBA',
  }));

  const dashboardData: DashboardData = {
    stats: {
      hotelName: hotelRes.data?.name || 'Unknown Hotel',
      availableRooms: availableRes.count || 0,
      dirtyRooms: dirtyRes.count || 0,
      todayCheckIns: checkInsRes.count || 0,
      todayCheckOuts: checkOutsRes.count || 0,
    },
    recentReservations: (recentRes.data as ReservationDetails[]) || [],
    todayArrivals,
  };

  return <FoDashboardClient data={dashboardData} />;
}