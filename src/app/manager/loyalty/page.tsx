// src/app/manager/loyalty/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoyaltyDashboardClient from './client';
import { getLoyaltyConfig, getPointsLog } from './actions';

export default async function ManagerLoyaltyPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  // --- IMPERSONATION & ROLE LOGIC ---
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
    const managerRole = userRoles?.find((ur: any) =>
      ur.hotel_id &&
      ['Hotel Admin', 'Hotel Manager'].includes(ur.role?.name || '')
    );
    hotelId = managerRole?.hotel_id || null;
  }

  if (!hotelId) {
    return <LoyaltyDashboardClient guests={[]} config={null} pointsLog={[]} hotelId="" userId="" />;
  }

  // Fetch all guests with loyalty data
  const { data: guests } = await supabase
    .from('guests')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('loyalty_points', { ascending: false });

  // Fetch loyalty config
  const config = await getLoyaltyConfig(hotelId);

  // Fetch points log
  const pointsLog = await getPointsLog(hotelId, 100);

  return (
    <LoyaltyDashboardClient
      guests={guests || []}
      config={config}
      pointsLog={pointsLog}
      hotelId={hotelId}
      userId={session.user.id}
    />
  );
}
