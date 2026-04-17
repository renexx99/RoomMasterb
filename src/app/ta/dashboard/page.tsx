// src/app/ta/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TaDashboardClient from './client';

export interface TaDashboardData {
  stats: {
    totalBookings: number;
    confirmedBookings: number;
    checkedInBookings: number;
    cancelledBookings: number;
    hotelName: string;
  };
  recentReservations: any[];
  allotment: {
    totalAllotted: number;
    used: number;
    remaining: number;
  };
}

export default async function TaDashboardPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  // Get agent's hotel assignment
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('hotel_id, role:roles(name)')
    .eq('user_id', session.user.id);

  const taRole = userRoles?.find((ur: any) => ur.role?.name === 'Travel Agent');
  const hotelId = taRole?.hotel_id;

  if (!hotelId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        No hotel assignment found. Please contact the administrator.
      </div>
    );
  }

  // Fetch data in parallel
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [
    hotelRes,
    totalRes,
    confirmedRes,
    checkedInRes,
    cancelledRes,
    recentRes,
  ] = await Promise.all([
    supabase.from('hotels').select('name').eq('id', hotelId).single(),

    // Total bookings by this agent (last 30 days)
    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', session.user.id)
      .gte('created_at', thirtyDaysAgo),

    // Confirmed (not checked in, not cancelled)
    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', session.user.id)
      .eq('payment_status', 'paid')
      .is('checked_in_at', null),

    // Checked in
    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', session.user.id)
      .not('checked_in_at', 'is', null)
      .is('checked_out_at', null),

    // Cancelled
    supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', session.user.id)
      .eq('payment_status', 'cancelled'),

    // Recent reservations (last 10)
    supabase.from('reservations')
      .select(`
        *,
        guest:guests(id, full_name, email, phone_number),
        room:rooms(id, room_number, room_type:room_types(id, name))
      `)
      .eq('agent_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const dashboardData: TaDashboardData = {
    stats: {
      hotelName: hotelRes.data?.name || 'Unknown Hotel',
      totalBookings: totalRes.count || 0,
      confirmedBookings: confirmedRes.count || 0,
      checkedInBookings: checkedInRes.count || 0,
      cancelledBookings: cancelledRes.count || 0,
    },
    recentReservations: recentRes.data || [],
    allotment: {
      // Mock allotment data for now
      totalAllotted: 10,
      used: 7,
      remaining: 3,
    },
  };

  return <TaDashboardClient data={dashboardData} />;
}
