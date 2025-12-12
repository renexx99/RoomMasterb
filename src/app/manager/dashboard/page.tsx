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
  recentActivities: {
    id: string;
    guest_name: string;
    room_number: string;
    check_in_date: string;
    status: string;
    total_price: number;
  }[];
  hotelId: string;
}

export default async function ManagerDashboardPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // 1. Cek Sesi
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // 2. Ambil Role & Hotel ID
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
    const managerRole = userRoles?.find((ur: any) => 
      ur.hotel_id && ['Hotel Manager', 'Hotel Admin'].includes(ur.role?.name || '')
    );
    hotelId = managerRole?.hotel_id || null;
  }

  // Jika tetap tidak ada hotel, tampilkan kosong
  if (!hotelId) {
    return <div>Access Denied: No Hotel Assigned</div>;
  }

  // 3. Fetch Data Real-time (Parallel Fetching)
  const today = new Date().toISOString().split('T')[0];

  const [
    hotelRes,
    availableRoomsRes,
    todayCheckInsRes,
    todayCheckOutsRes,
    activeReservationsRes,
    recentRes
  ] = await Promise.all([
    // A. Nama Hotel
    supabase.from('hotels').select('name').eq('id', hotelId).single(),
    
    // B. Kamar Tersedia
    supabase.from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('status', 'available'),
      
    // C. Check-in Hari Ini (Belum Cancel)
    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('check_in_date', today)
      .neq('payment_status', 'cancelled'),

    // D. Check-out Hari Ini (Belum Cancel)
    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('check_out_date', today)
      .neq('payment_status', 'cancelled'),

    // E. Tamu In-House (Aktif hari ini)
    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .lte('check_in_date', today)
      .gt('check_out_date', today) // Menggunakan GT agar yang checkout hari ini tidak dihitung (sudah akan keluar)
      .neq('payment_status', 'cancelled'),

    // F. 5 Reservasi Terbaru
    supabase.from('reservations')
      .select(`
        id,
        total_price,
        payment_status,
        check_in_date,
        guest:guests(full_name),
        room:rooms(room_number)
      `)
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  // 4. Formatting Data
  const recentActivities = (recentRes.data || []).map((res: any) => ({
    id: res.id,
    guest_name: res.guest?.full_name || 'Unknown Guest',
    room_number: res.room?.room_number || 'TBA',
    check_in_date: res.check_in_date,
    status: res.payment_status,
    total_price: res.total_price || 0,
  }));

  const dashboardData: ManagerDashboardData = {
    hotelId,
    stats: {
      hotelName: hotelRes.data?.name || 'Unknown Hotel',
      availableRooms: availableRoomsRes.count || 0,
      todayCheckIns: todayCheckInsRes.count || 0,
      todayCheckOuts: todayCheckOutsRes.count || 0,
      guestsInHouse: activeReservationsRes.count || 0,
    },
    recentActivities: recentActivities,
  };

  return <ManagerDashboardClient data={dashboardData} />;
}