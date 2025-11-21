// src/app/admin/guests/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import GuestsManagementClient from './client';

export default async function GuestsPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // 1. Cek User
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/auth/login');
  }

  // --- LOGIKA IMPERSONASI ---
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
    // Cari role admin/manager yang valid
    const adminRole = userRoles?.find((ur: any) => 
      ur.hotel_id && 
      ['Hotel Admin', 'Hotel Manager'].includes(ur.role?.name || '')
    );
    hotelId = adminRole?.hotel_id || null;
  }
  // --- AKHIR LOGIKA IMPERSONASI ---

  if (!hotelId) {
    return <GuestsManagementClient initialGuests={[]} hotelId={null} />;
  }

  // 3. Fetch Guests Data
  const { data: guests } = await supabase
    .from('guests')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('full_name', { ascending: true });

  return (
    <GuestsManagementClient 
      initialGuests={guests || []} 
      hotelId={hotelId} 
    />
  );
}