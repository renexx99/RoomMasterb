'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { Hotel } from '@/core/types/database';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerActionClient({ 
    cookies: () => cookieStore as any 
  });
}

export interface HotelFormData {
  name: string;
  code: string;
  address: string;
  status: 'active' | 'maintenance' | 'suspended';
  image_url?: string;
}

export async function createHotel(data: HotelFormData) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('hotels')
    .insert(data);

  if (error) return { error: error.message };

  revalidatePath('/super-admin/hotels');
  return { success: true };
}

export async function updateHotel(id: string, data: Partial<HotelFormData>) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('hotels')
    .update(data)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/super-admin/hotels');
  return { success: true };
}

export async function deleteHotel(id: string) {
  const supabase = await getSupabase();

  // Note: Supabase biasanya akan memblokir delete jika ada foreign key (rooms/users)
  // KECUALI diset ON DELETE CASCADE di database.
  const { error } = await supabase
    .from('hotels')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/super-admin/hotels');
  return { success: true };
}