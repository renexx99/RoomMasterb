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

// ============================================================================
// 🛠️ AI TOOLS IMPLEMENTATION
// ============================================================================

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
      cleaning_status,
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
    `- Kamar ${r.room_number} (${r.room_type.name}): Rp ${r.room_type.price_per_night.toLocaleString('id-ID')}/malam [${r.cleaning_status === 'clean' ? '✅ Bersih' : '⚠️ Kotor'}]`
  ).join('\n');

  return { 
    success: true, 
    message: `Ditemukan ${availableRooms.length} kamar tersedia:\n${list}\n\nSilakan pilih kamar untuk tamu.` 
  };
}

// --- TOOL 2: GUEST PROFILER ---
async function guestProfilerTool(args: any) {
  const supabase = await getSupabase();
  const { guest_identifier } = args;

  console.log("🤖 AI Guest Profiler:", args);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "User tidak login." };

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('hotel_id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!roleData?.hotel_id) return { error: "Akses ditolak." };
  const hotelId = roleData.hotel_id;

  const { data: guests, error } = await supabase
    .from('guests')
    .select('*')
    .eq('hotel_id', hotelId)
    .or(`full_name.ilike.%${guest_identifier}%,email.ilike.%${guest_identifier}%,phone_number.ilike.%${guest_identifier}%`)
    .limit(3);

  if (error) return { error: "DB Error: " + error.message };

  if (!guests || guests.length === 0) {
    return { 
      message: `Tidak ditemukan data tamu dengan kata kunci "${guest_identifier}".\nStatus: **New Guest** (Tamu Baru).` 
    };
  }

  const profiles = guests.map((g: any) => {
    const isReturning = (g.total_stays && g.total_stays > 0);
    let prefs = "-";
    if (g.preferences && typeof g.preferences === 'object' && g.preferences.tags) {
        prefs = Array.isArray(g.preferences.tags) ? g.preferences.tags.join(', ') : JSON.stringify(g.preferences);
    }
    
    return `
    👤 **${g.title} ${g.full_name}**
    - Status: ${isReturning ? '🔄 RETURNING GUEST' : '✨ NEW MEMBER'}
    - Tier: ${g.loyalty_tier || 'Bronze'}
    - Total Menginap: ${g.total_stays || 0} kali
    - Total Spend: Rp ${(g.total_spend || 0).toLocaleString('id-ID')}
    - Terakhir Check-in: ${g.last_visit_at ? new Date(g.last_visit_at).toLocaleDateString('id-ID') : 'Belum pernah'}
    - Preferensi: ${prefs}
    - Kontak: ${g.email} | ${g.phone_number || '-'}
    `;
  }).join('\n---\n');

  return {
    success: true,
    message: `Ditemukan data tamu berikut:\n${profiles}\n\nSaran: Gunakan data ini untuk menyapa tamu atau menawarkan upgrade.`
  };
}

// --- TOOL 3: ROOM INSPECTOR ---
async function roomInspectorTool(args: any) {
    const supabase = await getSupabase();
    const { room_number } = args;
  
    console.log("🤖 AI Room Inspector:", args);
  
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: "User tidak login." };
  
    const { data: roleData } = await supabase.from('user_roles').select('hotel_id').eq('user_id', session.user.id).maybeSingle();
    const hotelId = roleData?.hotel_id;

    // 1. Ambil Data Kamar
    const { data: room, error } = await supabase
        .from('rooms')
        .select(`
            *,
            room_type:room_types(name)
        `)
        .eq('hotel_id', hotelId)
        .eq('room_number', room_number)
        .maybeSingle();

    if (error || !room) return { message: `Kamar nomor ${room_number} tidak ditemukan.` };

    let statusInfo = `Kamar ${room.room_number} (${room.room_type?.name})`;
    statusInfo += `\nStatus Fisik: **${room.cleaning_status.toUpperCase()}**`;
    statusInfo += `\nStatus Okupansi: **${room.status.toUpperCase()}**`;

    // 2. Jika Occupied, cari siapa tamunya
    if (room.status === 'occupied') {
        const today = new Date().toISOString().split('T')[0];
        const { data: reservation } = await supabase
            .from('reservations')
            .select(`
                check_in_date, check_out_date,
                guest:guests(full_name)
            `)
            .eq('room_id', room.id)
            .lte('check_in_date', today)
            .gte('check_out_date', today)
            .neq('payment_status', 'cancelled')
            .limit(1)
            .maybeSingle();
        
        if (reservation) {
            // [FIX] Mengambil nama tamu dari array (Supabase join mengembalikan array)
            // @ts-ignore
            const guestName = Array.isArray(reservation.guest) ? reservation.guest[0]?.full_name : reservation.guest?.full_name;
            
            statusInfo += `\n\nPenghuni Saat Ini:`;
            statusInfo += `\n- Nama: ${guestName || 'Tamu (Data Tidak Lengkap)'}`;
            statusInfo += `\n- Check-out: ${new Date(reservation.check_out_date).toLocaleDateString('id-ID')}`;
        }
    }

    if (room.status === 'maintenance') {
        statusInfo += `\n\n⚠️ Catatan: Kamar sedang dalam perbaikan/maintenance.`;
        if (room.special_notes) statusInfo += `\nInfo: ${room.special_notes}`;
    }

    return { success: true, message: statusInfo };
}

// --- TOOL 4: BUAT RESERVASI ---
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

  // 1. SELECT ROOM
  let selectedRoom = null;

  if (room_number) {
    const cleanRoomNumber = room_number.toString().trim();
    const { data: room, error } = await supabase
      .from('rooms')
      .select(`id, status, room_number, room_type:room_types (price_per_night)`)
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
    if (!selectedRoom) return { error: `Maaf, tidak ada kamar kosong yang sesuai.` };
  }

  // 2. HITUNG HARGA
  const nights = calculateNights(check_in, check_out);
  const pricePerNight = (selectedRoom as any).room_type?.price_per_night || 0;
  const totalPrice = nights * pricePerNight;

  // 3. CEK / BUAT TAMU
  let guestId = '';
  let queryGuest = supabase.from('guests').select('id').eq('hotel_id', hotelId);
  if (user_email) queryGuest = queryGuest.eq('email', user_email);
  else queryGuest = queryGuest.ilike('full_name', `%${guest_name}%`);
  
  const { data: existingGuest } = await queryGuest.limit(1).maybeSingle();

  if (existingGuest) {
    guestId = existingGuest.id;
  } else {
    const { data: newGuest, error: guestError } = await supabase
      .from('guests')
      .insert({
        hotel_id: hotelId,
        full_name: guest_name,
        email: user_email || `guest-${Date.now()}@temp.com`,
        title: 'Mr.',
        loyalty_tier: 'Bronze' 
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
    message: `✅ Reservasi Berhasil Dibuat!
    - No. Reservasi: #${reservation.id.substring(0,8).toUpperCase()}
    - Tamu: ${guest_name}
    - Kamar: ${selectedRoom.room_number}
    - Tanggal: ${check_in} s/d ${check_out} (${nights} malam)
    - Total: Rp ${totalPrice.toLocaleString('id-ID')}
    - Status: Pending (${payment_method || 'Unspecified'})` 
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
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "check_availability",
          description: "Cek ketersediaan kamar hotel berdasarkan tanggal. Gunakan ini jika user bertanya 'ada kamar kosong?' atau 'cek harga kamar'.",
          parameters: {
            type: "object",
            properties: {
              check_in: { type: "string", format: "date", description: "Format YYYY-MM-DD" },
              check_out: { type: "string", format: "date", description: "Format YYYY-MM-DD" },
              room_type_name: { type: "string", description: "Opsional: Standard, Deluxe, Suite" },
            },
            required: ["check_in", "check_out"],
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "guest_profiler",
          description: "Cari profil tamu untuk melihat riwayat menginap, status member, dan preferensi. Gunakan jika user bertanya 'apakah ini tamu baru?', 'cek history tamu', atau 'apa kesukaan tamu ini?'.",
          parameters: {
            type: "object",
            properties: {
              guest_identifier: { type: "string", description: "Nama tamu, email, atau nomor telepon" },
            },
            required: ["guest_identifier"],
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "room_inspector",
          description: "Cek status detail sebuah kamar (Bersih/Kotor/Rusak/Siapa penghuninya). Gunakan jika user bertanya 'status kamar 101' atau 'siapa di kamar 202'.",
          parameters: {
            type: "object",
            properties: {
              room_number: { type: "string", description: "Nomor kamar, contoh: '101', 'A-05'" },
            },
            required: ["room_number"],
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "create_reservation",
          description: "Membuat reservasi baru. HANYA jalankan jika semua data (Nama, Email, Payment, Tanggal) sudah lengkap.",
          parameters: {
            type: "object",
            properties: {
              guest_name: { type: "string", description: "Nama Lengkap Tamu" },
              user_email: { type: "string", description: "Email tamu (Wajib)" },
              payment_method: { 
                type: "string", 
                enum: ["cash", "transfer", "qris", "credit_card", "other"],
                description: "Metode pembayaran" 
              },
              room_number: { type: "string", description: "Nomor kamar spesifik (jika diminta)" },
              room_type_name: { type: "string", description: "Tipe kamar (jika nomor kamar tidak spesifik)" },
              check_in: { type: "string", format: "date" },
              check_out: { type: "string", format: "date" },
            },
            required: ["guest_name", "user_email", "payment_method", "check_in", "check_out"],
          },
        },
      },
    ];

    const today = new Date().toISOString().split('T')[0];
    
    const systemMessage: OpenAIMessage = { 
        role: "system", 
        content: `Kamu adalah AI Assistant 'RoomMaster' untuk Staff Front Office.
        Hari ini: ${today}.
        
        TUGAS UTAMA:
        1. Membantu cek ketersediaan kamar ('check_availability').
        2. Mengenali tamu ('guest_profiler') untuk memberikan layanan personal.
           - Jika tamu adalah "Returning Guest", sarankan: "Sapa dengan 'Selamat datang kembali'".
           - Jika "New Guest", sarankan: "Jelaskan fasilitas hotel".
        3. Membantu cek operasional kamar ('room_inspector').
        4. Membuat reservasi ('create_reservation').

        ATURAN PENTING:
        - Kamu berbicara kepada STAFF, bukan Tamu. Gunakan bahasa profesional dan efisien.
        - Sebelum booking, selalu tawarkan untuk cek profil tamu dulu ('guest_profiler') jika staff hanya menyebut nama, agar data tidak duplikat.
        - Jika staff bertanya "Kamar 101 statusnya apa?", gunakan 'room_inspector'.
        `
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
      
      // [FIX] Menggunakan casting 'as any' untuk menghindari error strict type checking
      // pada properti 'function' yang kadang dianggap tidak ada di beberapa versi type definition
      const args = JSON.parse((toolCall as any).function.arguments);
      let actionResult;

      // [FIX] Menggunakan casting 'as any' untuk mengakses function.name dengan aman
      const functionName = (toolCall as any).function.name;

      switch (functionName) {
        case "check_availability":
          actionResult = await checkAvailabilityTool(args);
          break;
        case "guest_profiler":
          actionResult = await guestProfilerTool(args);
          break;
        case "room_inspector":
          actionResult = await roomInspectorTool(args);
          break;
        case "create_reservation":
          actionResult = await createReservationTool(args);
          break;
        default:
          actionResult = { error: "Fungsi tidak dikenal." };
      }

      if (actionResult?.error) {
           return { role: 'assistant', content: `Gagal: ${actionResult.error}` };
      }
      return { role: 'assistant', content: actionResult?.message || "Selesai." };
    }

    return { role: 'assistant', content: responseMessage.content || "Maaf, saya tidak mengerti." };

  } catch (error) {
    console.error("AI Error:", error);
    return { role: 'assistant', content: "Maaf, sistem AI sedang gangguan. Coba lagi nanti." };
  }
}