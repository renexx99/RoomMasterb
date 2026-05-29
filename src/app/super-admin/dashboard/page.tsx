import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SuperAdminDashboardClient from './client';

export interface MonthlyRevenueItem {
  month: string;
  value: number;
}

export interface HotelDistItem {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RecentActivityItem {
  id: string;
  hotel: string;
  action: string;
  user: string;
  time: string;
  type: string;
}

export interface SuperAdminDashboardData {
  stats: {
    totalHotels: number;
    totalUsers: number;
    totalRevenue: number;
    totalReservations: number;
  };
  monthlyRevenue: MonthlyRevenueItem[];
  hotelDistribution: HotelDistItem[];
  recentActivities: RecentActivityItem[];
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Fetch all stats in parallel
  const [
    hotelCountRes,
    userCountRes,
    totalRevenueRes,
    totalReservationsRes,
    recentReservationsRes,
    hotelStatusRes,
  ] = await Promise.all([
    supabase.from('hotels').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    // Total revenue from all reservations (non-cancelled)
    supabase.from('reservations')
      .select('total_price')
      .neq('payment_status', 'cancelled'),
    // Total reservations
    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .neq('payment_status', 'cancelled'),
    // Recent reservations across all hotels
    supabase.from('reservations')
      .select(`
        id,
        payment_status,
        created_at,
        total_price,
        guest:guests(full_name),
        hotel:hotels(name)
      `)
      .order('created_at', { ascending: false })
      .limit(5),
    // Hotel distribution by status
    supabase.from('hotels')
      .select('id, status'),
  ]);

  // Calculate total revenue
  const totalRevenue = (totalRevenueRes.data || []).reduce(
    (sum: number, r: any) => sum + (r.total_price || 0), 0
  );

  // Monthly revenue (last 7 months)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const now = new Date();
  const monthlyRevenuePromises: Promise<MonthlyRevenueItem>[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startOfMonth = d.toISOString().split('T')[0];
    const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const endOfMonth = endDate.toISOString().split('T')[0];
    const monthLabel = months[d.getMonth()];

    monthlyRevenuePromises.push(
      (async () => {
        const { data } = await supabase
          .from('reservations')
          .select('total_price')
          .gte('check_in_date', startOfMonth)
          .lte('check_in_date', endOfMonth)
          .neq('payment_status', 'cancelled');
        
        const monthTotal = (data || []).reduce((sum: number, r: any) => sum + (r.total_price || 0), 0);
        return { month: monthLabel, value: monthTotal };
      })()
    );
  }

  const monthlyRevenue = await Promise.all(monthlyRevenuePromises);

  // Hotel distribution by status
  const allHotels = hotelStatusRes.data || [];
  const totalHotels = hotelCountRes.count || 0;
  const statusGroups: Record<string, number> = {};
  allHotels.forEach((h: any) => {
    const s = h.status || 'active';
    statusGroups[s] = (statusGroups[s] || 0) + 1;
  });

  const statusColors: Record<string, string> = {
    active: 'violet',
    maintenance: 'orange',
    suspended: 'red',
  };

  const statusLabels: Record<string, string> = {
    active: 'Active',
    maintenance: 'Maintenance',
    suspended: 'Suspended',
  };

  const hotelDistribution: HotelDistItem[] = Object.entries(statusGroups).map(([status, count]) => ({
    category: statusLabels[status] || status,
    count,
    percentage: totalHotels > 0 ? Math.round((count / totalHotels) * 100) : 0,
    color: statusColors[status] || 'gray',
  }));

  // Format recent activities from reservations
  const recentActivities: RecentActivityItem[] = (recentReservationsRes.data || []).map((res: any) => {
    const timeAgo = getTimeAgo(new Date(res.created_at));
    const actionMap: Record<string, string> = {
      paid: 'Reservation Confirmed',
      pending: 'New Reservation Created',
      cancelled: 'Reservation Cancelled',
      city_ledger: 'City Ledger Booking',
    };
    const typeMap: Record<string, string> = {
      paid: 'payment',
      pending: 'user',
      cancelled: 'system',
      city_ledger: 'payment',
    };

    return {
      id: res.id.substring(0, 8).toUpperCase(),
      hotel: res.hotel?.name || 'Unknown Hotel',
      action: actionMap[res.payment_status] || 'Reservation Activity',
      user: res.guest?.full_name || 'Guest',
      time: timeAgo,
      type: typeMap[res.payment_status] || 'user',
    };
  });

  const dashboardData: SuperAdminDashboardData = {
    stats: {
      totalHotels,
      totalUsers: userCountRes.count || 0,
      totalRevenue,
      totalReservations: totalReservationsRes.count || 0,
    },
    monthlyRevenue,
    hotelDistribution,
    recentActivities,
  };

  return <SuperAdminDashboardClient data={dashboardData} />;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}