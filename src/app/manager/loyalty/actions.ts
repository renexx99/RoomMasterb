// src/app/manager/loyalty/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { DEFAULT_LOYALTY_CONFIG, calculatePointsForStay, getTierForPoints, type LoyaltyConfigValues } from '@/core/utils/loyalty';

async function getSupabase() {
  const cookieStore = await cookies();
  // @ts-ignore
  return createServerActionClient({ cookies: () => cookieStore });
}

// --- GET LOYALTY CONFIG ---
export async function getLoyaltyConfig(hotelId: string): Promise<LoyaltyConfigValues> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('loyalty_config')
    .select('*')
    .eq('hotel_id', hotelId)
    .maybeSingle();

  if (error || !data) {
    return { ...DEFAULT_LOYALTY_CONFIG };
  }

  return {
    points_per_night: data.points_per_night,
    points_per_spend_unit: data.points_per_spend_unit,
    spend_unit_amount: data.spend_unit_amount,
    completion_bonus: data.completion_bonus,
    tier_bronze: data.tier_bronze,
    tier_silver: data.tier_silver,
    tier_gold: data.tier_gold,
    tier_platinum: data.tier_platinum,
    tier_diamond: data.tier_diamond,
  };
}

// --- SAVE LOYALTY CONFIG ---
export async function saveLoyaltyConfig(hotelId: string, config: LoyaltyConfigValues) {
  const supabase = await getSupabase();

  // Check if config exists
  const { data: existing } = await supabase
    .from('loyalty_config')
    .select('id')
    .eq('hotel_id', hotelId)
    .maybeSingle();

  let result;
  if (existing) {
    result = await supabase
      .from('loyalty_config')
      .update({ ...config, updated_at: new Date().toISOString() })
      .eq('hotel_id', hotelId);
  } else {
    result = await supabase
      .from('loyalty_config')
      .insert({ hotel_id: hotelId, ...config });
  }

  if (result.error) return { error: result.error.message };

  revalidatePath('/manager/loyalty');
  return { success: true };
}

// --- GET POINTS LOG ---
export async function getPointsLog(hotelId: string, limit: number = 50) {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('loyalty_points_log')
    .select(`
      *,
      guest:guests(id, full_name, loyalty_tier),
      creator:profiles(full_name)
    `)
    .eq('hotel_id', hotelId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
}

// --- MANUAL ADJUST GUEST POINTS ---
export async function adjustGuestPoints(
  guestId: string,
  hotelId: string,
  points: number,
  reason: string,
  userId: string
) {
  const supabase = await getSupabase();

  // 1. Insert log entry
  const { error: logError } = await supabase
    .from('loyalty_points_log')
    .insert({
      guest_id: guestId,
      hotel_id: hotelId,
      points,
      type: points >= 0 ? 'adjust' : 'adjust',
      source: 'manual',
      description: reason,
      created_by: userId,
    });

  if (logError) return { error: logError.message };

  // 2. Update guest's loyalty_points
  const { data: guest, error: fetchError } = await supabase
    .from('guests')
    .select('loyalty_points')
    .eq('id', guestId)
    .single();

  if (fetchError) return { error: fetchError.message };

  const newPoints = Math.max(0, (guest.loyalty_points || 0) + points);
  
  // 3. Get config to determine new tier
  const config = await getLoyaltyConfig(hotelId);
  const newTier = getTierForPoints(newPoints, config);

  const { error: updateError } = await supabase
    .from('guests')
    .update({ 
      loyalty_points: newPoints,
      loyalty_tier: newTier,
    })
    .eq('id', guestId);

  if (updateError) return { error: updateError.message };

  revalidatePath('/manager/loyalty');
  revalidatePath('/manager/guests');
  return { success: true, newPoints, newTier };
}

// --- AWARD STAY POINTS (called on reservation paid) ---
export async function awardStayPoints(
  guestId: string,
  hotelId: string,
  reservationId: string,
  nights: number,
  totalSpend: number,
  userId?: string
) {
  console.log('[LOYALTY] awardStayPoints called:', { guestId, hotelId, reservationId, nights, totalSpend });

  const supabase = await getSupabase();
  const config = await getLoyaltyConfig(hotelId);

  // Calculate points using static import
  const breakdown = calculatePointsForStay(nights, totalSpend, config);
  console.log('[LOYALTY] Points breakdown:', breakdown);

  // Insert log entries
  const logEntries = [];
  
  if (breakdown.nightsPoints > 0) {
    logEntries.push({
      guest_id: guestId,
      hotel_id: hotelId,
      points: breakdown.nightsPoints,
      type: 'earn',
      source: 'stay',
      description: `${nights} night(s) × ${config.points_per_night} pts`,
      reservation_id: reservationId,
    });
  }

  if (breakdown.spendPoints > 0) {
    logEntries.push({
      guest_id: guestId,
      hotel_id: hotelId,
      points: breakdown.spendPoints,
      type: 'earn',
      source: 'spend',
      description: `Spending Rp ${totalSpend.toLocaleString('id-ID')}`,
      reservation_id: reservationId,
    });
  }

  if (breakdown.bonusPoints > 0) {
    logEntries.push({
      guest_id: guestId,
      hotel_id: hotelId,
      points: breakdown.bonusPoints,
      type: 'earn',
      source: 'bonus',
      description: 'Stay completion bonus',
      reservation_id: reservationId,
    });
  }

  console.log('[LOYALTY] Inserting log entries:', logEntries.length);

  if (logEntries.length > 0) {
    const { error: logError } = await supabase
      .from('loyalty_points_log')
      .insert(logEntries);

    if (logError) {
      console.error('[LOYALTY] Failed to insert log:', logError);
      return { error: logError.message };
    }
    console.log('[LOYALTY] Log entries inserted successfully');
  }

  // Update guest points and tier
  const { data: guest, error: fetchGuestError } = await supabase
    .from('guests')
    .select('loyalty_points')
    .eq('id', guestId)
    .single();

  if (fetchGuestError) {
    console.error('[LOYALTY] Failed to fetch guest:', fetchGuestError);
    return { error: fetchGuestError.message };
  }

  const newPoints = (guest?.loyalty_points || 0) + breakdown.totalPoints;
  const newTier = getTierForPoints(newPoints, config);
  console.log('[LOYALTY] Updating guest:', { guestId, oldPoints: guest?.loyalty_points, newPoints, newTier });

  const { error: updateError } = await supabase
    .from('guests')
    .update({
      loyalty_points: newPoints,
      loyalty_tier: newTier,
    })
    .eq('id', guestId);

  if (updateError) {
    console.error('[LOYALTY] Failed to update guest:', updateError);
    return { error: updateError.message };
  }

  console.log('[LOYALTY] SUCCESS! Guest updated to', newPoints, 'pts, tier:', newTier);
  revalidatePath('/manager/loyalty');
  revalidatePath('/manager/guests');
  return { success: true, breakdown, newPoints, newTier };
}
