import { getSupabase } from '../utils';
import { ToolExecutionResult } from '../types';

/**
 * Tool: room_status_summary
 * Mengambil ringkasan status seluruh kamar saat ini (real-time snapshot).
 * Bisa difilter per tipe kamar. TIDAK memerlukan tanggal.
 * 
 * Contoh penggunaan:
 * - "Status kamar deluxe?" → room_type_name: "deluxe"
 * - "Ada kamar kosong?"   → tanpa filter
 * - "Berapa kamar yang terisi?" → tanpa filter
 */
export async function roomStatusSummaryTool(args: any): Promise<ToolExecutionResult> {
  const supabase = await getSupabase();
  const { room_type_name } = args;

  // 1. Get hotel ID from session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { type: 'error', message: 'User tidak login.' };

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('hotel_id')
    .eq('user_id', session.user.id)
    .maybeSingle();
  const hotelId = roleData?.hotel_id;
  if (!hotelId) return { type: 'error', message: 'User tidak terhubung dengan hotel.' };

  // 2. Query rooms with room type info
  let query = supabase
    .from('rooms')
    .select(`
      id,
      room_number,
      status,
      cleaning_status,
      floor_number,
      wing,
      room_type:room_types!inner(name, price_per_night, capacity)
    `)
    .eq('hotel_id', hotelId);

  if (room_type_name) {
    query = query.ilike('room_type.name', `%${room_type_name}%`);
  }

  const { data: rooms, error } = await query.order('room_number', { ascending: true });

  if (error) {
    console.error('❌ Error room_status_summary:', error);
    return { type: 'error', message: 'Terjadi kesalahan saat mengambil data kamar.' };
  }

  if (!rooms || rooms.length === 0) {
    const filterMsg = room_type_name ? ` dengan tipe "${room_type_name}"` : '';
    return { 
      type: 'info', 
      message: `Tidak ditemukan kamar${filterMsg} di hotel ini. Pastikan nama tipe kamar sesuai (misalnya: Standard, Deluxe, Suite).` 
    };
  }

  // 3. Check which rooms are currently occupied via active reservations
  const today = new Date().toISOString().split('T')[0];
  const { data: activeReservations } = await supabase
    .from('reservations')
    .select('room_id, guest_id, check_in_date, check_out_date, guests(full_name)')
    .eq('hotel_id', hotelId)
    .neq('payment_status', 'cancelled')
    .lte('check_in_date', today)
    .gte('check_out_date', today);

  const occupiedMap = new Map<string, any>();
  activeReservations?.forEach((r: any) => {
    occupiedMap.set(r.room_id, {
      guest_name: r.guests?.full_name || 'Unknown',
      check_in: r.check_in_date,
      check_out: r.check_out_date,
    });
  });

  // 4. Compile summary
  const summary = {
    total_rooms: rooms.length,
    available: 0,
    occupied: 0,
    maintenance: 0,
    vacant_clean: 0,
    vacant_dirty: 0,
  };

  const roomDetails = rooms.map((room: any) => {
    const isOccupied = room.status === 'occupied' || occupiedMap.has(room.id);
    const occupant = occupiedMap.get(room.id);
    
    if (isOccupied) {
      summary.occupied++;
    } else if (room.status === 'maintenance') {
      summary.maintenance++;
    } else {
      summary.available++;
      if (room.cleaning_status === 'clean' || room.cleaning_status === 'inspected') {
        summary.vacant_clean++;
      } else {
        summary.vacant_dirty++;
      }
    }

    return {
      room_number: room.room_number,
      room_type: room.room_type?.name || 'Unknown',
      status: isOccupied ? 'occupied' : room.status,
      cleaning_status: room.cleaning_status,
      floor: room.floor_number || '-',
      price_per_night: room.room_type?.price_per_night || 0,
      capacity: room.room_type?.capacity || 0,
      current_guest: occupant?.guest_name || null,
      checkout_date: occupant?.check_out || null,
    };
  });

  const filterLabel = room_type_name ? ` (tipe: ${room_type_name})` : '';

  return {
    success: true,
    type: 'room_status',
    message: `Ditemukan ${rooms.length} kamar${filterLabel}. ${summary.available} tersedia (${summary.vacant_clean} siap huni), ${summary.occupied} terisi, ${summary.maintenance} maintenance.`,
    data: {
      summary,
      rooms: roomDetails,
      filter_applied: room_type_name || 'semua tipe',
    }
  };
}

/**
 * Tool: list_room_types
 * Menampilkan semua tipe kamar beserta detail harga, fasilitas, dll.
 * TIDAK memerlukan parameter apapun.
 */
export async function listRoomTypesTool(args: any): Promise<ToolExecutionResult> {
  const supabase = await getSupabase();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { type: 'error', message: 'User tidak login.' };

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('hotel_id')
    .eq('user_id', session.user.id)
    .maybeSingle();
  const hotelId = roleData?.hotel_id;
  if (!hotelId) return { type: 'error', message: 'User tidak terhubung dengan hotel.' };

  // Get all room types with count of rooms per type
  const { data: roomTypes, error } = await supabase
    .from('room_types')
    .select(`
      id,
      name,
      price_per_night,
      base_price,
      capacity,
      description,
      size_sqm,
      bed_type,
      bed_count,
      view_type,
      smoking_allowed,
      amenities
    `)
    .eq('hotel_id', hotelId)
    .order('price_per_night', { ascending: true });

  if (error) {
    console.error('❌ Error list_room_types:', error);
    return { type: 'error', message: 'Terjadi kesalahan saat mengambil data tipe kamar.' };
  }

  if (!roomTypes || roomTypes.length === 0) {
    return { type: 'info', message: 'Belum ada tipe kamar yang terdaftar di hotel ini.' };
  }

  // Get room counts per type
  const { data: rooms } = await supabase
    .from('rooms')
    .select('room_type_id, status')
    .eq('hotel_id', hotelId);

  const typeCountMap = new Map<string, { total: number; available: number }>();
  rooms?.forEach((room: any) => {
    const existing = typeCountMap.get(room.room_type_id) || { total: 0, available: 0 };
    existing.total++;
    if (room.status === 'available') existing.available++;
    typeCountMap.set(room.room_type_id, existing);
  });

  const typeList = roomTypes.map((rt: any) => {
    const counts = typeCountMap.get(rt.id) || { total: 0, available: 0 };
    return {
      name: rt.name,
      price_per_night: rt.price_per_night,
      capacity: rt.capacity,
      description: rt.description || 'Tidak ada deskripsi',
      size_sqm: rt.size_sqm || null,
      bed_type: rt.bed_type || null,
      bed_count: rt.bed_count || null,
      view_type: rt.view_type || null,
      smoking_allowed: rt.smoking_allowed ?? false,
      amenities: rt.amenities || [],
      total_rooms: counts.total,
      available_rooms: counts.available,
    };
  });

  return {
    success: true,
    type: 'room_types_list',
    message: `Hotel ini memiliki ${roomTypes.length} tipe kamar.`,
    data: {
      room_types: typeList,
      total_types: roomTypes.length,
    }
  };
}
