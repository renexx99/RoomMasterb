// src/app/housekeeping/report/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ReportClient from './client';

export default async function ReportPage() {
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

  // Fetch rooms and existing reports
  const [roomsRes, reportsRes] = await Promise.all([
    supabase
      .from('rooms')
      .select('id, room_number, room_type:room_types(id, name)')
      .eq('hotel_id', hotelId)
      .order('room_number', { ascending: true }),
    supabase
      .from('maintenance_reports')
      .select(`
        *,
        room:rooms(id, room_number, room_type:room_types(id, name))
      `)
      .eq('hotel_id', hotelId)
      .eq('reported_by', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return (
    <ReportClient
      rooms={roomsRes.data || []}
      reports={reportsRes.data || []}
      hotelId={hotelId}
    />
  );
}
