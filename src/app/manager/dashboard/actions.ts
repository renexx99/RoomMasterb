'use server';

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Existing: Standard LLM Chat (Dumb Mode) ---
export async function chatWithStandardLLM(userMessage: string, history: any[]) {
  try {
    const systemMessage = {
      role: "system",
      content: "Anda adalah Asisten Manajer Hotel yang membantu di 'RoomMaster'. Anda sedang mengobrol dengan manajer hotel. Jawab pertanyaan mereka dengan sopan dan profesional berdasarkan pengetahuan umum Anda."
    };

    const apiMessages = [
      systemMessage,
      ...history.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: apiMessages as any,
    });

    return {
      type: 'ai',
      content: response.choices[0].message.content || "Maaf, saya tidak bisa menjawab.",
      timestamp: new Date(),
    };

  } catch (error) {
    console.error("Standard LLM Error:", error);
    return {
      type: 'system',
      content: "Error: Gagal menghubungi AI Standard. Cek API Key.",
      timestamp: new Date(),
    };
  }
}

// --- NEW: Proactive Manager Dashboard Insights ---
export interface ManagerSummaryData {
  hotelName: string;
  todayDate: string;
  dayOfWeek: string;
  availableRooms: number;
  totalRooms: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  guestsInHouse: number;
  occupancyRate: number;
  recentRevenue: {
    guestName: string;
    roomNumber: string;
    amount: number;
    status: string;
  }[];
}

export async function generateManagerInsights(summary: ManagerSummaryData) {
  const systemPrompt = `
Kamu adalah agent AI Strategist tingkat lanjut di Property Management System hotel B2B bernama RoomMaster.
Tugasmu: Menganalisis ringkasan kinerja operasional hotel dan memberikan MAKSIMAL 3 insight strategis yang CERDAS, SPESIFIK, dan ACTIONABLE kepada Hotel Manager.

DATA RINGKASAN HOTEL HARI INI (${summary.todayDate}, ${summary.dayOfWeek}):
- Nama Hotel: ${summary.hotelName}
- Okupansi: ${summary.occupancyRate.toFixed(1)}% (${summary.guestsInHouse} tamu in-house dari ${summary.totalRooms} kamar total)
- Kamar Tersedia: ${summary.availableRooms} kamar
- Expected Arrival: ${summary.todayCheckIns} tamu
- Expected Departure: ${summary.todayCheckOuts} tamu
- Revenue Terbaru: ${JSON.stringify(summary.recentRevenue.slice(0, 5))}

ATURAN ANALISIS WAJIB (PATUHI TANPA TERKECUALI):
1. BAHASA: Bahasa Indonesia profesional, lugas, dan ringkas. Maksimal 2 kalimat per insight.
2. DILARANG KERAS memberikan saran generik seperti "tingkatkan layanan", "perhatikan feedback tamu", atau "lakukan evaluasi rutin".
3. SETIAP insight HARUS merujuk ANGKA SPESIFIK dari data yang diberikan.
4. LOGIKA STRATEGI yang WAJIB diterapkan:
   - Jika hari ini Jumat/Sabtu dan okupansi < 80%: Sarankan flash promotion weekend dengan target persentase kenaikan spesifik.
   - Jika hari ini Jumat/Sabtu dan okupansi >= 85%: Sarankan kenaikan harga (Dynamic Pricing) dengan estimasi revenue tambahan.
   - Jika okupansi < 50%: Identifikasi sebagai RISIKO pendapatan, sarankan aksi agresif (partnership OTA, corporate rate, dll).
   - Jika okupansi > 90%: Sarankan upselling ke tipe kamar lebih tinggi karena ketersediaan terbatas.
   - Jika todayCheckIns tinggi (>5): Ingatkan untuk memastikan staf FO cukup untuk menangani volume check-in.
   - Jika ada banyak revenue berstatus "pending": Alert risiko piutang.
   - Analisis pola checkout vs checkin: Jika checkout > checkin, ada gap kamar yang bisa dioptimasi.

ATURAN OUTPUT (STRICT JSON ARRAY - TANPA MARKDOWN, TANPA PEMBUKA/PENUTUP):
[
  {
    "kategori": "Revenue | Operasional | Risiko",
    "text": "Insight spesifik maksimal 2 kalimat dalam Bahasa Indonesia",
    "color": "teal | violet | red | blue | orange",
    "iconType": "chart | coin | user | alert | bed"
  }
]

PANDUAN WARNA:
- teal: insight positif / peluang revenue
- violet: strategi pricing / upselling
- orange: peringatan operasional ringan
- red: risiko / alert kritis
- blue: informasi analitis / tren
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Analisis data ringkasan hotel dan berikan insight strategis dalam format JSON sekarang.' },
      ],
      temperature: 0.4,
      max_tokens: 500,
    });

    const raw = response.choices[0]?.message?.content?.trim() || '[]';
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    const validColors = ['teal', 'violet', 'red', 'blue', 'orange'];
    const validIcons = ['chart', 'coin', 'user', 'alert', 'bed'];
    const validCategories = ['Revenue', 'Operasional', 'Risiko'];

    return parsed.slice(0, 3).map((item: any) => ({
      kategori: validCategories.includes(item.kategori) ? item.kategori : 'Operasional',
      text: String(item.text || ''),
      color: validColors.includes(item.color) ? item.color : 'blue',
      iconType: validIcons.includes(item.iconType) ? item.iconType : 'chart',
    }));
  } catch (error) {
    console.error('Manager AI Insights Error:', error);
    return [];
  }
}