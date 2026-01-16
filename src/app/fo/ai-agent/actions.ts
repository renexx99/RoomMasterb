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

export async function chatWithAI(userMessage: string, history: OpenAIMessage[]) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // PERBAIKAN: Instruksi lebih spesifik untuk membedakan fase Draft vs Eksekusi
    const systemMessage: OpenAIMessage = { 
        role: "system", 
        content: `Kamu adalah 'RoomMaster AI', asisten Front Office Hotel. Hari ini: ${today}.
        
        SOP RESERVASI (PENTING):
        1. FASE DRAFT: Jika user baru meminta booking atau bertanya ketersediaan, panggil 'confirm_booking_details'.
        2. FASE EKSEKUSI: Jika user berkata "Konfirmasi", "Lanjut", "Buat", atau "Benar" DAN data (Nama, Kamar, Tanggal) sudah ada di chat sebelumnya, JANGAN panggil 'confirm_booking_details' lagi. LANGSUNG panggil 'create_reservation'.
        3. DATA: Jika user tidak memberi Email/HP, isi parameter dengan '-'.
        
        Ingat: Jangan looping di fase draft. Jika user sudah setuju, segera buat reservasi.`
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
        content: actionResult?.message || "Permintaan diproses.",
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