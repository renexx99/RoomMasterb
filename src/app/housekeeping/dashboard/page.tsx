// src/app/housekeeping/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import HousekeepingDashboardClient from './client';

export interface HousekeepingDashboardData {
  stats: {
    dirtyRooms: number;
    cleaningRooms: number;
    completedToday: number;
    openReports: number;
    totalRooms: number;
    hotelName: string;
  };
  rooms: any[];
}

export default async function HousekeepingDashboardPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  // Determine hotel ID
  let hotelId: string | null = null;
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('*, role:roles(name)')
    .eq('user_id', session.user.id);

  const isSuperAdmin = userRoles?.some((ur: any) => ur.role?.name === 'Super Admin');

  if (isSuperAdmin) {
    hotelId = cookieStore.get('impersonated_hotel_id')?.value || null;
    if (!hotelId) redirect('/super-admin/dashboard');
  } else {
    const hkRole = userRoles?.find((ur: any) =>
      ur.hotel_id && ur.role?.name === 'Housekeeping'
    );
    hotelId = hkRole?.hotel_id || null;
  }

  if (!hotelId) {
    return <div>No Hotel Assigned</div>;
  }

  const today = new Date().toISOString().split('T')[0];

  // Fetch data in parallel
  const [
    hotelRes,
    roomsRes,
    dirtyRes,
    cleaningRes,
    completedTasksRes,
    openReportsRes,
  ] = await Promise.all([
    supabase.from('hotels').select('name').eq('id', hotelId).single(),
    supabase.from('rooms')
      .select(`
        id, room_number, status, cleaning_status, floor_number, wing, special_notes,
        room_type:room_types(id, name)
      `)
      .eq('hotel_id', hotelId)
      .order('room_number', { ascending: true }),
    supabase.from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('cleaning_status', 'dirty'),
    supabase.from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('cleaning_status', 'cleaning'),
    supabase.from('housekeeping_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('status', 'completed')
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`),
    supabase.from('maintenance_reports')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('status', 'open'),
  ]);

  const data: HousekeepingDashboardData = {
    stats: {
      hotelName: hotelRes.data?.name || 'Unknown Hotel',
      dirtyRooms: dirtyRes.count || 0,
      cleaningRooms: cleaningRes.count || 0,
      completedToday: completedTasksRes.count || 0,
      openReports: openReportsRes.count || 0,
      totalRooms: roomsRes.data?.length || 0,
    },
    rooms: roomsRes.data || [],
  };

  return <HousekeepingDashboardClient data={data} />;
}
