'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();
  // @ts-ignore
  return createServerActionClient({ cookies: () => cookieStore });
}

export async function getMyTasks(userId: string, hotelId: string) {
  const supabase = await getSupabase();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('housekeeping_tasks')
    .select(`
      *,
      room:rooms(id, room_number, status, cleaning_status, floor_number, room_type:room_types(id, name))
    `)
    .eq('hotel_id', hotelId)
    .or(`assigned_to.eq.${userId},assigned_to.is.null`)
    .in('status', ['pending', 'in_progress'])
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) return { error: error.message, tasks: [] };
  return { tasks: data || [] };
}

export async function getCompletedTasks(userId: string, hotelId: string) {
  const supabase = await getSupabase();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('housekeeping_tasks')
    .select(`
      *,
      room:rooms(id, room_number, status, cleaning_status, floor_number, room_type:room_types(id, name))
    `)
    .eq('hotel_id', hotelId)
    .eq('status', 'completed')
    .gte('completed_at', `${today}T00:00:00`)
    .order('completed_at', { ascending: false })
    .limit(20);

  if (error) return { error: error.message, tasks: [] };
  return { tasks: data || [] };
}

export async function startTask(taskId: string) {
  const supabase = await getSupabase();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('housekeeping_tasks')
    .update({
      status: 'in_progress',
      assigned_to: session.user.id,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (error) return { error: error.message };

  // Also update room cleaning_status to 'cleaning'
  const { data: task } = await supabase
    .from('housekeeping_tasks')
    .select('room_id')
    .eq('id', taskId)
    .single();

  if (task?.room_id) {
    await supabase
      .from('rooms')
      .update({ cleaning_status: 'cleaning', updated_at: new Date().toISOString() })
      .eq('id', task.room_id);
  }

  revalidatePath('/housekeeping/tasks');
  revalidatePath('/housekeeping/dashboard');
  revalidatePath('/fo/availability');
  return { success: true };
}

export async function completeTask(taskId: string, roomId: string) {
  const supabase = await getSupabase();

  // 1. Update task status
  const { error: taskError } = await supabase
    .from('housekeeping_tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (taskError) return { error: `Failed to complete task: ${taskError.message}` };

  // 2. Update room to clean
  const { error: roomError } = await supabase
    .from('rooms')
    .update({
      cleaning_status: 'clean',
      updated_at: new Date().toISOString(),
    })
    .eq('id', roomId);

  if (roomError) return { error: `Failed to update room: ${roomError.message}` };

  revalidatePath('/housekeeping/tasks');
  revalidatePath('/housekeeping/dashboard');
  revalidatePath('/fo/availability');
  revalidatePath('/fo/dashboard');
  return { success: true };
}

export async function skipTask(taskId: string, reason: string) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('housekeeping_tasks')
    .update({
      status: 'skipped',
      notes: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (error) return { error: error.message };

  revalidatePath('/housekeeping/tasks');
  revalidatePath('/housekeeping/dashboard');
  return { success: true };
}
