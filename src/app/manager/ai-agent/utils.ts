import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// --- Supabase Helper ---
export async function getSupabase() {
  const cookieStore = await cookies();
  // @ts-ignore
  return createServerActionClient({ cookies: () => cookieStore });
}

// --- Date Helper ---
export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays > 0 ? diffDays : 1;
}

// --- Room Search Logic ---
export async function findAvailableRoomInternal(supabase: any, hotelId: string, checkIn: string, checkOut: string, roomTypeName?: string) {
  const { data: occupied } = await supabase
    .from('reservations')
    .select('room_id')
    .eq('hotel_id', hotelId)
    .neq('payment_status', 'cancelled')
    .lt('check_in_date', checkOut)
    .gt('check_out_date', checkIn);

  const occupiedIds = occupied?.map((o: any) => o.room_id) || [];

  let query = supabase
    .from('rooms')
    .select(`
      id, 
      room_number, 
      status, 
      cleaning_status,
      room_type:room_types!inner(name, price_per_night, capacity)
    `)
    .eq('hotel_id', hotelId)
    .eq('status', 'available');

  if (occupiedIds.length > 0) {
    query = query.not('id', 'in', `(${occupiedIds.join(',')})`);
  }

  if (roomTypeName) {
    query = query.ilike('room_type.name', `%${roomTypeName}%`);
  }

  const { data: rooms, error } = await query.limit(5);
  
  if (error || !rooms || rooms.length === 0) return null;

  const cleanRoom = rooms.find((r: any) => r.cleaning_status === 'clean');
  return cleanRoom || rooms[0];
}