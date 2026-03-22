'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { RoomStatus, WingType, FurnitureCondition } from '@/core/types/database';

async function getSupabase() {
  const cookieStore = await cookies();
  // @ts-ignore
  return createServerActionClient({ cookies: () => cookieStore });
}

export interface RoomPayload {
  hotel_id: string;
  room_number: string;
  room_type_id: string;
  status: RoomStatus;
  floor_number: number;
  wing: WingType | null;
  furniture_condition: FurnitureCondition;
  last_renovation_date: string | null;
  special_notes: string | null;
}

// --- CRUD Actions ---

export async function createRoomAction(data: RoomPayload) {
  const supabase = await getSupabase();

  // Check duplicate
  const { data: existing } = await supabase
    .from('rooms')
    .select('id')
    .eq('hotel_id', data.hotel_id)
    .eq('room_number', data.room_number)
    .single();

  if (existing) {
    return { error: `Room number ${data.room_number} already exists.` };
  }

  const { error } = await supabase.from('rooms').insert(data);
  if (error) return { error: error.message };

  revalidatePath('/manager/rooms');
  return { success: true };
}

export async function updateRoomAction(id: string, data: Partial<RoomPayload>) {
  const supabase = await getSupabase();
  const { error } = await supabase.from('rooms').update(data).eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/manager/rooms');
  return { success: true };
}

export async function deleteRoomAction(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from('rooms').delete().eq('id', id);

  if (error) {
    if (error.code === '23503') {
      return { error: 'Cannot delete room with existing history/reservations.' };
    }
    return { error: error.message };
  }

  revalidatePath('/manager/rooms');
  return { success: true };
}

// --- NEW: Get Room History for Detail Panel ---
export async function getRoomHistory(roomId: string) {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id,
      check_in_date,
      check_out_date,
      total_price,
      payment_status,
      guest:guests(full_name)
    `)
    .eq('room_id', roomId)
    .order('check_in_date', { ascending: false })
    .limit(10); // Last 10 reservations

  if (error) return [];
  return data;
}