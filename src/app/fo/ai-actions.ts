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

// --- HELPER: Cari Kamar Kosong ---
async function findAvailableRoom(supabase: any, hotelId: string, checkIn: string, checkOut: string, roomTypeName?: string) {
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

  const { data, error } = await query.limit(1).maybeSingle();
  
  if (error) throw new Error(error.message);
  return data;
}

// --- TOOL 1: CEK KETERSEDIAAN ---
async function checkAvailabilityTool(args: any) {
  const supabase = await getSupabase();
  const { check_in, check_out, room_type_name } = args;

  console.log("🤖 AI Cek Ketersediaan:", args);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "User tidak login." };

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('hotel_id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!roleData?.hotel_id) return { error: "User tidak terhubung ke hotel manapun." };
  const hotelId = roleData.hotel_id;

  const { data: occupied } = await supabase
    .from('reservations')
    .select('room_id')
    .eq('hotel_id', hotelId)
    .neq('payment_status', 'cancelled')
    .lt('check_in_date', check_out)
    .gt('check_out_date', check_in);

  const occupiedIds = occupied?.map((o: any) => o.room_id) || [];

  let query = supabase
    .from('rooms')
    .select(`
      id, 
      room_number, 
      status, 
      room_type:room_types!inner(name, price_per_night)
    `)
    .eq('hotel_id', hotelId)
    .eq('status', 'available');

  if (occupiedIds.length > 0) {
    query = query.not('id', 'in', `(${occupiedIds.join(',')})`);
  }

  if (room_type_name) {
    query = query.ilike('room_type.name', `%${room_type_name}%`);
  }

  const { data: availableRooms, error } = await query.limit(10);

  if (error) return { error: "Gagal mencari kamar: " + error.message };
  
  if (!availableRooms || availableRooms.length === 0) {
    return { message: "Mohon maaf, tidak ada kamar yang tersedia untuk kriteria tersebut." };
  }

  const list = availableRooms.map((r: any) => 
    `- Kamar ${r.room_number} (${r.room_type.name}): Rp ${r.room_type.price_per_night.toLocaleString('id-ID')}/malam`
  ).join('\n');

  return { 
    success: true, 
    message: `Ditemukan ${availableRooms.length} kamar tersedia:\n${list}\n\nSilakan pilih kamar untuk tamu.` 
  };
}

// --- TOOL 2: BUAT RESERVASI ---
async function createReservationTool(args: any) {
  const supabase = await getSupabase();
  const { guest_name, room_number, room_type_name, check_in, check_out, user_email, payment_method } = args;

  console.log("🤖 AI Booking:", args);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "User tidak login." };

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('hotel_id')
    .eq('user_id', session.user.id)
    .maybeSingle();
    
  if (!roleData?.hotel_id) return { error: "User tidak terhubung ke hotel manapun." };
  const hotelId = roleData.hotel_id;

  // 1. SELECT ROOM & PRICE INFO
  let selectedRoom = null;

  if (room_number) {
    const cleanRoomNumber = room_number.toString().trim();
    const { data: room, error } = await supabase
      .from('rooms')
      .select(`
        id, 
        status, 
        room_number,
        room_type:room_types (price_per_night)
      `)
      .eq('hotel_id', hotelId)
      .ilike('room_number', cleanRoomNumber)
      .maybeSingle();

    if (!room) return { error: `Kamar nomor '${cleanRoomNumber}' tidak ditemukan.` };
    selectedRoom = room;

    const { data: conflict } = await supabase
      .from('reservations')
      .select('id')
      .eq('room_id', room.id)
      .neq('payment_status', 'cancelled')
      .lt('check_in_date', check_out)
      .gt('check_out_date', check_in)
      .maybeSingle();
    
    if (conflict) return { error: `Kamar ${cleanRoomNumber} sudah terisi pada tanggal tersebut.` };

  } else {
    try {
      selectedRoom = await findAvailableRoom(supabase, hotelId, check_in, check_out, room_type_name);
    } catch (e: any) {
      return { error: e.message };
    }

    if (!selectedRoom) {
      return { error: `Maaf, tidak ada kamar kosong yang sesuai.` };
    }
  }

  // 2. HITUNG TOTAL HARGA
  const nights = calculateNights(check_in, check_out);
  const pricePerNight = (selectedRoom as any).room_type?.price_per_night || 0;
  const totalPrice = nights * pricePerNight;

  if (totalPrice === 0) {
    console.warn("⚠️ Peringatan: Total harga 0. Cek data harga tipe kamar.");
  }

  // 3. CEK / BUAT TAMU
  let guestId = '';
  const { data: existingGuest } = await supabase
    .from('guests')
    .select('id')
    .eq('hotel_id', hotelId)
    .ilike('full_name', `%${guest_name}%`)
    .limit(1)
    .maybeSingle();

  if (existingGuest) {
    guestId = existingGuest.id;
  } else {
    const { data: newGuest, error: guestError } = await supabase
      .from('guests')
      .insert({
        hotel_id: hotelId,
        full_name: guest_name,
        email: user_email,
        title: 'Mr.',
        loyalty_tier: 'bronze' 
      })
      .select('id')
      .single();
    
    if (guestError) return { error: "Gagal membuat tamu: " + guestError.message };
    guestId = newGuest.id;
  }

  // 4. SIMPAN RESERVASI
  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .insert({
      hotel_id: hotelId,
      room_id: selectedRoom.id,
      guest_id: guestId,
      check_in_date: check_in,
      check_out_date: check_out,
      payment_status: 'pending',
      payment_method: payment_method || null,
      total_price: totalPrice
    })
    .select()
    .single();

  if (resError) return { error: "Gagal menyimpan reservasi: " + resError.message };

  return { 
    success: true, 
    message: `Berhasil! 
    - Tamu: ${guest_name}
    - Kamar: ${selectedRoom.room_number}
    - Durasi: ${nights} Malam (${check_in} s/d ${check_out})
    - Total: Rp ${totalPrice.toLocaleString('id-ID')}
    - Pembayaran: ${payment_method || 'Belum dipilih'} (Status: Pending)` 
  };
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// --- MAIN AI HANDLER ---
export async function chatWithAI(userMessage: string, history: OpenAIMessage[]) {
  try {
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "check_availability",
          description: "Cek ketersediaan kamar. Gunakan ini jika user bertanya 'ada kamar kosong?' atau ingin melihat opsi.",
          parameters: {
            type: "object",
            properties: {
              check_in: { type: "string", format: "date" },
              check_out: { type: "string", format: "date" },
              room_type_name: { type: "string", description: "Standard, Deluxe, Suite, dll." },
            },
            required: ["check_in", "check_out"],
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "create_reservation",
          description: "Buat reservasi final. Pastikan semua data lengkap (termasuk email & pembayaran).",
          parameters: {
            type: "object",
            properties: {
              guest_name: { type: "string", description: "Nama Lengkap" },
              user_email: { type: "string", description: "Email tamu (WAJIB TANYA untuk data valid)" },
              payment_method: { 
                type: "string", 
                enum: ["cash", "transfer", "qris", "credit_card", "other"],
                description: "Metode pembayaran (WAJIB TANYA)" 
              },
              room_number: { type: "string", description: "Isi jika user minta nomor spesifik." },
              room_type_name: { type: "string", description: "Wajib jika room_number kosong." },
              check_in: { type: "string", format: "date" },
              check_out: { type: "string", format: "date" },
            },
            required: ["guest_name", "user_email", "payment_method", "check_in", "check_out"],
          },
        },
      },
    ];

    const today = new Date().toISOString().split('T')[0];
    
    // --- UPDATE SYSTEM PROMPT ---
    const systemMessage: OpenAIMessage = { 
        role: "system", 
        content: `Kamu adalah asisten operasional (Internal AI) untuk Staff Front Office hotel.
        Hari ini: ${today}.
        
        PANDUAN KOMUNIKASI:
        1. Ingat: Lawan bicaramu adalah STAFF HOTEL, bukan tamu.
        2. JANGAN PERNAH gunakan kata "Anda" atau "Kamu" saat merujuk pada tamu. 
           Gunakan "Tamu", "Beliau", atau sebut nama tamunya.
           Contoh Salah: "Siapa nama Anda?", "Apa email Anda?"
           Contoh Benar: "Siapa nama tamunya?", "Bisa minta email tamu tersebut?"
        
        SOP Reservasi:
        1. Cek ketersediaan dulu ('check_availability') jika staff belum tau kamar.
        2. Sebelum membuat reservasi ('create_reservation'), KAMU WAJIB MENANYAKAN ke staff:
           - Email tamu (harus input manual dari staff).
           - Metode pembayaran (Cash, Transfer, QRIS, Credit Card).
        3. Jangan panggil 'create_reservation' jika email atau payment_method masih kosong.
        4. Jika staff tidak pilih nomor kamar, minta sistem pilihkan via parameter 'room_type_name'.`
    };

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
      
      if (toolCall.type === 'function') {
        const args = JSON.parse(toolCall.function.arguments);
        let actionResult;

        if (toolCall.function.name === "check_availability") {
          actionResult = await checkAvailabilityTool(args);
        } else if (toolCall.function.name === "create_reservation") {
          actionResult = await createReservationTool(args);
        }

        if (actionResult?.error) {
             return { role: 'ai', content: `Gagal: ${actionResult.error}` };
        }
        return { role: 'ai', content: actionResult?.message || "Selesai." };
      }
    }

    return { role: 'ai', content: responseMessage.content || "Maaf, saya tidak mengerti." };

  } catch (error) {
    console.error("AI Error:", error);
    return { role: 'ai', content: "Maaf, sistem AI sedang gangguan." };
  }
}