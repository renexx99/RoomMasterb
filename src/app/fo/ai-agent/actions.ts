'use server';

import OpenAI from 'openai';
import { AI_TOOLS_DEFINITION } from './definitions';
import { confirmBookingDetailsTool, createReservationTool } from './tools/booking';
import { checkAvailabilityTool, roomInspectorTool } from './tools/availability';
import { analyticsReporterTool } from './tools/analytics';
import { guestProfilerTool } from './tools/guests';
import { OpenAIMessage, ToolExecutionResult } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// (HAPUS interface OpenAIMessage lokal yang sebelumnya ada disini)

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

      // Gunakan tipe ToolExecutionResult agar autocomplete jalan
      let actionResult: ToolExecutionResult | undefined;

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

      if (actionResult?.error || (actionResult && actionResult.type === 'error')) {
           return { 
             role: 'assistant', 
             content: actionResult.message || actionResult.error || "Terjadi kesalahan", 
             data: null, 
             type: 'error' 
           };
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