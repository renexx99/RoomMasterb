import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import HotelsManagementClient from './client';
import { HotelWithStats } from '@/core/types/database';

export default async function HotelsPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // 1. Fetch Hotels
  const { data: hotels, error } = await supabase
    .from('hotels')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !hotels) return <div>Error loading hotels</div>;

  // 2. Fetch Stats Aggregation
  const hotelsWithStats: HotelWithStats[] = await Promise.all(
    hotels.map(async (hotel) => {
      // Count Rooms
      const { count: roomCount } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })
        .eq('hotel_id', hotel.id);

      // Count Staff
      const { count: staffCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('hotel_id', hotel.id);

      // Active Residents (Reservasi aktif hari ini)
      const today = new Date().toISOString().split('T')[0];
      const { count: activeResidents } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('hotel_id', hotel.id)
        .lte('check_in_date', today)
        .gte('check_out_date', today)
        .neq('payment_status', 'cancelled');

      // Total Revenue (Semua reservasi 'paid')
      const { data: revenueData } = await supabase
        .from('reservations')
        .select('total_price')
        .eq('hotel_id', hotel.id)
        .eq('payment_status', 'paid');
      
      const totalRevenue = revenueData?.reduce((sum, res) => sum + (Number(res.total_price) || 0), 0) || 0;

      return {
        ...hotel,
        total_rooms: roomCount || 0,
        total_staff: staffCount || 0,
        active_residents: activeResidents || 0,
        total_revenue: totalRevenue
      };
    })
  );

  return <HotelsManagementClient initialHotels={hotelsWithStats} />;
}