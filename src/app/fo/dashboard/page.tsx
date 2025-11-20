// src/app/fo/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FoDashboardClient from './client';
// Pastikan path mock json ini benar relative terhadap file ini
import ordersMock from '../../../../public/mocks/Orders.json'; 

// Interface untuk Data yang akan dikirim ke Client
export interface DashboardData {
  stats: {
    todayCheckIns: number;
    todayCheckOuts: number;
    availableRooms: number;
    dirtyRooms: number;
    hotelName: string;
  };
  orders: any[]; 
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

  // 2. Ambil Hotel ID dari User Role
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('hotel_id')
    .eq('user_id', session.user.id)
    // PERBAIKAN: Menghapus baris .eq() yang salah
    .not('hotel_id', 'is', null) // Hanya ambil role yang terhubung ke hotel
    .limit(1)
    .single();

  const hotelId = userRole?.hotel_id;

  // Jika tidak ada Hotel ID, kirim data kosong
  if (!hotelId) {
    return <FoDashboardClient data={{ 
      stats: { todayCheckIns: 0, todayCheckOuts: 0, availableRooms: 0, dirtyRooms: 0, hotelName: '' }, 
      orders: [] 
    }} />;
  }

  // 3. Fetch Data Dashboard Secara Paralel
  const today = new Date().toISOString().split('T')[0];

  const [
    hotelRes,
    availableRes,
    dirtyRes,
    checkInsRes,
    checkOutsRes
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
      .eq('status', 'dirty'),

    // d. Check-in Hari Ini
    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('check_in_date', today)
      .neq('payment_status', 'cancelled'),

    // e. Check-out Hari Ini
    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('check_out_date', today)
      .neq('payment_status', 'cancelled'),
  ]);

  const dashboardData: DashboardData = {
    stats: {
      hotelName: hotelRes.data?.name || 'Unknown Hotel',
      availableRooms: availableRes.count || 0,
      dirtyRooms: dirtyRes.count || 0,
      todayCheckIns: checkInsRes.count || 0,
      todayCheckOuts: checkOutsRes.count || 0,
    },
    orders: ordersMock || [],
  };

  return <FoDashboardClient data={dashboardData} />;
}