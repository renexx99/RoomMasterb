// src/app/fo/guests/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import GuestsClient from './client';
import { Guest } from '@/core/types/database';

export default async function FoGuestsPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  // 1. Ambil Hotel ID
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('hotel_id')
    .eq('user_id', session.user.id)
    .not('hotel_id', 'is', null)
    .maybeSingle();

  const hotelId = userRole?.hotel_id;

  if (!hotelId) {
    return <GuestsClient initialGuests={[]} hotelId={null} />;
  }

  // 2. Fetch Guests
  const { data: guests } = await supabase
    .from('guests')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('full_name', { ascending: true });

  return (
    <GuestsClient 
      initialGuests={(guests as Guest[]) || []}
      hotelId={hotelId}
    />
  );
}