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

  // 2. Fetch Stats (Rooms & Staff count) for each hotel
  // Note: Untuk performa terbaik di skala besar, ini sebaiknya menggunakan 
  // Postgres View atau query aggregate langsung di Supabase. 
  // Untuk saat ini, kita gunakan Promise.all map agar praktis.
  
  const hotelsWithStats: HotelWithStats[] = await Promise.all(
    hotels.map(async (hotel) => {
      // Count Rooms
      const { count: roomCount } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })
        .eq('hotel_id', hotel.id);

      // Count Staff (via user_roles)
      const { count: staffCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('hotel_id', hotel.id);

      return {
        ...hotel,
        total_rooms: roomCount || 0,
        total_staff: staffCount || 0,
      };
    })
  );

  return <HotelsManagementClient initialHotels={hotelsWithStats} />;
}