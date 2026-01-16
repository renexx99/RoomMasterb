import { getSupabase, calculateNights, findAvailableRoomInternal } from '../utils';

export async function checkAvailabilityTool(args: any) {
  const supabase = await getSupabase();
  const { check_in, check_out, room_type_name } = args;
  
  const { data: { session } } = await supabase.auth.getSession();
  const { data: roleData } = await supabase.from('user_roles').select('hotel_id').eq('user_id', session?.user.id).maybeSingle();
  const hotelId = roleData?.hotel_id;

  const room = await findAvailableRoomInternal(supabase, hotelId, check_in, check_out, room_type_name);

  if (!room) return { 
    type: 'info',
    message: "Tidak ada kamar kosong sesuai kriteria pada tanggal yang diminta." 
  };

  const nights = calculateNights(check_in, check_out);

  return { 
    success: true,
    type: 'availability',
    data: {
      room_number: room.room_number,
      room_type: room.room_type.name,
      price_per_night: room.room_type.price_per_night,
      cleaning_status: room.cleaning_status,
      check_in,
      check_out,
      nights,
      total_estimate: nights * room.room_type.price_per_night
    }
  };
}

export async function roomInspectorTool(args: any) {
    const supabase = await getSupabase();
    const rawInput = String(args.room_number || '').trim();
  
    const { data: { session } } = await supabase.auth.getSession();
    const { data: roleData } = await supabase.from('user_roles').select('hotel_id').eq('user_id', session?.user.id).maybeSingle();
    const hotelId = roleData?.hotel_id;

    if (!hotelId) return { type: 'error', message: "User tidak terhubung dengan Hotel ID." };

    const { data: rooms, error } = await supabase
        .from('rooms')
        .select(`
            *, 
            room_type:room_types(name, price_per_night, capacity)
        `)
        .eq('hotel_id', hotelId)
        .ilike('room_number', `%${rawInput}%`)
        .limit(1);

    if (error) {
        console.error("❌ Error Room Inspector:", error);
        return { type: 'error', message: "Terjadi kesalahan saat mencari data kamar." };
    }

    const room = rooms && rooms.length > 0 ? rooms[0] : null;

    if (!room) {
        return { 
          type: 'info',
          message: `Kamar dengan nomor yang mengandung "${rawInput}" tidak ditemukan.` 
        };
    }

    // @ts-ignore
    const typeName = room.room_type?.name || 'Tipe Tidak Diketahui';
    // @ts-ignore
    const capacity = room.room_type?.capacity || '-';
    // @ts-ignore
    const price = room.room_type?.price_per_night || 0;

    return { 
        success: true,
        type: 'room_inspection',
        data: {
          room_number: room.room_number,
          room_type: typeName,
          status: room.status,
          cleaning_status: room.cleaning_status,
          floor: room.floor_number || '-',
          wing: room.wing || '-',
          capacity: capacity,
          price_per_night: price,
          furniture_condition: room.furniture_condition || '-',
          special_notes: room.special_notes || 'Tidak ada catatan'
        }
    };
}