// src/app/fo/billing/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();
  // @ts-ignore
  return createServerActionClient({ cookies: () => cookieStore });
}

// --- UPDATE PAYMENT STATUS ---
export async function processPaymentAction(reservationId: string, amount: number, method: string) {
  const supabase = await getSupabase();

  // Update status reservasi menjadi 'paid'
  // (Di sistem nyata, ini akan mencatat transaksi ke tabel 'payments' dan update saldo)
  const { error } = await supabase
    .from('reservations')
    .update({ payment_status: 'paid' })
    .eq('id', reservationId);

  if (error) return { error: error.message };

  revalidatePath('/fo/billing');
  return { success: true, message: `Pembayaran ${method} Rp ${amount.toLocaleString('id-ID')} berhasil dicatat.` };
}

// --- ADD CHARGE (Placeholder) ---
export async function addChargeAction(reservationId: string, description: string, amount: number) {
  // Simulasi delay database
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Di masa depan: INSERT INTO folio_items ...
  console.log(`[Server Action] Adding charge to ${reservationId}: ${description} - ${amount}`);

  // Kita kembalikan sukses agar UI bisa update state lokal (mock)
  return { success: true };
}