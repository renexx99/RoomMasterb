'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerActionClient({ 
    cookies: () => cookieStore as any 
  });
}

export interface RoomTypeData {
  hotel_id: string;
  name: string;
  description?: string;
  price_per_night: number;
  capacity: number;
}

export async function createRoomType(data: RoomTypeData) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('room_types')
    .insert(data);

  if (error) return { error: error.message };

  revalidatePath('/admin/room-types');
  return { success: true };
}

export async function updateRoomType(id: string, data: Partial<RoomTypeData>) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('room_types')
    .update(data)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/room-types');
  return { success: true };
}

export async function deleteRoomType(id: string) {
  const supabase = await getSupabase();

  // 1. Cek apakah tipe kamar ini digunakan oleh Kamar (Rooms)
  const { count, error: checkError } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('room_type_id', id);

  if (checkError) return { error: checkError.message };

  if (count && count > 0) {
    return { error: `Tidak dapat menghapus. Tipe ini digunakan oleh ${count} kamar fisik.` };
  }

  // 2. Hapus jika aman
  const { error } = await supabase
    .from('room_types')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/room-types');
  return { success: true };
}