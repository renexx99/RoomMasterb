'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { RoomStatus } from '@/core/types/database';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerActionClient({ 
    cookies: () => cookieStore as any 
  });
}

// PERBAIKAN: Menghapus field 'floor'
export interface RoomData {
  hotel_id: string;
  room_number: string;
  room_type_id: string;
  status: RoomStatus;
}

export async function createRoom(data: RoomData) {
  const supabase = await getSupabase();

  // Cek duplikasi nomor kamar di hotel yang sama
  const { data: existing } = await supabase
    .from('rooms')
    .select('id')
    .eq('hotel_id', data.hotel_id)
    .eq('room_number', data.room_number)
    .single();

  if (existing) {
    return { error: `Nomor kamar ${data.room_number} sudah ada.` };
  }

  const { error } = await supabase
    .from('rooms')
    .insert(data);

  if (error) return { error: error.message };

  revalidatePath('/admin/rooms');
  return { success: true };
}

export async function updateRoom(id: string, data: Partial<RoomData>) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('rooms')
    .update(data)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/rooms');
  return { success: true };
}

export async function deleteRoom(id: string) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', id);

  if (error) {
    if (error.code === '23503') { // Foreign Key Violation
      return { error: 'Tidak dapat menghapus kamar ini karena memiliki riwayat reservasi.' };
    }
    return { error: error.message };
  }

  revalidatePath('/admin/rooms');
  return { success: true };
}