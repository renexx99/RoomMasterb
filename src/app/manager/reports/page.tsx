// src/app/manager/reports/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ManagerReportsClient from './client';

export interface ReportStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  revenueToday: number;
  hotelName: string;
}

export default async function ManagerReportsPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // 1. Cek User
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

  // Default stats jika tidak ada hotel
  const emptyStats: ReportStats = {
    totalRooms: 0, availableRooms: 0, occupiedRooms: 0, maintenanceRooms: 0,
    occupancyRate: 0, todayCheckIns: 0, todayCheckOuts: 0, revenueToday: 0,
    hotelName: 'No Hotel Assigned'
  };

  if (!hotelId) {
    return <ManagerReportsClient stats={emptyStats} />;
  }

  // 3. Fetch Data Statistik (Paralel)
  const today = new Date().toISOString().split('T')[0];

  const [
    hotelRes,
    roomsRes,
    checkInsRes,
    checkOutsRes,
    revenueRes
  ] = await Promise.all([
    // Nama Hotel
    supabase.from('hotels').select('name').eq('id', hotelId).single(),
    // Status Semua Kamar (untuk hitung total, occupied, dll)
    supabase.from('rooms').select('status').eq('hotel_id', hotelId),
    // Check-in Hari Ini
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('check_in_date', today).neq('payment_status', 'cancelled'),
    // Check-out Hari Ini
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('check_out_date', today).neq('payment_status', 'cancelled'),
    // Pendapatan Hari Ini (Paid check-ins)
    supabase.from('reservations').select('total_price').eq('hotel_id', hotelId).eq('check_in_date', today).eq('payment_status', 'paid')
  ]);

  // 4. Kalkulasi Data
  const rooms = roomsRes.data || [];
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length;
  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

  const revenueToday = revenueRes.data?.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0) || 0;

  const stats: ReportStats = {
    hotelName: hotelRes.data?.name || 'Unknown Hotel',
    totalRooms,
    availableRooms,
    occupiedRooms,
    maintenanceRooms,
    occupancyRate,
    todayCheckIns: checkInsRes.count || 0,
    todayCheckOuts: checkOutsRes.count || 0,
    revenueToday
  };

  return <ManagerReportsClient stats={stats} />;
}