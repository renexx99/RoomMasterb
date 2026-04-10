// src/app/housekeeping/tasks/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TasksClient from './client';

export default async function HousekeepingTasksPage() {
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

  // Fetch active tasks and completed tasks
  const [activeTasks, completedTasks] = await Promise.all([
    supabase
      .from('housekeeping_tasks')
      .select(`
        *,
        room:rooms(id, room_number, status, cleaning_status, floor_number, room_type:room_types(id, name))
      `)
      .eq('hotel_id', hotelId)
      .or(`assigned_to.eq.${session.user.id},assigned_to.is.null`)
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true }),

    supabase
      .from('housekeeping_tasks')
      .select(`
        *,
        room:rooms(id, room_number, status, cleaning_status, floor_number, room_type:room_types(id, name))
      `)
      .eq('hotel_id', hotelId)
      .eq('status', 'completed')
      .gte('completed_at', `${today}T00:00:00`)
      .order('completed_at', { ascending: false })
      .limit(20),
  ]);

  return (
    <TasksClient
      activeTasks={activeTasks.data || []}
      completedTasks={completedTasks.data || []}
    />
  );
}
