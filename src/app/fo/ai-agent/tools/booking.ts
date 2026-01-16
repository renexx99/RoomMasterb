import { getSupabase, calculateNights, findAvailableRoomInternal } from '../utils';

export async function confirmBookingDetailsTool(args: any) {
    const supabase = await getSupabase();
    const { guest_name, user_email, phone_number, room_type_name, check_in, check_out } = args;

    console.log("🤖 AI Konfirmasi Booking:", args);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: "User tidak login." };

    const { data: roleData } = await supabase.from('user_roles').select('hotel_id').eq('user_id', session.user.id).maybeSingle();
    const hotelId = roleData?.hotel_id;

    const room = await findAvailableRoomInternal(supabase, hotelId, check_in, check_out, room_type_name);

    if (!room) {
        return { 
            type: 'error',
            message: `Tidak ada kamar tipe '${room_type_name}' yang tersedia pada tanggal ${check_in} hingga ${check_out}.`
        };
    }

    const nights = calculateNights(check_in, check_out);
    const totalPrice = nights * room.room_type.price_per_night;

    return {
        success: true,
        type: 'confirmation',
        data: {
            guest_name,
            email: user_email && user_email !== '-' ? user_email : 'Tidak ada',
            phone: phone_number && phone_number !== '-' ? phone_number : 'Tidak ada',
            room_type: room.room_type.name,
            room_number: room.room_number,
            check_in,
            check_out,
            nights,
            price_per_night: room.room_type.price_per_night,
            total_price: totalPrice,
            cleaning_status: room.cleaning_status
        }
    };
}

export async function createReservationTool(args: any) {
  const supabase = await getSupabase();
  const { guest_name, user_email, phone_number, room_type_name, check_in, check_out, payment_method } = args;

  console.log("🤖 AI Eksekusi Booking:", args);

  const { data: { session } } = await supabase.auth.getSession();
  const { data: roleData } = await supabase.from('user_roles').select('hotel_id').eq('user_id', session?.user.id).maybeSingle();
  const hotelId = roleData?.hotel_id;

  const selectedRoom = await findAvailableRoomInternal(supabase, hotelId, check_in, check_out, room_type_name);
  if (!selectedRoom) return { 
    type: 'error',
    message: `Kamar tipe ${room_type_name} baru saja diambil tamu lain.` 
  };

  const nights = calculateNights(check_in, check_out);
  const totalPrice = nights * (selectedRoom as any).room_type.price_per_night;

  let guestId = '';
  let queryGuest = supabase.from('guests').select('id').eq('hotel_id', hotelId);
  
  if (user_email && user_email !== '-' && user_email.includes('@')) {
      queryGuest = queryGuest.eq('email', user_email);
  } else {
      queryGuest = queryGuest.ilike('full_name', guest_name);
      if (phone_number && phone_number !== '-') {
          queryGuest = queryGuest.eq('phone_number', phone_number);
      }
  }

  const { data: existingGuest } = await queryGuest.limit(1).maybeSingle();

  if (existingGuest) {
    guestId = existingGuest.id;
  } else {
    const { data: newGuest, error: guestError } = await supabase
      .from('guests')
      .insert({
        hotel_id: hotelId,
        full_name: guest_name,
        email: (user_email && user_email.includes('@')) ? user_email : `guest-${Date.now()}@temp.com`,
        phone_number: (phone_number && phone_number.length > 5) ? phone_number : null,
        title: 'Mr.',
        loyalty_tier: 'bronze'
      })
      .select('id')
      .single();
    
    if (guestError) return { type: 'error', message: "Gagal membuat profil tamu: " + guestError.message };
    guestId = newGuest.id;
  }

  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .insert({
      hotel_id: hotelId,
      room_id: selectedRoom.id,
      guest_id: guestId,
      check_in_date: check_in,
      check_out_date: check_out,
      payment_status: 'pending', 
      payment_method: payment_method || 'cash', 
      total_price: totalPrice
    })
    .select()
    .single();

  if (resError) return { type: 'error', message: "Gagal menyimpan reservasi: " + resError.message };

  return { 
    success: true,
    type: 'reservation_success',
    data: {
      reservation_id: reservation.id,
      folio_number: reservation.id.substring(0, 8).toUpperCase(),
      guest_name,
      room_number: selectedRoom.room_number,
      room_type: selectedRoom.room_type.name,
      check_in,
      check_out,
      nights,
      total_price: totalPrice,
      payment_status: 'pending',
      cleaning_status: selectedRoom.cleaning_status
    }
  };
}