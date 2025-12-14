// src/app/fo/ai-actions.ts
'use server';

import OpenAI from 'openai';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Inisialisasi OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getSupabase() {
  const cookieStore = await cookies();
  // @ts-ignore
  return createServerActionClient({ cookies: () => cookieStore });
}

// --- FUNGSI TOOL: LOGIKA RESERVASI ---
// Ini fungsi "nyata" yang akan dipanggil saat AI memutuskan untuk booking
async function createReservationTool(args: any) {
  const supabase = await getSupabase();
  const { guest_name, room_number, check_in, check_out, user_email } = args;

  console.log("🤖 AI Mencoba Booking:", args);

  // 1. Dapatkan Hotel ID dari user yang sedang login (Session)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "User tidak login." };

  // Cari hotel_id user ini (FO)
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('hotel_id')
    .eq('user_id', session.user.id)
    .single();
    
  if (!roleData?.hotel_id) return { error: "User tidak terhubung ke hotel manapun." };
  const hotelId = roleData.hotel_id;

  // 2. Cari ID Kamar berdasarkan Nomor Kamar
  const { data: room } = await supabase
    .from('rooms')
    .select('id, status')
    .eq('hotel_id', hotelId)
    .eq('room_number', room_number)
    .single();

  if (!room) return { error: `Kamar nomor ${room_number} tidak ditemukan.` };
  // (Opsional: Cek status room.status === 'available')

  // 3. Cari atau Buat Tamu Baru
  // Sederhana: Kita cari berdasarkan nama dulu.
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
    // Jika tidak ada, buat tamu baru (dummy email jika tidak disediakan)
    const { data: newGuest, error: guestError } = await supabase
      .from('guests')
      .insert({
        hotel_id: hotelId,
        full_name: guest_name,
        email: user_email || `guest-${Date.now()}@temp.com`, // Email sementara
        title: 'Mr.', // Default
        loyalty_tier: 'Bronze'
      })
      .select('id')
      .single();
    
    if (guestError) return { error: "Gagal membuat data tamu: " + guestError.message };
    guestId = newGuest.id;
  }

  // 4. Buat Reservasi
  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .insert({
      hotel_id: hotelId,
      room_id: room.id,
      guest_id: guestId,
      check_in_date: check_in,
      check_out_date: check_out,
      payment_status: 'pending',
      total_price: 0 // Nanti bisa dihitung otomatis, sementara 0 dulu
    })
    .select()
    .single();

  if (resError) return { error: "Gagal menyimpan reservasi: " + resError.message };

  return { 
    success: true, 
    message: `Berhasil! Reservasi ID #${reservation.id.substring(0,6)} untuk ${guest_name} di Kamar ${room_number}.` 
  };
}

// Tambahkan Interface untuk struktur pesan OpenAI
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// --- MAIN AI HANDLER ---
// Menerima pesan user & riwayat chat
export async function chatWithAI(userMessage: string, history: OpenAIMessage[]) {
  try {
    // 1. Definisikan Tools (Kemampuan Agen)
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "create_reservation",
          description: "Membuat reservasi hotel baru untuk tamu. Wajib tanya semua parameter sebelum eksekusi.",
          parameters: {
            type: "object",
            properties: {
              guest_name: { type: "string", description: "Nama lengkap tamu" },
              user_email: { type: "string", description: "Email tamu (opsional)" },
              room_number: { type: "string", description: "Nomor kamar yang diinginkan (contoh: 101)" },
              check_in: { type: "string", format: "date", description: "Tanggal check-in (YYYY-MM-DD). Konversi dari 'besok' atau tanggal spesifik." },
              check_out: { type: "string", format: "date", description: "Tanggal check-out (YYYY-MM-DD)." },
            },
            required: ["guest_name", "room_number", "check_in", "check_out"],
          },
        },
      },
    ];

    const today = new Date().toISOString().split('T')[0];

    // System Prompt
    const systemMessage: OpenAIMessage = { 
        role: "system", 
        content: `Kamu adalah asisten Front Office Hotel (RoomMaster). 
        Hari ini: ${today}. 
        Tugasmu: Membantu staff membuat reservasi.
        Aturan:
        1. Kumpulkan data: Nama, Kamar, Check-in, Check-out.
        2. Jangan panggil tool 'create_reservation' jika data belum lengkap. Tanya user data yang kurang.
        3. Jika user menyebut nama bulan (misal: Desember), pastikan tahunnya relevan (jika lewat, pakai tahun depan).`
    };

    // 2. Gabungkan Context: System + History + Pesan Baru
    const messages = [
        systemMessage,
        ...history,
        { role: 'user', content: userMessage } as OpenAIMessage
    ];

    // 3. Panggil OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Model hemat & cepat
      messages: messages as any,
      tools: tools,
      tool_choice: "auto", 
    });

    const responseMessage = response.choices[0].message;

    // 4. Cek apakah AI ingin memanggil Tool (Function Calling)
    if (responseMessage.tool_calls) {
      const toolCall = responseMessage.tool_calls[0];
      
      if (toolCall.type === "function" && toolCall.function.name === "create_reservation") {
        const args = JSON.parse(toolCall.function.arguments);
        
        // JALANKAN FUNGSI DATABASE KITA
        const actionResult = await createReservationTool(args);

        // Balikkan hasil fungsi ke AI/UI
        if (actionResult.error) {
             return { role: 'ai', content: `Maaf, ada masalah: ${actionResult.error}` };
        }
        return { role: 'ai', content: actionResult.message };
      }
    }

    // Jika tidak ada tool call (hanya ngobrol biasa)
    return { role: 'ai', content: responseMessage.content || "Maaf, saya tidak mengerti." };

  } catch (error) {
    console.error("AI Error:", error);
    return { role: 'ai', content: "Maaf, sistem AI sedang gangguan." };
  }
}