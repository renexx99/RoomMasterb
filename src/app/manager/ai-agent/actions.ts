// src/app/manager/ai-agent/actions.ts
'use server';

import OpenAI from 'openai';
import { AI_TOOLS_DEFINITION } from '@/app/fo/ai-agent/definitions';
import { analyticsReporterTool } from '@/app/fo/ai-agent/tools/analytics';
import { checkAvailabilityTool, roomInspectorTool } from '@/app/fo/ai-agent/tools/availability';
import { guestProfilerTool } from '@/app/fo/ai-agent/tools/guests';
// PERBAIKAN: Import tools booking yang benar (berasal dari FO atau Manager sama saja)
import { confirmBookingDetailsTool, createReservationTool } from '@/app/fo/ai-agent/tools/booking';
import { OpenAIMessage, ToolExecutionResult } from '@/app/fo/ai-agent/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function chatWithManagerAI(userMessage: string, history: OpenAIMessage[]) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // PERBAIKAN: System Prompt digabung dengan SOP Reservasi agar agent tidak looping
    const systemMessage: OpenAIMessage = { 
        role: "system", 
        content: `Kamu adalah 'RoomMaster AI', asisten General Manager Hotel. Hari ini: ${today}.
        
        Kamu memiliki akses PENUH ke:
        1. **Operasional (seperti Front Office):** Membuat draft booking (confirm_booking_details), mengeksekusi reservasi (create_reservation), mengecek ketersediaan (check_availability), dan inspeksi kamar (room_inspector).
        2. **Manajerial & Reporting:** Menganalisa laporan revenue dan okupansi hotel (analytics_reporter), serta memantau profil lengkap tamu VIP (guest_profiler).

        SOP RESERVASI (PENTING):
        1. FASE DRAFT: Jika user baru meminta booking atau bertanya ketersediaan, panggil 'confirm_booking_details'.
        2. FASE EKSEKUSI: Jika user berkata "Konfirmasi", "Lanjut", "Buat", atau "Benar" DAN data (Nama, Kamar, Tanggal) sudah ada di chat sebelumnya, JANGAN panggil 'confirm_booking_details' lagi. LANGSUNG panggil 'create_reservation'.
        3. DATA: Jika user tidak memberi Email/HP, isi parameter dengan '-'.

        Berikan respon yang profesional, efisien, dan strategis. Jangan ragu memanggil tools yang sesuai dengan permintaan Manager, baik itu untuk sekadar memesankan kamar untuk relasi Manager, maupun menarik laporan bulanan.`
    };

    const messages = [
        systemMessage,
        ...history,
        { role: 'user', content: userMessage } as OpenAIMessage
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages as any,
      tools: AI_TOOLS_DEFINITION,
      tool_choice: "auto", 
    });

    const responseMessage = response.choices[0].message;

    if (responseMessage.tool_calls) {
      const toolCall = responseMessage.tool_calls[0];
      const args = JSON.parse((toolCall as any).function.arguments);
      const functionName = (toolCall as any).function.name;

      let actionResult: ToolExecutionResult | undefined;

      // PERBAIKAN: Sesuaikan pemanggilan switch case dengan nama tool yang benar
      switch (functionName) {
        case "confirm_booking_details":
          actionResult = await confirmBookingDetailsTool(args);
          break;
        case "create_reservation":
          actionResult = await createReservationTool(args);
          break;
        case "analytics_reporter":
          actionResult = await analyticsReporterTool(args);
          break;
        case "check_availability":
          actionResult = await checkAvailabilityTool(args);
          break;
        case "guest_profiler":
          actionResult = await guestProfilerTool(args);
          break;
        case "room_inspector":
          actionResult = await roomInspectorTool(args);
          break;
        default:
          actionResult = { type: 'error', message: "Fungsi tidak dikenali oleh sistem." };
      }

      if (actionResult?.error || (actionResult && actionResult.type === 'error')) {
           return { role: 'assistant', content: actionResult.message || actionResult.error || "Terjadi kesalahan", data: null, type: 'error' };
      }
      
      return { role: 'assistant', content: actionResult?.message || "Tugas berhasil dijalankan.", data: actionResult?.data || null, type: actionResult?.type || 'text' };
    }

    return { role: 'assistant', content: responseMessage.content || "Maaf, saya tidak mengerti.", data: null, type: 'text' };
  } catch (error) {
    console.error("AI Error:", error);
    return { role: 'assistant', content: "Maaf, sistem AI sedang gangguan. Coba lagi nanti.", data: null, type: 'error' };
  }
}