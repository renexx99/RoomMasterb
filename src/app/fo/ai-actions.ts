// src/app/fo/ai-actions.ts
'use server';

import OpenAI from 'openai';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getSupabase() {
  const cookieStore = await cookies();
  // @ts-ignore
  return createServerActionClient({ cookies: () => cookieStore });
}

// --- HELPER: Hitung Durasi Malam ---
function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays > 0 ? diffDays : 1;
}

// --- HELPER INTERNAL: Cari Kamar Kosong Terbaik ---
async function findAvailableRoomInternal(supabase: any, hotelId: string, checkIn: string, checkOut: string, roomTypeName?: string) {
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
      room_type:room_types!inner(name, price_per_night)
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

// ============================================================================
// 🛠️ AI TOOLS IMPLEMENTATION
// ============================================================================

// --- TOOL 1: KONFIRMASI PEMESANAN (Validation Stage) ---
async function confirmBookingDetailsTool(args: any) {
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

// --- TOOL 2: EKSEKUSI PEMESANAN (Final Stage) ---
async function createReservationTool(args: any) {
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

// --- TOOL 3: CEK KETERSEDIAAN (Hanya Lihat-Lihat) ---
async function checkAvailabilityTool(args: any) {
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

// --- TOOL 4: ANALYTICS REPORTER (Laporan Kinerja) ---
async function analyticsReporterTool(args: any) {
  const supabase = await getSupabase();
  const { start_date, end_date } = args;
  
  const { data: { session } } = await supabase.auth.getSession();
  const { data: roleData } = await supabase.from('user_roles').select('hotel_id').eq('user_id', session?.user.id).maybeSingle();
  const hotelId = roleData?.hotel_id;

  const { count: totalRooms } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', hotelId);

  const { data: reservations } = await supabase
    .from('reservations')
    .select('total_price, payment_status, check_in_date')
    .eq('hotel_id', hotelId)
    .neq('payment_status', 'cancelled')
    .gte('check_in_date', start_date)
    .lte('check_in_date', end_date);

  if (!reservations || reservations.length === 0) return { 
    type: 'info',
    message: "Belum ada data reservasi pada periode ini." 
  };

  const totalRevenue = reservations.reduce((acc: number, curr: any) => acc + (curr.total_price || 0), 0);
  const totalBookings = reservations.length;
  const paidBookings = reservations.filter(r => r.payment_status === 'paid').length;
  
  const start = new Date(start_date);
  const end = new Date(end_date);
  const daysDiff = Math.max(1, Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const capacity = (totalRooms || 1) * daysDiff;
  const occupancyRate = Math.min(100, Math.round((totalBookings / capacity) * 100));

  return {
    success: true,
    type: 'analytics',
    data: {
      period: {
        start: start_date,
        end: end_date,
        days: daysDiff
      },
      revenue: {
        total: totalRevenue,
        average_per_booking: Math.round(totalRevenue / totalBookings)
      },
      bookings: {
        total: totalBookings,
        paid: paidBookings,
        pending: totalBookings - paidBookings
      },
      occupancy: {
        rate: occupancyRate,
        rooms_available: totalRooms || 0,
        capacity: capacity
      }
    }
  };
}

// --- TOOL 5: GUEST PROFILER (Cek Data Tamu & History Real-time) ---
async function guestProfilerTool(args: any) {
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

// --- TOOL 6: ROOM INSPECTOR (Cek Status Detail Kamar) ---
async function roomInspectorTool(args: any) {
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

// ============================================================================
// 🧠 MAIN AI HANDLER
// ============================================================================

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatWithAI(userMessage: string, history: OpenAIMessage[]) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const systemMessage: OpenAIMessage = { 
        role: "system", 
        content: `Kamu adalah 'RoomMaster AI', asisten Front Office Hotel yang efisien. Hari ini: ${today}.
        
        INSTRUKSI PENTING:
        1. Smart Booking: Jika user memberikan perintah booking lengkap, langsung ekstrak semua data dan panggil tool 'confirm_booking_details'.
        2. Validasi: Selalu panggil 'confirm_booking_details' dulu sebelum 'create_reservation'.
        3. Eksekusi: Jika user sudah konfirmasi "Ya/Oke/Benar", BARU panggil 'create_reservation'.
        4. Data Kurang: Jika user tidak memberi Email/HP, isi dengan '-' di parameter tool.
        5. Output: Tool akan mengembalikan data terstruktur. Jangan tambahkan emoji atau formatting berlebihan.`
    };

    const tools = [
      {
        type: "function" as const,
        function: {
          name: "confirm_booking_details",
          description: "Panggil ini PERTAMA kali saat user ingin booking. Validasi data & harga sebelum disimpan.",
          parameters: {
            type: "object",
            properties: {
              guest_name: { type: "string" },
              user_email: { type: "string", description: "Ekstrak email dari input user jika ada" },
              phone_number: { type: "string", description: "Ekstrak no HP dari input user jika ada" },
              room_type_name: { type: "string" },
              check_in: { type: "string", format: "date" },
              check_out: { type: "string", format: "date" },
            },
            required: ["guest_name", "room_type_name", "check_in", "check_out"],
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "create_reservation",
          description: "Panggil ini HANYA jika user sudah konfirmasi (bilang Ya/Oke) setelah melihat detail.",
          parameters: {
            type: "object",
            properties: {
              guest_name: { type: "string" },
              user_email: { type: "string" },
              phone_number: { type: "string" },
              room_type_name: { type: "string" },
              check_in: { type: "string", format: "date" },
              check_out: { type: "string", format: "date" },
              payment_method: { type: "string", enum: ["cash", "transfer", "qris", "credit_card"] },
            },
            required: ["guest_name", "room_type_name", "check_in", "check_out"],
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "check_availability",
          description: "Cek ketersediaan kamar (hanya untuk melihat-lihat/checking).",
          parameters: {
            type: "object",
            properties: {
              check_in: { type: "string", format: "date" },
              check_out: { type: "string", format: "date" },
              room_type_name: { type: "string" },
            },
            required: ["check_in", "check_out"],
          },
        },
      },
      {
        type: "function" as const,
        function: {
            name: "analytics_reporter",
            description: "Buat laporan revenue & okupansi.",
            parameters: {
                type: "object",
                properties: { start_date: { type: "string" }, end_date: { type: "string" } },
                required: ["start_date", "end_date"]
            }
        }
      },
      {
        type: "function" as const,
        function: {
            name: "guest_profiler",
            description: "Cari info tamu (loyalitas, history).",
            parameters: {
                type: "object",
                properties: { guest_identifier: { type: "string" } },
                required: ["guest_identifier"]
            }
        }
      },
      {
        type: "function" as const,
        function: {
            name: "room_inspector",
            description: "Cek detail status fisik satu kamar.",
            parameters: {
                type: "object",
                properties: { room_number: { type: "string" } },
                required: ["room_number"]
            }
        }
      }
    ];

    const messages = [
        systemMessage,
        ...history,
        { role: 'user', content: userMessage } as OpenAIMessage
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages as any,
      tools: tools,
      tool_choice: "auto", 
    });

    const responseMessage = response.choices[0].message;

    if (responseMessage.tool_calls) {
      const toolCall = responseMessage.tool_calls[0];
      const args = JSON.parse((toolCall as any).function.arguments);
      const functionName = (toolCall as any).function.name;

      let actionResult;

      switch (functionName) {
        case "confirm_booking_details":
          actionResult = await confirmBookingDetailsTool(args);
          break;
        case "create_reservation":
          actionResult = await createReservationTool(args);
          break;
        case "check_availability":
          actionResult = await checkAvailabilityTool(args);
          break;
        case "analytics_reporter":
          actionResult = await analyticsReporterTool(args);
          break;
        case "guest_profiler":
          actionResult = await guestProfilerTool(args);
          break;
        case "room_inspector":
          actionResult = await roomInspectorTool(args);
          break;
        default:
          actionResult = { type: 'error', message: "Fungsi tidak dikenal." };
      }

      if ('error' in actionResult && actionResult.error) {
           return { role: 'assistant', content: actionResult.error, data: null, type: 'error' };
      }
      
      return { 
        role: 'assistant', 
        content: actionResult?.message || "Selesai.",
        data: actionResult?.data || null,
        type: actionResult?.type || 'text'
      };
    }

    return { 
      role: 'assistant', 
      content: responseMessage.content || "Maaf, saya tidak mengerti.",
      data: null,
      type: 'text'
    };

  } catch (error) {
    console.error("AI Error:", error);
    return { 
      role: 'assistant', 
      content: "Maaf, sistem AI sedang gangguan. Coba lagi nanti.",
      data: null,
      type: 'error'
    };
  }
}