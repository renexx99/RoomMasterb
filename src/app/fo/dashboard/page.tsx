// src/app/fo/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FoDashboardClient from './client';
// Pastikan path mock json ini benar relative terhadap struktur folder kamu
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

  // 2. Tentukan Hotel ID (Logika Impersonasi vs User Biasa)
  let hotelId: string | null = null;

  // A. Ambil role user saat ini
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('*, role:roles(name)')
    .eq('user_id', session.user.id);

  // Cek apakah user adalah Super Admin
  const isSuperAdmin = userRoles?.some((ur: any) => ur.role?.name === 'Super Admin');

  if (isSuperAdmin) {
    // B. Jika Super Admin, ambil hotel_id dari Cookie Impersonasi
    const impersonatedId = cookieStore.get('impersonated_hotel_id')?.value;
    
    if (impersonatedId) {
      hotelId = impersonatedId;
    } else {
      // Jika tidak ada cookie (misal akses langsung via URL), kembalikan ke dashboard super admin
      redirect('/super-admin/dashboard');
    }
  } else {
    // C. User Biasa (Front Office / Manager asli), ambil dari database
    // Kita cari role yang relevan dengan operasional hotel
    const operationalRole = userRoles?.find((ur: any) => 
      ur.hotel_id && 
      ['Front Office', 'Hotel Manager', 'Hotel Admin'].includes(ur.role?.name || '')
    );
    
    hotelId = operationalRole?.hotel_id || null;
  }

  // Jika tetap tidak ada Hotel ID, kirim data kosong (atau bisa redirect ke login)
  if (!hotelId) {
    return <FoDashboardClient data={{ 
      stats: { 
        todayCheckIns: 0, 
        todayCheckOuts: 0, 
        availableRooms: 0, 
        dirtyRooms: 0, 
        hotelName: 'No Hotel Assigned' 
      }, 
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