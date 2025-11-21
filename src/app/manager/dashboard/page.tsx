// src/app/manager/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ManagerDashboardClient from './client';

// Interface untuk data yang dikirim ke client
export interface ManagerDashboardData {
  stats: {
    availableRooms: number;
    todayCheckIns: number;
    todayCheckOuts: number;
    guestsInHouse: number;
    hotelName: string;
  };
  recentActivities: any[]; // Placeholder untuk data tabel
  hotelId: string;
}

export default async function ManagerDashboardPage() {
  const cookieStore = await cookies();
  // @ts-ignore 
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // 1. Cek Sesi
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // 2. Ambil Hotel ID
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('hotel_id')
    .eq('user_id', user.id)
    .not('hotel_id', 'is', null)
    .limit(1)
    .single();

  const hotelId = userRole?.hotel_id;

  // Jika tidak ada hotel, tampilkan state kosong di client
  if (!hotelId) {
    return <ManagerDashboardClient data={{ 
        stats: { availableRooms: 0, todayCheckIns: 0, todayCheckOuts: 0, guestsInHouse: 0, hotelName: 'No Hotel' }, 
        recentActivities: [], 
        hotelId: '' 
    }} />;
  }

  // 3. Fetch Statistik secara Paralel
  const today = new Date().toISOString().split('T')[0];

  const [
    hotelRes,
    availableRoomsRes,
    todayCheckInsRes,
    todayCheckOutsRes,
    guestsInHouseRes
  ] = await Promise.all([
    supabase.from('hotels').select('name').eq('id', hotelId).single(),
    supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('status', 'available'),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('check_in_date', today).neq('payment_status', 'cancelled'),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('check_out_date', today).neq('payment_status', 'cancelled'),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).lte('check_in_date', today).gte('check_out_date', today).neq('payment_status', 'cancelled'),
  ]);

  const dashboardData: ManagerDashboardData = {
    hotelId,
    stats: {
      hotelName: hotelRes.data?.name || 'Unknown Hotel',
      availableRooms: availableRoomsRes.count || 0,
      todayCheckIns: todayCheckInsRes.count || 0,
      todayCheckOuts: todayCheckOutsRes.count || 0,
      guestsInHouse: guestsInHouseRes.count || 0,
    },
    recentActivities: [], // Nanti diisi data real atau fetch di client
  };

  return <ManagerDashboardClient data={dashboardData} />;
}