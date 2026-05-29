// src/app/admin/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './client';

export interface OccupancyItem {
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface RevenueTrendItem {
  label: string;
  value: number; // actual revenue amount
}

export interface DashboardData {
  stats: {
    availableRooms: number;
    todayCheckIns: number;
    activeReservations: number;
    totalGuests: number;
    totalRooms: number;
    hotelName: string;
  };
  occupancyData: OccupancyItem[];
  revenueTrend: RevenueTrendItem[];
  avgDailyRevenue: number;
  recentReservations: any[];
  hotelId: string | null;
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  // 'as any' digunakan untuk menghindari konflik tipe data sementara
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore as any 
  });

  // 1. Cek Session
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
      // Jika tidak ada cookie, kembalikan ke dashboard super admin
      redirect('/super-admin/dashboard');
    }
  } else {
    // C. User Biasa (Hotel Admin asli), ambil dari database
    const adminRole = userRoles?.find((ur: any) => 
      ur.hotel_id && 
      ['Hotel Admin', 'Hotel Manager'].includes(ur.role?.name || '')
    );
    
    hotelId = adminRole?.hotel_id || null;
  }

  // Default data jika tidak ada hotel
  const emptyData: DashboardData = { 
    stats: {
      availableRooms: 0, 
      todayCheckIns: 0, 
      activeReservations: 0, 
      totalGuests: 0, 
      totalRooms: 0,
      hotelName: 'No Hotel Assigned' 
    },
    occupancyData: [],
    revenueTrend: [],
    avgDailyRevenue: 0,
    recentReservations: [], 
    hotelId: null 
  };

  if (!hotelId) {
    return <AdminDashboardClient data={emptyData} />;
  }

  // 3. Fetch Data Dashboard (Paralel)
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Generate last 7 days
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const last7Days: { date: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last7Days.push({
      date: d.toISOString().split('T')[0],
      label: dayLabels[d.getDay()],
    });
  }
  
  const [
    hotelRes,
    totalRoomsRes,
    availableRoomsRes,
    occupiedRoomsRes,
    maintenanceRoomsRes,
    todayCheckInsRes,
    activeReservationsRes,
    totalGuestsRes,
    recentReservationsRes
  ] = await Promise.all([
    supabase.from('hotels').select('name').eq('id', hotelId).single(),
    supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId),
    supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('status', 'available'),
    supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('status', 'occupied'),
    supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('status', 'maintenance'),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('check_in_date', todayStr).neq('payment_status', 'cancelled'),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).lte('check_in_date', todayStr).gte('check_out_date', todayStr).neq('payment_status', 'cancelled'),
    supabase.from('guests').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId),
    supabase.from('reservations')
      .select('*, guest:guests(full_name)')
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  const totalRooms = totalRoomsRes.count || 0;
  const occupied = occupiedRoomsRes.count || 0;
  const available = availableRoomsRes.count || 0;
  const maintenance = maintenanceRoomsRes.count || 0;

  // Occupancy Data for Ring Chart
  const occupancyData: OccupancyItem[] = [];
  if (totalRooms > 0) {
    if (occupied > 0) occupancyData.push({
      label: 'Occupied',
      amount: occupied,
      percentage: Math.round((occupied / totalRooms) * 100),
      color: 'teal',
    });
    if (available > 0) occupancyData.push({
      label: 'Available',
      amount: available,
      percentage: Math.round((available / totalRooms) * 100),
      color: 'blue',
    });
    if (maintenance > 0) occupancyData.push({
      label: 'Maintenance',
      amount: maintenance,
      percentage: Math.round((maintenance / totalRooms) * 100),
      color: 'orange',
    });
  }

  // 7-Day Revenue Trend
  const revenueTrendPromises = last7Days.map(async (day) => {
    const { data: dayRevenue } = await supabase
      .from('reservations')
      .select('total_price')
      .eq('hotel_id', hotelId)
      .eq('check_in_date', day.date)
      .neq('payment_status', 'cancelled');

    const totalRev = (dayRevenue || []).reduce((sum: number, r: any) => sum + (r.total_price || 0), 0);
    return { label: day.label, value: totalRev };
  });

  const revenueTrend = await Promise.all(revenueTrendPromises);
  const avgDailyRevenue = revenueTrend.length > 0
    ? revenueTrend.reduce((sum, d) => sum + d.value, 0) / revenueTrend.length
    : 0;

  const dashboardData: DashboardData = {
    hotelId,
    stats: {
      hotelName: hotelRes.data?.name || 'Hotel',
      totalRooms,
      availableRooms: available,
      todayCheckIns: todayCheckInsRes.count || 0,
      activeReservations: activeReservationsRes.count || 0,
      totalGuests: totalGuestsRes.count || 0,
    },
    occupancyData,
    revenueTrend,
    avgDailyRevenue,
    recentReservations: recentReservationsRes.data || [],
  };

  return <AdminDashboardClient data={dashboardData} />;
}