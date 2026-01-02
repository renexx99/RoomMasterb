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
// Fungsi ini digunakan oleh tool konfirmasi dan tool booking untuk memastikan konsistensi
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

  // Ambil beberapa opsi untuk dipilih (prioritas 'clean')
  const { data: rooms, error } = await query.limit(5);
  
  if (error || !rooms || rooms.length === 0) return null;

  // Prioritaskan kamar yang sudah bersih (clean)
  const cleanRoom = rooms.find((r: any) => r.cleaning_status === 'clean');
  
  // Jika ada yang clean, return itu. Jika tidak, return kamar available pertama (meskipun dirty, nanti bisa dibersihkan)
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

    // Cek ketersediaan kamar secara internal
    const room = await findAvailableRoomInternal(supabase, hotelId, check_in, check_out, room_type_name);

    if (!room) {
        return { message: `Mohon maaf, tidak ada kamar tipe '${room_type_name}' yang tersedia pada tanggal ${check_in} s.d ${check_out}.` };
    }

    const nights = calculateNights(check_in, check_out);
    const totalPrice = nights * room.room_type.price_per_night;

    // Format mata uang
    const formattedPrice = totalPrice.toLocaleString('id-ID');

    return {
        success: true,
        message: `📋 **KONFIRMASI PEMESANAN**
        \nMohon cek kembali detail berikut sebelum diproses:
        \n👤 **Tamu:** ${guest_name}
        📧 **Email:** ${user_email && user_email !== '-' ? user_email : '(Kosong)'}
        📱 **HP:** ${phone_number && phone_number !== '-' ? phone_number : '(Kosong)'}
        🛏️ **Kamar:** ${room.room_type.name} (Unit: ${room.room_number})
        📅 **Tanggal:** ${check_in} s/d ${check_out} (${nights} Malam)
        💰 **Total:** Rp ${formattedPrice}
        \nApakah data ini sudah benar? Ketik **"Ya"** untuk memproses booking.`
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

  // 1. Re-Check Availability (Mencegah race condition)
  const selectedRoom = await findAvailableRoomInternal(supabase, hotelId, check_in, check_out, room_type_name);
  if (!selectedRoom) return { error: `Gagal: Kamar tipe ${room_type_name} baru saja diambil tamu lain.` };

  // 2. Hitung Harga Final
  const nights = calculateNights(check_in, check_out);
  const totalPrice = nights * (selectedRoom as any).room_type.price_per_night;

  // 3. Handle Data Tamu (Cari Existing atau Buat Baru)
  let guestId = '';
  let queryGuest = supabase.from('guests').select('id').eq('hotel_id', hotelId);
  
  // Logika pencarian tamu: Prioritas Email -> Prioritas Nama + No HP
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
    // Buat tamu baru
    const { data: newGuest, error: guestError } = await supabase
      .from('guests')
      .insert({
        hotel_id: hotelId,
        full_name: guest_name,
        email: (user_email && user_email.includes('@')) ? user_email : `guest-${Date.now()}@temp.com`,
        phone_number: (phone_number && phone_number.length > 5) ? phone_number : null,
        title: 'Mr.', // [FIX] Menggunakan title umum yang aman
        loyalty_tier: 'bronze' // [FIX] Menggunakan lowercase 'bronze' sesuai enum DB
      })
      .select('id')
      .single();
    
    if (guestError) return { error: "Gagal membuat profil tamu: " + guestError.message };
    guestId = newGuest.id;
  }

  // 4. Simpan Reservasi
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

  if (resError) return { error: "Gagal menyimpan reservasi: " + resError.message };

  return { 
    success: true, 
    message: `✅ **RESERVASI BERHASIL!**
    \n**No. Booking:** #${reservation.id.substring(0,8).toUpperCase()}
    **Kamar:** ${selectedRoom.room_number} (${selectedRoom.cleaning_status})
    **Tamu:** ${guest_name}
    \nSilakan lanjutkan ke proses pembayaran atau check-in.` 
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

  if (!room) return { message: "Maaf, tidak ada kamar kosong sesuai kriteria tersebut pada tanggal yang diminta." };

  return { 
    success: true, 
    message: `ℹ️ **Info Ketersediaan**
    \nDitemukan: Kamar ${room.room_number} (${room.room_type.name})
    Harga: Rp ${room.room_type.price_per_night.toLocaleString('id-ID')}/malam
    Status: ${room.cleaning_status === 'clean' ? '✅ Siap Huni' : '⚠️ Perlu Dibersihkan'}
    \nKetik "Book kamar ini" jika ingin membuat reservasi.` 
  };
}

// --- TOOL 4: ANALYTICS REPORTER (Laporan Kinerja) ---
async function analyticsReporterTool(args: any) {
  const supabase = await getSupabase();
  const { start_date, end_date } = args;
  
  const { data: { session } } = await supabase.auth.getSession();
  const { data: roleData } = await supabase.from('user_roles').select('hotel_id').eq('user_id', session?.user.id).maybeSingle();
  const hotelId = roleData?.hotel_id;

  // 1. Hitung Total Kamar
  const { count: totalRooms } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', hotelId);

  // 2. Tarik Data Reservasi
  const { data: reservations } = await supabase
    .from('reservations')
    .select('total_price')
    .eq('hotel_id', hotelId)
    .neq('payment_status', 'cancelled')
    .gte('check_in_date', start_date)
    .lte('check_in_date', end_date);

  if (!reservations || reservations.length === 0) return { message: "Belum ada data reservasi pada periode ini." };

  const totalRevenue = reservations.reduce((acc: number, curr: any) => acc + (curr.total_price || 0), 0);
  const totalBookings = reservations.length;
  
  // Kalkulasi Okupansi Sederhana
  const start = new Date(start_date);
  const end = new Date(end_date);
  const daysDiff = Math.max(1, Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const capacity = (totalRooms || 1) * daysDiff;
  const occupancyRate = Math.min(100, Math.round((totalBookings / capacity) * 100));

  return {
    success: true,
    message: `📊 **Laporan Kinerja (${start_date} s/d ${end_date})**
    \n💰 **Pendapatan:** Rp ${totalRevenue.toLocaleString('id-ID')}
    📈 **Okupansi:** ${occupancyRate}%
    🔖 **Total Booking:** ${totalBookings} reservasi`
  };
}

// --- TOOL 5: GUEST PROFILER (Cek Data Tamu & History Real-time) ---
async function guestProfilerTool(args: any) {
  const supabase = await getSupabase();
  const { guest_identifier } = args;

  const { data: { session } } = await supabase.auth.getSession();
  const { data: roleData } = await supabase.from('user_roles').select('hotel_id').eq('user_id', session?.user.id).maybeSingle();
  const hotelId = roleData?.hotel_id;

  // 1. Cari ID Tamu berdasarkan Nama atau Email
  const { data: guests } = await supabase
    .from('guests')
    .select('*')
    .eq('hotel_id', hotelId)
    .or(`full_name.ilike.%${guest_identifier}%,email.ilike.%${guest_identifier}%`)
    .limit(1);

  if (!guests || guests.length === 0) {
    return { message: `Tamu dengan identitas "${guest_identifier}" belum ditemukan di database.` };
  }

  const g = guests[0];

  // 2. HITUNG MANUAL DARI TABLE RESERVATIONS
  // Mengambil history dan melakukan join bertingkat ke rooms -> room_types
  const { data: history } = await supabase
    .from('reservations')
    .select(`
      total_price, 
      check_in_date, 
      room_id,
      rooms (
        room_number, 
        room_types (name)
      )
    `)
    .eq('guest_id', g.id)
    .eq('hotel_id', hotelId)
    .neq('payment_status', 'cancelled')
    .order('check_in_date', { ascending: false });

  // Hitung statistik
  const calculatedStays = history?.length || 0;
  const calculatedSpend = history?.reduce((acc: number, curr: any) => acc + (curr.total_price || 0), 0) || 0;

  // 3. AMBIL DATA KUNJUNGAN TERAKHIR (SAFE ACCESS)
  const lastVisit = history && history.length > 0 ? history[0] : null;
  let lastRoomInfo = '-';
  let lastDate = '-';

  if (lastVisit) {
      lastDate = lastVisit.check_in_date;

      // Handle akses data: Supabase bisa mengembalikan object atau array of object untuk relasi
      // Kita gunakan 'any' untuk casting sementara agar TypeScript tidak error saat akses properti
      const roomRaw = (lastVisit as any).rooms;
      
      // Cek apakah rooms berupa array atau object tunggal
      const roomData = Array.isArray(roomRaw) ? roomRaw[0] : roomRaw;

      if (roomData) {
          const typeRaw = roomData.room_types;
          // Cek apakah room_types berupa array atau object tunggal
          const typeData = Array.isArray(typeRaw) ? typeRaw[0] : typeRaw;
          
          const rName = typeData?.name || 'Unknown Type';
          const rNo = roomData.room_number || '?';
          
          lastRoomInfo = `${rName} (No. ${rNo})`;
      }
  }

  // Format Preferensi
  let preferencesDisplay = "-";
  if (g.preferences) {
    if (typeof g.preferences === 'object' && Object.keys(g.preferences).length > 0) {
        preferencesDisplay = Object.entries(g.preferences)
            .map(([key, val]) => `${key}: ${val}`)
            .join(', ');
    } else if (typeof g.preferences === 'string') {
        preferencesDisplay = g.preferences;
    }
  }

  return {
    success: true,
    message: `👤 **Profil Tamu & History**
    \n**Identitas:**
    • Nama: ${g.title || ''} ${g.full_name}
    • Tier: ${g.loyalty_tier ? g.loyalty_tier.toUpperCase() : 'BRONZE'}
    • Kontak: ${g.email} | ${g.phone_number || '-'}
    \n📊 **Riwayat Menginap (Real-time):**
    • Total Kunjungan: ${calculatedStays} kali
    • Total Transaksi: Rp ${calculatedSpend.toLocaleString('id-ID')}
    • Kunjungan Terakhir: ${lastDate}
    • Kamar Terakhir: ${lastRoomInfo}
    \n✨ **Preferensi & Catatan:**
    ${preferencesDisplay}`
  };
}

// --- TOOL 6: ROOM INSPECTOR (Cek Status Detail Kamar - FIXED) ---
async function roomInspectorTool(args: any) {
    const supabase = await getSupabase();
    // 1. Bersihkan input user (hapus spasi depan/belakang)
    const rawInput = String(args.room_number || '').trim();
  
    const { data: { session } } = await supabase.auth.getSession();
    const { data: roleData } = await supabase.from('user_roles').select('hotel_id').eq('user_id', session?.user.id).maybeSingle();
    const hotelId = roleData?.hotel_id;

    if (!hotelId) return { message: "Gagal: User tidak terhubung dengan Hotel ID." };

    // 2. Query dengan Wildcard & Perbaikan Nama Relasi
    const { data: rooms, error } = await supabase
        .from('rooms')
        // [FIX] Gunakan 'room_types' (nama tabel asli) dan alias 'room_type' biar properti di bawah tidak error
        .select(`
            *, 
            room_type:room_types(name)
        `)
        .eq('hotel_id', hotelId)
        // [FIX] Gunakan wildcards (%) agar "101A" bisa match dengan "Room 101A" atau "101A "
        .ilike('room_number', `%${rawInput}%`)
        .limit(1); // Ambil 1 saja

    if (error) {
        console.error("❌ Error Room Inspector:", error);
        return { message: "Terjadi kesalahan saat mencari data kamar." };
    }

    const room = rooms && rooms.length > 0 ? rooms[0] : null;

    if (!room) {
        return { message: `Kamar dengan nomor yang mengandung "${rawInput}" tidak ditemukan.` };
    }

    // [FIX] Handling aman jika room_type null (misal relasi putus)
    // @ts-ignore
    const typeName = room.room_type?.name || 'Tipe Tidak Diketahui';

    return { 
        success: true, 
        message: `🏠 **Inspeksi Kamar ${room.room_number}**
        \nTipe: ${typeName}
        Status: ${room.status.toUpperCase()}
        Kebersihan: ${room.cleaning_status.toUpperCase()}
        Catatan: ${room.special_notes || '-'}` 
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
    
    // SYSTEM PROMPT: Menginstruksikan AI agar pintar mengekstrak data
    const systemMessage: OpenAIMessage = { 
        role: "system", 
        content: `Kamu adalah 'RoomMaster AI', asisten Front Office Hotel yang efisien. Hari ini: ${today}.
        
        INSTRUKSI PENTING:
        1. **Smart Booking:** Jika user memberikan perintah booking lengkap (contoh: "Book Deluxe untuk Budi b@gmail.com 08123 besok"), JANGAN tanya satu-satu. Langsung ekstrak semua data (Nama, Email, HP, Tanggal, Tipe) dan panggil tool 'confirm_booking_details'.
        2. **Validasi:** Selalu panggil 'confirm_booking_details' dulu sebelum 'create_reservation'. Jangan langsung create tanpa konfirmasi user.
        3. **Eksekusi:** Jika user sudah menjawab "Ya/Oke/Benar" pada konfirmasi, BARU panggil 'create_reservation'.
        4. **Data Kurang:** Jika user tidak memberi Email/HP, isi dengan '-' (dash) di parameter tool, jangan paksa user input kecuali krusial.`
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
          actionResult = { error: "Fungsi tidak dikenal." };
      }

      if ('error' in actionResult && actionResult.error) {
           return { role: 'assistant', content: `Error: ${actionResult.error}` };
      }
      return { role: 'assistant', content: actionResult?.message || "Selesai." };
    }

    return { role: 'assistant', content: responseMessage.content || "Maaf, saya tidak mengerti." };

  } catch (error) {
    console.error("AI Error:", error);
    return { role: 'assistant', content: "Maaf, sistem AI sedang gangguan. Coba lagi nanti." };
  }
}