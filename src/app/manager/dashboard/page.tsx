// src/app/manager/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ManagerDashboardClient from './client';

export interface OccupancyTrendItem {
  day: string;
  value: number; // percentage
}

export interface RevenueCategoryItem {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface ManagerDashboardData {
  stats: {
    availableRooms: number;
    totalRooms: number;
    occupiedRooms: number;
    occupancyRate: number;
    adr: number; // Average Daily Rate in IDR
    todayCheckIns: number;
    todayCheckOuts: number;
    guestsInHouse: number;
    hotelName: string;
  };
  occupancyTrend: OccupancyTrendItem[];
  revenueBreakdown: RevenueCategoryItem[];
  totalRevenueToday: number;
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
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Generate last 7 days labels
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
    todayCheckInsRes,
    todayCheckOutsRes,
    activeReservationsRes,
    recentRes,
    todayRevenueRes,
  ] = await Promise.all([
    // A. Nama Hotel
    supabase.from('hotels').select('name').eq('id', hotelId).single(),

    // B. Total Kamar
    supabase.from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId),

    // C. Kamar Tersedia
    supabase.from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('status', 'available'),

    // D. Kamar Occupied
    supabase.from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('status', 'occupied'),

    // E. Check-in Hari Ini (Belum Cancel)
    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('check_in_date', todayStr)
      .neq('payment_status', 'cancelled'),

    // F. Check-out Hari Ini (Belum Cancel)
    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('check_out_date', todayStr)
      .neq('payment_status', 'cancelled'),

    // G. Tamu In-House (Aktif hari ini)
    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .lte('check_in_date', todayStr)
      .gt('check_out_date', todayStr)
      .neq('payment_status', 'cancelled'),

    // H. 5 Reservasi Terbaru
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
      .limit(5),

    // I. Revenue hari ini (dari reservasi yang check-in hari ini atau in-house)
    supabase.from('reservations')
      .select('total_price')
      .eq('hotel_id', hotelId)
      .eq('check_in_date', todayStr)
      .neq('payment_status', 'cancelled'),
  ]);

  // Fetch 7-day occupancy trend:
  // For each of the last 7 days, count reservations that overlap that date
  const occupancyTrendPromises = last7Days.map(async (day) => {
    const { count } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .lte('check_in_date', day.date)
      .gt('check_out_date', day.date)
      .neq('payment_status', 'cancelled');
    return { day: day.label, occupiedCount: count || 0 };
  });

  const occupancyTrendRaw = await Promise.all(occupancyTrendPromises);
  const totalRooms = totalRoomsRes.count || 1; // avoid division by zero

  const occupancyTrend: OccupancyTrendItem[] = occupancyTrendRaw.map((item) => ({
    day: item.day,
    value: Math.round((item.occupiedCount / totalRooms) * 100),
  }));

  // Compute stats
  const occupiedRooms = occupiedRoomsRes.count || 0;
  const availableRooms = availableRoomsRes.count || 0;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100 * 10) / 10 : 0;

  // Calculate ADR: total revenue from active in-house reservations / number of occupied rooms
  // We use today's reservations to compute a simple ADR
  const todayRevenues = todayRevenueRes.data || [];
  const todayTotalRevenue = todayRevenues.reduce((sum: number, r: any) => sum + (r.total_price || 0), 0);
  const todayCheckIns = todayCheckInsRes.count || 0;
  const adr = todayCheckIns > 0 ? Math.round(todayTotalRevenue / todayCheckIns) : 0;

  // Revenue breakdown by room type (from active in-house reservations)
  const { data: inHouseReservations } = await supabase
    .from('reservations')
    .select('total_price, room:rooms(room_type:room_types(name))')
    .eq('hotel_id', hotelId)
    .lte('check_in_date', todayStr)
    .gte('check_out_date', todayStr)
    .neq('payment_status', 'cancelled');

  // Group revenue by room type
  const revenueByType: Record<string, number> = {};
  let totalActiveRevenue = 0;
  (inHouseReservations || []).forEach((res: any) => {
    const typeName = res.room?.room_type?.name || 'Other';
    const price = res.total_price || 0;
    revenueByType[typeName] = (revenueByType[typeName] || 0) + price;
    totalActiveRevenue += price;
  });

  const typeColors = ['indigo', 'teal', 'violet', 'blue', 'orange', 'pink'];
  const revenueBreakdown: RevenueCategoryItem[] = Object.entries(revenueByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4) // Top 4 categories
    .map(([category, amount], idx) => ({
      category,
      amount,
      percentage: totalActiveRevenue > 0 ? Math.round((amount / totalActiveRevenue) * 100) : 0,
      color: typeColors[idx % typeColors.length],
    }));

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
      totalRooms,
      availableRooms,
      occupiedRooms,
      occupancyRate,
      adr,
      todayCheckIns,
      todayCheckOuts: todayCheckOutsRes.count || 0,
      guestsInHouse: activeReservationsRes.count || 0,
    },
    occupancyTrend,
    revenueBreakdown,
    totalRevenueToday: totalActiveRevenue,
    recentActivities,
  };

  return <ManagerDashboardClient data={dashboardData} />;
}