// src/app/manager/guests/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ManagerGuestsClient from './client';

export default async function ManagerGuestsPage() {
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
    return <ManagerGuestsClient initialGuests={[]} hotelId="" />;
  }

  // Fetch Guests
  const { data: guests } = await supabase
    .from('guests')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('full_name', { ascending: true });

  return (
    <ManagerGuestsClient 
      initialGuests={guests || []}
      hotelId={hotelId}
    />
  );
}