import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import GuestsManagementClient from './client';

export default async function GuestsPage() {
  // PERBAIKAN: Tambahkan 'await' di sini
  const cookieStore = await cookies(); 
  
  // @ts-ignore - workaround tipe untuk Next.js 15 + Supabase Auth Helpers
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // 1. Cek User (Gunakan getUser() yang lebih aman daripada getSession())
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/auth/login');
  }

  // 2. Ambil Hotel ID dari user_roles
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('hotel_id')
    .eq('user_id', user.id)
    .not('hotel_id', 'is', null)
    .maybeSingle();

  const hotelId = userRole?.hotel_id;

  if (!hotelId) {
    // Tampilkan state kosong jika tidak ada hotel
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