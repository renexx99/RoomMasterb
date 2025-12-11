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

export async function createRoomAction(data: RoomPayload) {
  const supabase = await getSupabase();

  // Cek duplikasi nomor kamar dalam hotel yang sama
  const { data: existing } = await supabase
    .from('rooms')
    .select('id')
    .eq('hotel_id', data.hotel_id)
    .eq('room_number', data.room_number)
    .single();

  if (existing) {
    return { error: `Nomor kamar ${data.room_number} sudah ada.` };
  }

  const { error } = await supabase.from('rooms').insert(data);

  if (error) return { error: error.message };

  revalidatePath('/manager/rooms');
  return { success: true };
}

export async function updateRoomAction(id: string, data: Partial<RoomPayload>) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('rooms')
    .update(data)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/manager/rooms');
  return { success: true };
}

export async function deleteRoomAction(id: string) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', id);

  if (error) {
    // Handle Foreign Key constraint (biasanya code 23503)
    if (error.code === '23503') {
        return { error: 'Tidak dapat menghapus kamar karena memiliki riwayat reservasi.' };
    }
    return { error: error.message };
  }

  revalidatePath('/manager/rooms');
  return { success: true };
}