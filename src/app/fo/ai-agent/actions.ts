'use server';

import OpenAI from 'openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { AI_TOOLS_DEFINITION } from './definitions';
import { confirmBookingDetailsTool, createReservationTool } from './tools/booking';
import { checkAvailabilityTool, roomInspectorTool } from './tools/availability';
import { analyticsReporterTool } from './tools/analytics';
import { guestProfilerTool } from './tools/guests';
import { roomStatusSummaryTool, listRoomTypesTool } from './tools/room_status';
import { checkinGuestTool, checkoutGuestTool, forceCheckoutTool } from './tools/checkin_checkout';
import { searchReservationsTool } from './tools/reservations';
import { OpenAIMessage, ToolExecutionResult } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Map function name → handler
 */
const TOOL_HANDLERS: Record<string, (args: any) => Promise<ToolExecutionResult>> = {
  confirm_booking_details: confirmBookingDetailsTool,
  create_reservation: createReservationTool,
  check_availability: checkAvailabilityTool,
  analytics_reporter: analyticsReporterTool,
  guest_profiler: guestProfilerTool,
  room_inspector: roomInspectorTool,
  room_status_summary: roomStatusSummaryTool,
  list_room_types: listRoomTypesTool,
  checkin_guest: checkinGuestTool,
  checkout_guest: checkoutGuestTool,
  force_checkout: forceCheckoutTool,
  search_reservations: searchReservationsTool,
};

/**
 * LangChain PromptTemplate for the system prompt.
 * Uses LangChain's prompt templating engine to assemble the system instruction
 * with dynamic date variables injected at runtime.
 */
const SYSTEM_PROMPT_TEMPLATE = PromptTemplate.fromTemplate(
`Kamu adalah 'RoomMaster AI', asisten cerdas untuk Front Office Hotel. 
Hari ini: {day_of_week}, {today_label} ({today}).

═══ PANDUAN UMUM ═══
1. Jawab dalam bahasa Indonesia yang sopan dan profesional.
2. Jika user bertanya hal umum/sapaan, jawab langsung tanpa memanggil tool.
3. Selalu gunakan tool yang PALING TEPAT untuk setiap pertanyaan.
4. Jangan meminta informasi yang tidak diperlukan oleh tool.
5. Jika ada data yang dikembalikan oleh tool, rangkum hasilnya dengan jelas dan rapi.

═══ CHAIN-OF-THOUGHT (CoT) WAJIB ═══
Setiap kali kamu memilih dan memanggil sebuah tool, kamu HARUS mengisi parameter "thought_process" dengan langkah-langkah pemikiranmu secara transparan. Isi thought_process harus mencakup:
1. Apa yang diminta user?
2. Tool mana yang paling tepat dan mengapa?
3. Bagaimana kamu menentukan parameter yang akan dikirim?
Ini penting untuk transparansi dan auditabilitas keputusan AI.

═══ REFERENSI TANGGAL (WAJIB DIPAKAI) ═══
Kamu HARUS menggunakan referensi tanggal di bawah ini ketika user menggunakan kata waktu relatif.
JANGAN menebak atau menghitung sendiri — gunakan nilai yang sudah dihitung berikut:

📅 Hari:
  - "hari ini" / "sekarang" = {today}
  - "besok" = {tomorrow}
  - "besok lusa" / "lusa" = {day_after_tomorrow}
  - "kemarin" = {yesterday}

📅 Minggu:
  - "minggu ini" = {this_monday} s/d {this_sunday}
  - "minggu depan" / "minggu berikutnya" = {next_monday} s/d {next_sunday}
  - "minggu lalu" / "minggu kemarin" = {last_monday} s/d {last_sunday}
  - "weekend" / "akhir pekan" = {next_saturday} s/d {weekend_sunday}

📅 Bulan:
  - "bulan ini" = {this_month_start} s/d {this_month_end}
  - "bulan depan" / "bulan berikutnya" = {next_month_start} s/d {next_month_end}
  - "bulan lalu" / "bulan kemarin" = {last_month_start} s/d {last_month_end}

⚠️ PENTING: Jika user bilang "minggu depan" untuk booking, gunakan {next_monday} sebagai check_in.
Jika user bilang "3 malam" tanpa tanggal, tanya tanggal check-in atau asumsikan mulai "besok" ({tomorrow}).

═══ PANDUAN PEMILIHAN TOOL ═══

🔹 PERTANYAAN STATUS/KETERSEDIAAN SAAT INI (TANPA TANGGAL):
   → Gunakan "room_status_summary"
   Contoh: "status kamar deluxe?", "ada kamar kosong?", "berapa kamar terisi?"
   ⚠️ JANGAN gunakan check_availability untuk ini! Tidak perlu tanggal!

🔹 DAFTAR TIPE KAMAR & HARGA:
   → Gunakan "list_room_types"
   Contoh: "tipe kamar apa saja?", "harga deluxe berapa?", "fasilitas suite?"

🔹 DETAIL SATU KAMAR (BERDASARKAN NOMOR):
   → Gunakan "room_inspector"
   Contoh: "detail kamar 101", "kondisi kamar 205"

🔹 CEK KETERSEDIAAN DI TANGGAL TERTENTU:
   → Gunakan "check_availability" — WAJIB ada check_in DAN check_out
   Contoh: "ada kamar deluxe tanggal 1-5 Juni?"

🔹 CARI RESERVASI:
   → Gunakan "search_reservations"
   Contoh: "reservasi atas nama Budi", "booking hari ini", "reservasi pending"

🔹 INFO/RIWAYAT TAMU:
   → Gunakan "guest_profiler"
   Contoh: "info tamu Ahmad", "riwayat Sari"

🔹 PROSES CHECK-IN:
   → Gunakan "checkin_guest"
   Contoh: "check-in Budi", "proses kedatangan tamu Sari"

🔹 PROSES CHECK-OUT:
   → Gunakan "checkout_guest"
   Contoh: "checkout kamar 205", "tamu di kamar 101 mau pulang"
   Jika ada warning tagihan → user bilang "ya tetap checkout" → gunakan "force_checkout"

═══ SOP RESERVASI ═══
1. FASE DRAFT: User minta booking → panggil "confirm_booking_details"
2. FASE EKSEKUSI: User bilang "Ya/Konfirmasi/Lanjut" → LANGSUNG panggil "create_reservation"
   JANGAN panggil confirm_booking_details lagi!
3. Jangan paksa tanya email/no HP — isi '-' jika tidak disebutkan. Sistem cari otomatis di database.

═══ LAPORAN & ANALYTICS ═══
- "Laporan bulan ini" → analytics_reporter (start: {this_month_start}, end: {this_month_end})
- "Revenue minggu lalu" → analytics_reporter (start: {last_monday}, end: {last_sunday})
- "Laporan bulan lalu" → analytics_reporter (start: {last_month_start}, end: {last_month_end})

═══ FORMAT RESPONS STATUS KAMAR (PENTING!) ═══
Jika tool "room_status_summary" mengembalikan DATA BANYAK KAMAR, jangan jabarkan satu per satu secara naratif.
Sajikan sebagai RINGKASAN SINGKAT + TABEL/LIST yang efisien. Contoh format:

Ringkasan: 10 kamar total — 5 tersedia, 4 terisi, 1 maintenance.

| No | Tipe | Status | Kebersihan | Tamu |
|---|---|---|---|---|
| 101 | Deluxe | ✅ Tersedia | Bersih | - |
| 102 | Deluxe | 🔴 Terisi | - | Budi (s/d 5 Jun) |
| 201 | Suite | 🔧 Maintenance | - | - |

Gunakan emoji status: ✅ Tersedia, 🔴 Terisi, 🔧 Maintenance, 🧹 Perlu Dibersihkan.
Jika user bertanya status kamar spesifik (1 kamar), boleh jawab naratif biasa.

═══ ATURAN PENTING ═══
- DILARANG mengarang data. Jika tool mengembalikan error, sampaikan apa adanya.
- Jika user bertanya hal di luar kapabilitas, jelaskan apa yang bisa kamu bantu.
- Gunakan emoji secukupnya untuk membuat respons lebih hidup.
- Format angka mata uang dengan "Rp" dan pemisah ribuan.`
);

/**
 * Build the system prompt using LangChain PromptTemplate.
 * Computes all dynamic date variables and formats them into the template.
 */
async function buildSystemPrompt(): Promise<string> {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const dayOfWeek = now.toLocaleDateString('id-ID', { weekday: 'long' });
  
  // Pre-compute common relative dates for the model
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const dayAfterTomorrow = new Date(now); dayAfterTomorrow.setDate(now.getDate() + 2);
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  
  // Next week (Monday to Sunday)
  const dayNum = now.getDay(); // 0=Sun, 1=Mon...
  const nextMonday = new Date(now); nextMonday.setDate(now.getDate() + (8 - dayNum) % 7 || 7);
  const nextSunday = new Date(nextMonday); nextSunday.setDate(nextMonday.getDate() + 6);
  
  // This week (Monday to Sunday)
  const thisMonday = new Date(now); thisMonday.setDate(now.getDate() - ((dayNum + 6) % 7));
  const thisSunday = new Date(thisMonday); thisSunday.setDate(thisMonday.getDate() + 6);
  
  // Last week
  const lastMonday = new Date(thisMonday); lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday); lastSunday.setDate(thisMonday.getDate() - 1);
  
  // This month
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Next month
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  
  // Last month
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  
  // Weekend (Sabtu-Minggu terdekat)
  const nextSaturday = new Date(now); nextSaturday.setDate(now.getDate() + ((6 - dayNum + 7) % 7 || 7));
  const weekendSunday = new Date(nextSaturday); weekendSunday.setDate(nextSaturday.getDate() + 1);
  
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const fmtLabel = (d: Date) => d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Use LangChain PromptTemplate to format the system prompt with date variables
  const formattedPrompt = await SYSTEM_PROMPT_TEMPLATE.format({
    day_of_week: dayOfWeek,
    today_label: fmtLabel(now),
    today: fmt(now),
    tomorrow: fmt(tomorrow),
    day_after_tomorrow: fmt(dayAfterTomorrow),
    yesterday: fmt(yesterday),
    this_monday: fmt(thisMonday),
    this_sunday: fmt(thisSunday),
    next_monday: fmt(nextMonday),
    next_sunday: fmt(nextSunday),
    last_monday: fmt(lastMonday),
    last_sunday: fmt(lastSunday),
    next_saturday: fmt(nextSaturday),
    weekend_sunday: fmt(weekendSunday),
    this_month_start: fmt(thisMonthStart),
    this_month_end: fmt(thisMonthEnd),
    next_month_start: fmt(nextMonthStart),
    next_month_end: fmt(nextMonthEnd),
    last_month_start: fmt(lastMonthStart),
    last_month_end: fmt(lastMonthEnd),
  });

  return formattedPrompt;
}

export async function chatWithAI(userMessage: string, history: OpenAIMessage[]) {
  try {
    const systemMessage: OpenAIMessage = {
      role: "system",
      content: await buildSystemPrompt(),
    };

    const messages: OpenAIMessage[] = [
      systemMessage,
      ...history,
      { role: 'user', content: userMessage }
    ];

    // First LLM call
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages as any,
      tools: AI_TOOLS_DEFINITION,
      tool_choice: "auto",
    });

    const responseMessage = response.choices[0].message;

    // If no tool calls, return the text response directly
    if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
      return {
        role: 'assistant',
        content: responseMessage.content || "Maaf, saya tidak mengerti. Bisa jelaskan lebih detail?",
        data: null,
        type: 'text'
      };
    }

    // Handle tool calls (support multiple)
    const toolResults: { toolCallId: string; result: ToolExecutionResult }[] = [];

    for (const toolCall of responseMessage.tool_calls) {
      const tc = toolCall as any;
      const functionName = tc.function.name;
      let args: any = {};
      
      try {
        args = JSON.parse(tc.function.arguments);
      } catch (e) {
        console.error(`Failed to parse args for ${functionName}:`, tc.function.arguments);
        toolResults.push({
          toolCallId: toolCall.id,
          result: { type: 'error', message: 'Gagal memproses parameter tool.' }
        });
        continue;
      }

      console.log(`🤖 AI calling: ${functionName}`, args);

      // Log Chain-of-Thought reasoning (CoT) for transparency and auditability
      if (args.thought_process) {
        console.log(`💭 CoT [${functionName}]: ${args.thought_process}`);
        // Remove thought_process from args before passing to tool handler
        // so existing handlers don't need modification
        const { thought_process, ...toolArgs } = args;
        args = toolArgs;
      }

      const handler = TOOL_HANDLERS[functionName];
      if (!handler) {
        toolResults.push({
          toolCallId: toolCall.id,
          result: { type: 'error', message: `Tool "${functionName}" tidak dikenal.` }
        });
        continue;
      }

      try {
        const result = await handler(args);
        toolResults.push({ toolCallId: toolCall.id, result });
      } catch (e: any) {
        console.error(`❌ Tool ${functionName} error:`, e);
        toolResults.push({
          toolCallId: toolCall.id,
          result: { type: 'error', message: `Gagal menjalankan ${functionName}: ${e.message}` }
        });
      }
    }

    // If only 1 tool was called, return its result directly (backward compatible)
    if (toolResults.length === 1) {
      const { result } = toolResults[0];
      if (result.error || result.type === 'error') {
        return {
          role: 'assistant',
          content: result.message || result.error || "Terjadi kesalahan",
          data: null,
          type: 'error'
        };
      }
      return {
        role: 'assistant',
        content: result.message || "Permintaan diproses.",
        data: result.data || null,
        type: result.type || 'text'
      };
    }

    // Multiple tool calls — build tool response messages and do a second LLM pass
    const followUpMessages: any[] = [
      ...messages,
      responseMessage, // Include the assistant's tool_calls message
      ...toolResults.map(tr => ({
        role: 'tool' as const,
        tool_call_id: tr.toolCallId,
        content: JSON.stringify(tr.result),
      })),
    ];

    try {
      const followUp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: followUpMessages,
      });

      const finalContent = followUp.choices[0].message.content || "Permintaan diproses.";
      
      // Combine data from all results
      const combinedData = toolResults.reduce((acc, tr) => {
        if (tr.result.data) {
          Object.assign(acc, tr.result.data);
        }
        return acc;
      }, {} as any);

      return {
        role: 'assistant',
        content: finalContent,
        data: Object.keys(combinedData).length > 0 ? combinedData : null,
        type: 'text'
      };
    } catch (e) {
      // Fallback: just return first successful result
      const firstSuccess = toolResults.find(tr => tr.result.type !== 'error');
      if (firstSuccess) {
        return {
          role: 'assistant',
          content: firstSuccess.result.message || "Permintaan diproses.",
          data: firstSuccess.result.data || null,
          type: firstSuccess.result.type || 'text'
        };
      }
      return {
        role: 'assistant',
        content: toolResults[0].result.message || "Terjadi kesalahan",
        data: null,
        type: 'error'
      };
    }

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