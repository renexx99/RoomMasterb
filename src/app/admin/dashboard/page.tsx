import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './client';

export interface DashboardData {
  stats: {
    availableRooms: number;
    todayCheckIns: number;
    activeReservations: number;
    totalGuests: number;
    hotelName: string;
  };
  recentReservations: any[];
  hotelId: string | null;
}

export default async function AdminDashboardPage() {
  // 1. FIX: Await cookies() terlebih dahulu (Wajib di Next.js 15)
  const cookieStore = await cookies();

  // 2. FIX: Pass fungsi wrapper ke Supabase
  // 'as any' digunakan untuk menghindari konflik tipe data sementara
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore as any 
  });

  // 3. Cek Session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // 4. Ambil Hotel ID dari user_roles
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('hotel_id')
    .eq('user_id', session.user.id)
    .not('hotel_id', 'is', null)
    .limit(1)
    .single();

  const hotelId = userRole?.hotel_id || null;

  // Default data jika tidak ada hotel
  const emptyStats = { 
    availableRooms: 0, todayCheckIns: 0, activeReservations: 0, totalGuests: 0, hotelName: 'No Hotel Assigned' 
  };

  if (!hotelId) {
    return <AdminDashboardClient data={{ stats: emptyStats, recentReservations: [], hotelId: null }} />;
  }

  // 5. Fetch Data Dashboard (Paralel)
  const today = new Date().toISOString().split('T')[0];
  
  const [
    hotelRes,
    availableRoomsRes,
    todayCheckInsRes,
    activeReservationsRes,
    totalGuestsRes,
    recentReservationsRes
  ] = await Promise.all([
    supabase.from('hotels').select('name').eq('id', hotelId).single(),
    supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('status', 'available'),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('check_in_date', today).neq('payment_status', 'cancelled'),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).lte('check_in_date', today).gte('check_out_date', today).neq('payment_status', 'cancelled'),
    supabase.from('guests').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId),
    supabase.from('reservations')
      .select('*, guest:guests(full_name)')
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  const dashboardData: DashboardData = {
    hotelId,
    stats: {
      hotelName: hotelRes.data?.name || 'Hotel',
      availableRooms: availableRoomsRes.count || 0,
      todayCheckIns: todayCheckInsRes.count || 0,
      activeReservations: activeReservationsRes.count || 0,
      totalGuests: totalGuestsRes.count || 0,
    },
    recentReservations: recentReservationsRes.data || [],
  };

  return <AdminDashboardClient data={dashboardData} />;
}