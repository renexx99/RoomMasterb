// src/app/ta/book-room/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * B2B Contract Rate Discount (flat 20%).
 * In production this would come from a contract_rates table per TA.
 */
const B2B_DISCOUNT_RATE = 0.20;

export interface TaBookingPayload {
  hotelId: string;
  agentId: string;
  roomTypeId: string;
  roomId: string;
  checkIn: string;   // ISO date string (YYYY-MM-DD)
  checkOut: string;   // ISO date string (YYYY-MM-DD)
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  remarks?: string;
}

export async function createTaReservation(payload: TaBookingPayload) {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  // 1. Validate the agent session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || session.user.id !== payload.agentId) {
    return { error: 'Unauthorized: Invalid agent session.' };
  }

  // 2. Fetch base price for the selected room type
  const { data: roomType, error: rtError } = await supabase
    .from('room_types')
    .select('price_per_night')
    .eq('id', payload.roomTypeId)
    .single();

  if (rtError || !roomType) {
    return { error: 'Failed to fetch room type pricing. Please try again.' };
  }

  // 3. Calculate B2B Contract Rate
  const baseRate = Number(roomType.price_per_night);
  const taRate = baseRate * (1 - B2B_DISCOUNT_RATE); // 80% of rack rate

  // 4. Calculate number of nights
  const checkInDate = new Date(payload.checkIn);
  const checkOutDate = new Date(payload.checkOut);
  const nights = Math.max(
    1,
    Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const totalPrice = taRate * nights;

  // 5. Create guest record
  const fullName = `${payload.firstName.trim()} ${payload.lastName.trim()}`;

  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .insert({
      hotel_id: payload.hotelId,
      full_name: fullName,
      email: payload.email.trim(),
      phone_number: payload.phone?.trim() || null,
    })
    .select('id')
    .single();

  if (guestError) {
    return { error: guestError.message };
  }

  // 6. Insert reservation with City Ledger billing
  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .insert({
      hotel_id: payload.hotelId,
      guest_id: guest.id,
      room_id: payload.roomId,
      check_in_date: payload.checkIn,
      check_out_date: payload.checkOut,
      total_price: totalPrice,
      payment_status: 'city_ledger',
      payment_method: 'city_ledger',
      booking_source: 'travel_agent',
      agent_id: payload.agentId,
      special_requests: payload.remarks?.trim() || null,
    })
    .select('id')
    .single();

  if (resError) {
    return { error: resError.message };
  }

  return {
    success: true,
    data: {
      reservationId: reservation.id,
      guestName: fullName,
      nights,
      rackRate: baseRate,
      contractRate: taRate,
      totalPrice,
    },
  };
}
