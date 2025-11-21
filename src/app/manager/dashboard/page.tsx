// src/app/manager/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ManagerDashboardClient from './client';

export interface ManagerDashboardData {
  stats: {
    availableRooms: number;
    todayCheckIns: number;
    todayCheckOuts: number;
    guestsInHouse: number;
    hotelName: string;
  };
  recentActivities: any[];
  hotelId: string;
}

export default async function ManagerDashboardPage() {
  const cookieStore = await cookies();
  // @ts-ignore 
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // 1. Cek Sesi
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // 2. Ambil Role Asli User & Cek Impersonasi
  let hotelId: string | null = null;

  // A. Ambil data roles user dari DB
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('*, role:roles(name)')
    .eq('user_id', user.id);

  const isSuperAdmin = userRoles?.some((ur: any) => ur.role?.name === 'Super Admin');

  // B. Logika Penentuan Hotel ID
  if (isSuperAdmin) {
    // Jika Super Admin, cek apakah ada cookie impersonasi
    const impersonatedHotelId = cookieStore.get('impersonated_hotel_id')?.value;
    if (impersonatedHotelId) {
      hotelId = impersonatedHotelId;
    } else {
      // Jika Super Admin masuk halaman ini tanpa impersonasi, redirect balik
      redirect('/super-admin/dashboard');
    }
  } else {
    // Jika User Biasa (Manager asli), ambil dari role mereka
    const managerRole = userRoles?.find((ur: any) => ur.hotel_id && ur.role?.name === 'Hotel Manager');
    hotelId = managerRole?.hotel_id;
  }

  // Jika tetap tidak ada hotel, tampilkan kosong
  if (!hotelId) {
    return <ManagerDashboardClient data={{ 
        stats: { availableRooms: 0, todayCheckIns: 0, todayCheckOuts: 0, guestsInHouse: 0, hotelName: 'No Hotel' }, 
        recentActivities: [], 
        hotelId: '' 
    }} />;
  }

  // 3. Fetch Statistik (Sama seperti sebelumnya)
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
    recentActivities: [],
  };

  return <ManagerDashboardClient data={dashboardData} />;
}