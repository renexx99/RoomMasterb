'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();
  // @ts-ignore
  return createServerActionClient({ cookies: () => cookieStore });
}

export interface RoomTypePayload {
  hotel_id: string;
  name: string;
  description: string | null;
  price_per_night: number;
  capacity: number;
  size_sqm: number | null;
  bed_type: string | null;
  bed_count: number;
  view_type: string | null;
  smoking_allowed: boolean;
  amenities: string[] | null; // Supabase handle array conversions usually
}

export async function createRoomTypeAction(data: RoomTypePayload) {
  const supabase = await getSupabase();

  // Konversi amenities ke format yang sesuai jika perlu (tergantung setup DB, biasanya array string aman)
  // Jika kolom di DB text tapi isinya JSON, gunakan JSON.stringify(data.amenities)
  // Di sini kita asumsikan DB support array atau client library handle itu.
  // Namun, berdasarkan kode lama, ada JSON.stringify. Kita coba kirim raw dulu, 
  // atau sesuaikan dengan 'amenities' di payload.
  
  // NOTE: Jika DB Anda menyimpan amenities sebagai JSONB atau Text[], Supabase JS client
  // biasanya pintar menanganinya. Jika error, ganti ke JSON.stringify(data.amenities).
  
  const { error } = await supabase.from('room_types').insert(data);

  if (error) return { error: error.message };

  revalidatePath('/manager/room-types');
  return { success: true };
}

export async function updateRoomTypeAction(id: string, data: Partial<RoomTypePayload>) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('room_types')
    .update(data)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/manager/room-types');
  return { success: true };
}

export async function deleteRoomTypeAction(id: string) {
  const supabase = await getSupabase();

  // 1. Cek Ketergantungan (Apakah ada kamar yang menggunakan tipe ini?)
  const { count, error: checkError } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('room_type_id', id);

  if (checkError) return { error: checkError.message };

  if (count && count > 0) {
    return { error: `Tipe kamar ini tidak dapat dihapus karena sedang digunakan oleh ${count} kamar fisik.` };
  }

  // 2. Hapus
  const { error } = await supabase
    .from('room_types')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/manager/room-types');
  return { success: true };
}