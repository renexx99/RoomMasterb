// src/app/fo/check-in/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();
  // @ts-ignore
  return createServerActionClient({ cookies: () => cookieStore });
}

export async function checkInGuest(reservationId: string, roomId: string) {
  const supabase = await getSupabase();

  // 1. Update Reservasi: Set status jadi 'paid' (Asumsi MVP: Check-in = Lunas/Deposit OK)
  // Anda bisa menambahkan logika status 'checked_in' jika kolom status ada di tabel reservasi
  const { error: resError } = await supabase
    .from('reservations')
    .update({ payment_status: 'paid' }) 
    .eq('id', reservationId);

  if (resError) return { error: `Gagal update reservasi: ${resError.message}` };

  // 2. Update Kamar: Set status jadi 'occupied'
  const { error: roomError } = await supabase
    .from('rooms')
    .update({ status: 'occupied' })
    .eq('id', roomId);

  if (roomError) return { error: `Gagal update kamar: ${roomError.message}` };

  revalidatePath('/fo/check-in');
  revalidatePath('/fo/dashboard'); // Update dashboard juga agar sinkron
  revalidatePath('/fo/availability');
  return { success: true };
}

export async function checkOutGuest(reservationId: string, roomId: string) {
  const supabase = await getSupabase();

  // 1. Update Kamar: Set status jadi 'maintenance' (Perlu dibersihkan)
  // Housekeeping nanti akan mengubahnya jadi 'available' setelah bersih
  const { error: roomError } = await supabase
    .from('rooms')
    .update({ status: 'maintenance' })
    .eq('id', roomId);

  if (roomError) return { error: `Gagal update kamar: ${roomError.message}` };

  // 2. (Opsional) Update Reservasi jika ada kolom status check-out
  // ...

  revalidatePath('/fo/check-in');
  revalidatePath('/fo/dashboard');
  revalidatePath('/fo/availability');
  return { success: true };
}