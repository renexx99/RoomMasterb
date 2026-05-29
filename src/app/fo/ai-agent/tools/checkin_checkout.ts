import { getSupabase } from '../utils';
import { ToolExecutionResult } from '../types';

export async function checkinGuestTool(args: any): Promise<ToolExecutionResult> {
  const supabase = await getSupabase();
  const { guest_identifier, reservation_id } = args;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { type: 'error', message: 'User tidak login.' };
  const { data: roleData } = await supabase.from('user_roles').select('hotel_id').eq('user_id', session.user.id).maybeSingle();
  const hotelId = roleData?.hotel_id;
  if (!hotelId) return { type: 'error', message: 'User tidak terhubung dengan hotel.' };

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();
  let reservation: any = null;

  if (reservation_id) {
    const { data } = await supabase.from('reservations')
      .select('*, guest:guests(id, full_name, email), room:rooms(id, room_number, status, room_type:room_types(name))')
      .eq('hotel_id', hotelId).or(`id.eq.${reservation_id},id.ilike.${reservation_id}%`)
      .is('checked_in_at', null).neq('payment_status', 'cancelled').limit(1).maybeSingle();
    reservation = data;
  }

  if (!reservation && guest_identifier) {
    const { data: guests } = await supabase.from('guests').select('id').eq('hotel_id', hotelId).ilike('full_name', `%${guest_identifier}%`);
    if (guests && guests.length > 0) {
      const guestIds = guests.map((g: any) => g.id);
      const { data } = await supabase.from('reservations')
        .select('*, guest:guests(id, full_name, email), room:rooms(id, room_number, status, room_type:room_types(name))')
        .eq('hotel_id', hotelId).in('guest_id', guestIds).lte('check_in_date', today).gte('check_out_date', today)
        .is('checked_in_at', null).neq('payment_status', 'cancelled').order('check_in_date', { ascending: true }).limit(1).maybeSingle();
      reservation = data;
    }
  }

  if (!reservation) {
    return { type: 'info', message: `Tidak ditemukan reservasi aktif untuk "${reservation_id || guest_identifier}" yang siap check-in hari ini (${today}).` };
  }

  const room = Array.isArray(reservation.room) ? reservation.room[0] : reservation.room;
  const guest = Array.isArray(reservation.guest) ? reservation.guest[0] : reservation.guest;
  const roomType = room?.room_type ? (Array.isArray(room.room_type) ? room.room_type[0] : room.room_type) : null;

  if (room?.status === 'occupied') return { type: 'error', message: `Kamar ${room.room_number} masih ditempati. Tidak bisa check-in.` };
  if (room?.status === 'maintenance') return { type: 'error', message: `Kamar ${room.room_number} sedang maintenance.` };

  const { error: resError } = await supabase.from('reservations').update({ checked_in_at: now }).eq('id', reservation.id);
  if (resError) return { type: 'error', message: `Gagal check-in: ${resError.message}` };

  await supabase.from('rooms').update({ status: 'occupied', updated_at: now }).eq('id', room.id);

  return {
    success: true, type: 'checkin_success',
    message: `✅ Check-in berhasil! ${guest?.full_name || 'Tamu'} masuk kamar ${room.room_number} (${roomType?.name || '-'}).`,
    data: { reservation_id: reservation.id, folio: reservation.id.substring(0, 8).toUpperCase(), guest_name: guest?.full_name, room_number: room.room_number, room_type: roomType?.name, check_in_date: reservation.check_in_date, check_out_date: reservation.check_out_date, checked_in_at: now, payment_status: reservation.payment_status }
  };
}

export async function checkoutGuestTool(args: any): Promise<ToolExecutionResult> {
  const supabase = await getSupabase();
  const { room_number, guest_identifier } = args;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { type: 'error', message: 'User tidak login.' };
  const { data: roleData } = await supabase.from('user_roles').select('hotel_id').eq('user_id', session.user.id).maybeSingle();
  const hotelId = roleData?.hotel_id;
  if (!hotelId) return { type: 'error', message: 'User tidak terhubung dengan hotel.' };
  const now = new Date().toISOString();
  let reservation: any = null;

  if (room_number) {
    const { data: room } = await supabase.from('rooms').select('id').eq('hotel_id', hotelId).ilike('room_number', `%${room_number}%`).eq('status', 'occupied').limit(1).maybeSingle();
    if (room) {
      const { data } = await supabase.from('reservations')
        .select('*, guest:guests(id, full_name, email), room:rooms(id, room_number, room_type:room_types(name))')
        .eq('hotel_id', hotelId).eq('room_id', room.id).not('checked_in_at', 'is', null).is('checked_out_at', null)
        .neq('payment_status', 'cancelled').order('checked_in_at', { ascending: false }).limit(1).maybeSingle();
      reservation = data;
    }
  }

  if (!reservation && guest_identifier) {
    const { data: guests } = await supabase.from('guests').select('id').eq('hotel_id', hotelId).ilike('full_name', `%${guest_identifier}%`);
    if (guests && guests.length > 0) {
      const { data } = await supabase.from('reservations')
        .select('*, guest:guests(id, full_name, email), room:rooms(id, room_number, room_type:room_types(name))')
        .eq('hotel_id', hotelId).in('guest_id', guests.map((g: any) => g.id))
        .not('checked_in_at', 'is', null).is('checked_out_at', null).neq('payment_status', 'cancelled')
        .order('checked_in_at', { ascending: false }).limit(1).maybeSingle();
      reservation = data;
    }
  }

  if (!reservation) return { type: 'info', message: `Tidak ditemukan tamu aktif untuk "${room_number || guest_identifier}".` };

  const room = Array.isArray(reservation.room) ? reservation.room[0] : reservation.room;
  const guest = Array.isArray(reservation.guest) ? reservation.guest[0] : reservation.guest;
  const roomType = room?.room_type ? (Array.isArray(room.room_type) ? room.room_type[0] : room.room_type) : null;

  if (reservation.payment_status === 'pending') {
    return { type: 'confirmation', message: `⚠️ Tagihan ${guest?.full_name} BELUM LUNAS (Rp ${(reservation.total_price || 0).toLocaleString('id-ID')}). Jawab "Ya checkout" untuk lanjut.`,
      data: { reservation_id: reservation.id, guest_name: guest?.full_name, room_number: room?.room_number, total_price: reservation.total_price, payment_status: 'pending', pending_action: 'force_checkout' } };
  }

  // Execute checkout
  await supabase.from('rooms').update({ status: 'available', cleaning_status: 'dirty', updated_at: now }).eq('id', room.id);
  const { error: resError } = await supabase.from('reservations').update({ checked_out_at: now }).eq('id', reservation.id);
  if (resError) return { type: 'error', message: `Gagal checkout: ${resError.message}` };

  try {
    await supabase.from('housekeeping_tasks').insert({ hotel_id: hotelId, room_id: room.id, task_type: 'cleaning', priority: 'normal', status: 'pending', notes: `Auto: checkout ${guest?.full_name} dari kamar ${room.room_number}` });
  } catch (e) { console.error('Housekeeping task error:', e); }

  return {
    success: true, type: 'checkout_success',
    message: `✅ Checkout berhasil! ${guest?.full_name || 'Tamu'} keluar dari kamar ${room.room_number}. Housekeeping task dibuat.`,
    data: { reservation_id: reservation.id, folio: reservation.id.substring(0, 8).toUpperCase(), guest_name: guest?.full_name, room_number: room.room_number, room_type: roomType?.name, checked_out_at: now, payment_status: reservation.payment_status, total_price: reservation.total_price }
  };
}

export async function forceCheckoutTool(args: any): Promise<ToolExecutionResult> {
  const supabase = await getSupabase();
  const { reservation_id } = args;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { type: 'error', message: 'User tidak login.' };
  const { data: roleData } = await supabase.from('user_roles').select('hotel_id').eq('user_id', session.user.id).maybeSingle();
  const hotelId = roleData?.hotel_id;
  if (!hotelId) return { type: 'error', message: 'User tidak terhubung dengan hotel.' };
  const now = new Date().toISOString();

  const { data: reservation } = await supabase.from('reservations')
    .select('*, guest:guests(id, full_name), room:rooms(id, room_number, room_type:room_types(name))')
    .eq('id', reservation_id).eq('hotel_id', hotelId).maybeSingle();
  if (!reservation) return { type: 'error', message: 'Reservasi tidak ditemukan.' };

  const room = Array.isArray(reservation.room) ? reservation.room[0] : reservation.room;
  const guest = Array.isArray(reservation.guest) ? reservation.guest[0] : reservation.guest;
  const roomType = room?.room_type ? (Array.isArray(room.room_type) ? room.room_type[0] : room.room_type) : null;

  await supabase.from('rooms').update({ status: 'available', cleaning_status: 'dirty', updated_at: now }).eq('id', room.id);
  await supabase.from('reservations').update({ checked_out_at: now }).eq('id', reservation.id);
  try { await supabase.from('housekeeping_tasks').insert({ hotel_id: hotelId, room_id: room.id, task_type: 'cleaning', priority: 'normal', status: 'pending', notes: `Force checkout: ${guest?.full_name}` }); } catch (e) {}

  return {
    success: true, type: 'checkout_success',
    message: `✅ Force checkout berhasil! ${guest?.full_name || 'Tamu'} keluar dari kamar ${room.room_number}. Tagihan masih pending.`,
    data: { reservation_id: reservation.id, folio: reservation.id.substring(0, 8).toUpperCase(), guest_name: guest?.full_name, room_number: room.room_number, room_type: roomType?.name, checked_out_at: now, payment_status: reservation.payment_status, total_price: reservation.total_price }
  };
}
