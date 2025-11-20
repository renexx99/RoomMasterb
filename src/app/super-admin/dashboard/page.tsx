import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SuperAdminDashboardClient from './client';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Fetch Stats Data Real-time
  const { count: hotelCount } = await supabase.from('hotels').select('*', { count: 'exact', head: true });
  const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  
  // Data dummy untuk simulasi (karena belum ada tabel revenue global)
  const stats = {
    totalHotels: hotelCount || 0,
    totalUsers: userCount || 0,
    activeSessions: 12, // Dummy
    systemHealth: '98%' // Dummy
  };

  return <SuperAdminDashboardClient stats={stats} />;
}