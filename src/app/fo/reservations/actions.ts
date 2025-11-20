'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { PaymentStatus } from '@/core/types/database';

// 1. Create / Update Reservation
export async function upsertReservation(
  prevState: any,
  formData: FormData
) {
  const cookieStore = await cookies();
  // @ts-ignore - workaround tipe
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const id = formData.get('id') as string;
  const hotel_id = formData.get('hotel_id') as string;
  const guest_id = formData.get('guest_id') as string;
  const room_id = formData.get('room_id') as string;
  const check_in_date = formData.get('check_in_date') as string;
  const check_out_date = formData.get('check_out_date') as string;
  const total_price = parseFloat(formData.get('total_price') as string) || 0;
  const payment_status = formData.get('payment_status') as PaymentStatus;
  
  // HAPUS: const status = formData.get('status') ...

  const payload = {
    hotel_id,
    guest_id,
    room_id,
    check_in_date,
    check_out_date,
    total_price,
    // status, // HAPUS INI
    payment_status,
  };

  const { error } = id
    ? await supabase.from('reservations').update(payload).eq('id', id)
    : await supabase.from('reservations').insert(payload);

  if (error) {
    console.error('Upsert Error:', error);
    return { error: error.message };
  }

  revalidatePath('/fo/reservations');
  return { success: true };
}

// 2. Delete Reservation
export async function deleteReservation(id: string) {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/fo/reservations');
  return { success: true };
}