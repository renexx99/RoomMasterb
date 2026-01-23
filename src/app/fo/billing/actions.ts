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
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log(`[Server Action] Adding charge to ${reservationId}: ${description} - ${amount}`);
  return { success: true };
}

// --- GET BILLING STATS (Revenue & Occupancy) ---
export async function getBillingStats(hotelId: string, startDate: string, endDate: string) {
  const supabase = await getSupabase();

  // 1. Hitung Total Kamar (Inventory)
  const { count: totalRooms, error: roomError } = await supabase
    .from('rooms')
    .select('id', { count: 'exact', head: true })
    .eq('hotel_id', hotelId)
    .neq('status', 'maintenance'); // Exclude maintenance rooms from capacity

  if (roomError || totalRooms === null) return { revenue: 0, occupancy: 0 };

  // 2. Ambil Reservasi dalam periode tersebut
  // Logic: (check_in <= endDate) AND (check_out >= startDate)
  const { data: reservations, error: resError } = await supabase
    .from('reservations')
    .select('total_price, check_in_date, check_out_date, payment_status')
    .eq('hotel_id', hotelId)
    .neq('payment_status', 'cancelled')
    .lte('check_in_date', endDate)
    .gte('check_out_date', startDate);

  if (resError || !reservations) return { revenue: 0, occupancy: 0 };

  // 3. Kalkulasi Revenue
  // Hanya menghitung yang statusnya 'paid' untuk Revenue Real, 
  // atau bisa semua 'confirmed' tergantung kebijakan. Di sini kita pakai 'paid'.
  const totalRevenue = reservations
    .filter(r => r.payment_status === 'paid')
    .reduce((sum, r) => sum + Number(r.total_price), 0);

  // 4. Kalkulasi Occupancy Rate (Logic Overlap Tanggal)
  const start = new Date(startDate);
  const end = new Date(endDate);
  // Hitung durasi periode filter dalam hari
  const daysInPeriod = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;
  
  // Total Kapasitas = Jumlah Kamar x Jumlah Hari dalam Periode
  const totalCapacity = totalRooms * daysInPeriod;

  let totalOccupiedDays = 0;

  reservations.forEach(res => {
    const resCheckIn = new Date(res.check_in_date);
    const resCheckOut = new Date(res.check_out_date);

    // Cari irisan tanggal (Intersection)
    const overlapStart = resCheckIn < start ? start : resCheckIn;
    const overlapEnd = resCheckOut > end ? end : resCheckOut;

    // Hitung durasi overlap
    if (overlapStart < overlapEnd) {
      const diffTime = Math.abs(overlapEnd.getTime() - overlapStart.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      totalOccupiedDays += diffDays;
    }
  });

  const occupancyRate = totalCapacity > 0 ? (totalOccupiedDays / totalCapacity) * 100 : 0;

  return {
    revenue: totalRevenue,
    occupancy: parseFloat(occupancyRate.toFixed(2))
  };
}