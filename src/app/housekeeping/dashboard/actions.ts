'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();
  // @ts-ignore
  return createServerActionClient({ cookies: () => cookieStore });
}

export async function updateRoomCleaningStatus(
  roomId: string,
  newCleaningStatus: 'clean' | 'dirty' | 'cleaning' | 'inspected'
) {
  const supabase = await getSupabase();
  
  // Gunakan RPC untuk bypass RLS dan handle auto-complete tasks
  const { data, error } = await supabase.rpc('update_room_cleaning_status', {
    p_room_id: roomId,
    p_new_status: newCleaningStatus
  });

  if (error) return { error: `Failed to update room status: ${error.message}` };
  if (!data) return { error: 'Room not found or unauthorized to update.' };

  revalidatePath('/housekeeping/dashboard');
  revalidatePath('/housekeeping/tasks');
  revalidatePath('/fo/availability');
  revalidatePath('/fo/dashboard');
  return { success: true };
}

export async function getRoomsByHotel(hotelId: string) {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('rooms')
    .select(`
      id,
      room_number,
      status,
      cleaning_status,
      floor_number,
      wing,
      special_notes,
      room_type:room_types(id, name)
    `)
    .eq('hotel_id', hotelId)
    .order('room_number', { ascending: true });

  if (error) return { error: error.message, rooms: [] };
  return { rooms: data || [] };
}

export async function getDashboardStats(hotelId: string) {
  const supabase = await getSupabase();
  const today = new Date().toISOString().split('T')[0];

  const [dirtyRes, cleaningRes, completedTasksRes, openReportsRes, totalRoomsRes] = await Promise.all([
    // Rooms needing cleaning (VD + OD)
    supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('cleaning_status', 'dirty'),

    // Rooms currently being cleaned
    supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('cleaning_status', 'cleaning'),

    // Tasks completed today
    supabase
      .from('housekeeping_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('status', 'completed')
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`),

    // Open maintenance reports
    supabase
      .from('maintenance_reports')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('status', 'open'),

    // Total rooms
    supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId),
  ]);

  return {
    dirtyRooms: dirtyRes.count || 0,
    cleaningRooms: cleaningRes.count || 0,
    completedToday: completedTasksRes.count || 0,
    openReports: openReportsRes.count || 0,
    totalRooms: totalRoomsRes.count || 0,
  };
}
