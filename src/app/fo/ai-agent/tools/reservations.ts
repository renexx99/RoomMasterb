import { getSupabase } from '../utils';
import { ToolExecutionResult } from '../types';

/**
 * Tool: search_reservations
 * Mencari reservasi berdasarkan nama tamu, tanggal, atau status.
 */
export async function searchReservationsTool(args: any): Promise<ToolExecutionResult> {
  const supabase = await getSupabase();
  const { guest_name, date, status_filter, upcoming_only } = args;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { type: 'error', message: 'User tidak login.' };
  const { data: roleData } = await supabase.from('user_roles').select('hotel_id').eq('user_id', session.user.id).maybeSingle();
  const hotelId = roleData?.hotel_id;
  if (!hotelId) return { type: 'error', message: 'User tidak terhubung dengan hotel.' };

  const today = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('reservations')
    .select(`
      id, check_in_date, check_out_date, total_price, payment_status,
      payment_method, checked_in_at, checked_out_at, special_requests, created_at,
      guest:guests(id, full_name, email, phone_number),
      room:rooms(id, room_number, room_type:room_types(name, price_per_night))
    `)
    .eq('hotel_id', hotelId);

  // Apply filters
  if (guest_name) {
    // First find guest IDs matching the name
    const { data: guests } = await supabase
      .from('guests')
      .select('id')
      .eq('hotel_id', hotelId)
      .ilike('full_name', `%${guest_name}%`);

    if (!guests || guests.length === 0) {
      return { type: 'info', message: `Tidak ditemukan tamu dengan nama "${guest_name}".` };
    }
    query = query.in('guest_id', guests.map((g: any) => g.id));
  }

  if (status_filter) {
    query = query.eq('payment_status', status_filter);
  } else {
    query = query.neq('payment_status', 'cancelled');
  }

  if (date) {
    // Show reservations that overlap with the given date
    query = query.lte('check_in_date', date).gte('check_out_date', date);
  } else if (upcoming_only) {
    query = query.gte('check_in_date', today);
  }

  const { data: reservations, error } = await query
    .order('check_in_date', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error search_reservations:', error);
    return { type: 'error', message: 'Terjadi kesalahan saat mencari reservasi.' };
  }

  if (!reservations || reservations.length === 0) {
    let filterDesc = '';
    if (guest_name) filterDesc += ` nama "${guest_name}"`;
    if (date) filterDesc += ` tanggal ${date}`;
    if (status_filter) filterDesc += ` status ${status_filter}`;
    return { type: 'info', message: `Tidak ditemukan reservasi${filterDesc || ''}.` };
  }

  const results = reservations.map((r: any) => {
    const guest = Array.isArray(r.guest) ? r.guest[0] : r.guest;
    const room = Array.isArray(r.room) ? r.room[0] : r.room;
    const roomType = room?.room_type ? (Array.isArray(room.room_type) ? room.room_type[0] : room.room_type) : null;

    let statusLabel = r.payment_status;
    if (r.checked_out_at) statusLabel = 'checked_out';
    else if (r.checked_in_at) statusLabel = 'checked_in';

    return {
      folio: r.id.substring(0, 8).toUpperCase(),
      reservation_id: r.id,
      guest_name: guest?.full_name || '-',
      guest_email: guest?.email || '-',
      guest_phone: guest?.phone_number || '-',
      room_number: room?.room_number || '-',
      room_type: roomType?.name || '-',
      check_in: r.check_in_date,
      check_out: r.check_out_date,
      total_price: r.total_price,
      payment_status: r.payment_status,
      payment_method: r.payment_method || '-',
      status_detail: statusLabel,
      checked_in_at: r.checked_in_at || null,
      checked_out_at: r.checked_out_at || null,
      special_requests: r.special_requests || null,
    };
  });

  return {
    success: true,
    type: 'reservation_list',
    message: `Ditemukan ${results.length} reservasi.`,
    data: {
      reservations: results,
      total_found: results.length,
      filters_applied: { guest_name, date, status_filter, upcoming_only },
    }
  };
}
