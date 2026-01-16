import { getSupabase } from '../utils';

export async function guestProfilerTool(args: any) {
  const supabase = await getSupabase();
  const { guest_identifier } = args;

  const { data: { session } } = await supabase.auth.getSession();
  const { data: roleData } = await supabase.from('user_roles').select('hotel_id').eq('user_id', session?.user.id).maybeSingle();
  const hotelId = roleData?.hotel_id;

  const { data: guests } = await supabase
    .from('guests')
    .select('*')
    .eq('hotel_id', hotelId)
    .or(`full_name.ilike.%${guest_identifier}%,email.ilike.%${guest_identifier}%`)
    .limit(1);

  if (!guests || guests.length === 0) {
    return { 
      type: 'info',
      message: `Tamu dengan identitas "${guest_identifier}" belum ditemukan di database.` 
    };
  }

  const g = guests[0];

  const { data: history } = await supabase
    .from('reservations')
    .select(`
      id,
      total_price, 
      check_in_date,
      check_out_date,
      payment_status,
      rooms (
        room_number, 
        room_types (name)
      )
    `)
    .eq('guest_id', g.id)
    .eq('hotel_id', hotelId)
    .neq('payment_status', 'cancelled')
    .order('check_in_date', { ascending: false })
    .limit(5);

  const calculatedStays = history?.length || 0;
  const calculatedSpend = history?.reduce((acc: number, curr: any) => acc + (curr.total_price || 0), 0) || 0;

  const bookingHistory = history?.map((h: any) => {
    const roomData = Array.isArray(h.rooms) ? h.rooms[0] : h.rooms;
    const typeData = roomData?.room_types ? (Array.isArray(roomData.room_types) ? roomData.room_types[0] : roomData.room_types) : null;
    
    return {
      folio: h.id.substring(0, 8).toUpperCase(),
      check_in: h.check_in_date,
      check_out: h.check_out_date,
      room_type: typeData?.name || 'Unknown',
      room_number: roomData?.room_number || '?',
      amount: h.total_price,
      status: h.payment_status
    };
  }) || [];

  let preferencesDisplay = "Tidak ada";
  if (g.preferences && typeof g.preferences === 'object' && Object.keys(g.preferences).length > 0) {
    preferencesDisplay = Object.entries(g.preferences)
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ');
  }

  return {
    success: true,
    type: 'guest_profile',
    data: {
      guest: {
        name: `${g.title || ''} ${g.full_name}`.trim(),
        email: g.email,
        phone: g.phone_number || 'Tidak ada',
        tier: g.loyalty_tier || 'bronze',
        preferences: preferencesDisplay
      },
      statistics: {
        total_stays: calculatedStays,
        total_spent: calculatedSpend,
        last_visit: bookingHistory[0]?.check_in || 'Belum pernah menginap'
      },
      booking_history: bookingHistory
    }
  };
}