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

// Helper untuk upload gambar ke Supabase Storage
async function uploadHotelImage(file: File, hotelName: string) {
  const supabase = await getSupabase();
  const fileExt = file.name.split('.').pop();
  const fileName = `${hotelName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Pastikan bucket 'hotel-images' sudah dibuat di Supabase Storage (Public)
  const { error: uploadError } = await supabase
    .storage
    .from('hotel-images')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Upload Error:', uploadError);
    throw new Error('Gagal mengupload gambar');
  }

  const { data: { publicUrl } } = supabase
    .storage
    .from('hotel-images')
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function createHotelAction(formData: FormData) {
  const supabase = await getSupabase();

  const name = formData.get('name') as string;
  const code = formData.get('code') as string;
  const address = formData.get('address') as string;
  const status = formData.get('status') as string;
  const imageFile = formData.get('image') as File | null;

  let image_url = '';

  if (imageFile && imageFile.size > 0) {
    try {
      image_url = await uploadHotelImage(imageFile, name);
    } catch (error) {
      return { error: 'Gagal mengupload gambar. Pastikan bucket storage sudah ada.' };
    }
  }

  const { error } = await supabase
    .from('hotels')
    .insert({
      name,
      code,
      address,
      status,
      image_url: image_url || null,
    });

  if (error) return { error: error.message };

  revalidatePath('/super-admin/hotels');
  return { success: true };
}

export async function updateHotelAction(formData: FormData) {
  const supabase = await getSupabase();
  
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const code = formData.get('code') as string;
  const address = formData.get('address') as string;
  const status = formData.get('status') as string;
  const imageFile = formData.get('image') as File | null;

  const updates: any = {
    name,
    code,
    address,
    status,
  };

  if (imageFile && imageFile.size > 0) {
    try {
      updates.image_url = await uploadHotelImage(imageFile, name);
    } catch (error) {
      return { error: 'Gagal mengupload gambar baru.' };
    }
  }

  const { error } = await supabase
    .from('hotels')
    .update(updates)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/super-admin/hotels');
  return { success: true };
}

export async function deleteHotel(id: string) {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from('hotels')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/super-admin/hotels');
  return { success: true };
}