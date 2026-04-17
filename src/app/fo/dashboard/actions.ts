'use server';

// --- Proactive FO Dashboard Insights (Daily Co-Pilot) ---

export interface FOArrivalGuest {
  guestName: string;
  title: string;
  loyaltyTier: string;
  preferences: string[];
  roomType: string;
  roomNumber: string;
}

export interface FOSummaryData {
  todayDate: string;
  dayOfWeek: string;
  hotelName: string;
  stats: {
    todayCheckIns: number;
    todayCheckOuts: number;
    availableRooms: number;
    dirtyRooms: number;
  };
  todayArrivals: FOArrivalGuest[];
}

export async function generateFOInsights(summary: FOSummaryData) {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const arrivalsContext = summary.todayArrivals.length > 0
    ? summary.todayArrivals.map((a, i) =>
      `${i + 1}. ${a.title} ${a.guestName} | Tier: ${a.loyaltyTier} | Kamar: ${a.roomNumber} (${a.roomType}) | Preferensi: ${a.preferences.length > 0 ? a.preferences.join(', ') : 'Tidak ada data'}`
    ).join('\n')
    : 'Tidak ada kedatangan hari ini.';

  const systemPrompt = `
Kamu adalah Agent AI Daily Co-Pilot untuk staf Front Office di Property Management System hotel B2B bernama RoomMaster.
Tugasmu: Memberikan MAKSIMAL 3 insight operasional dan pelayanan yang CERDAS, SPESIFIK, dan ACTIONABLE untuk membantu staf FO mempersiapkan hari ini.

DATA OPERASIONAL HARI INI (${summary.todayDate}, ${summary.dayOfWeek}):
- Hotel: ${summary.hotelName}
- Expected Arrival: ${summary.stats.todayCheckIns} tamu
- Expected Departure: ${summary.stats.todayCheckOuts} tamu
- Kamar Tersedia: ${summary.stats.availableRooms} kamar
- Kamar Kotor (Belum Dibersihkan): ${summary.stats.dirtyRooms} kamar

DAFTAR TAMU CHECK-IN HARI INI:
${arrivalsContext}

ATURAN ANALISIS WAJIB (PATUHI TANPA TERKECUALI):
1. BAHASA: Bahasa Indonesia profesional, lugas, dan ringkas. Maksimal 2 kalimat per insight.
2. DILARANG KERAS memberikan saran generik seperti "sambut tamu dengan ramah", "berikan pelayanan terbaik", atau "pastikan kamar bersih" tanpa konteks spesifik.
3. SETIAP insight HARUS merujuk NAMA TAMU SPESIFIK atau ANGKA SPESIFIK dari data.
4. LOGIKA OPERATIONAL yang WAJIB diterapkan:
   - Jika ada tamu bertier Gold/Platinum/Diamond: Alert VIP! Ingatkan welcome drink, prioritas check-in, kamar sudah diinspeksi.
   - Jika ada tamu dengan preferensi spesifik (non-smoking, extra pillow, dll): Ingatkan untuk memverifikasi kamar sudah sesuai preferensi SEBELUM tamu tiba.
   - Jika dirtyRooms > 0 dan todayCheckIns > 0: PERINGATAN! Koordinasi segera dengan Housekeeping agar kamar kotor selesai dibersihkan sebelum jam check-in (biasanya 14:00).
   - Jika todayCheckIns > todayCheckOuts: Hari sibuk! Ingatkan antisipasi antrean dan siapkan express check-in.
   - Jika todayCheckOuts banyak (>3): Ingatkan pengecekan minibar dan room charge sebelum settlement.
   - Jika ada tamu dengan tier Bronze/biasa dan kunjungan pertama: Sarankan kesan pertama yang baik, tawarkan orientasi fasilitas.

ATURAN OUTPUT (STRICT JSON ARRAY - TANPA MARKDOWN, TANPA PEMBUKA/PENUTUP):
[
  {
    "kategori": "Pelayanan | Operasional | Risiko",
    "text": "Insight spesifik maksimal 2 kalimat dalam Bahasa Indonesia",
    "color": "teal | violet | red | blue | orange",
    "iconType": "chart | coin | user | alert | bed"
  }
]

PANDUAN WARNA:
- teal: pelayanan VIP / apresiasi tamu
- violet: upselling / peluang revenue
- orange: peringatan operasional (housekeeping, koordinasi)
- red: risiko / alert kritis
- blue: informasi / persiapan umum
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Analisis data FO hari ini dan berikan insight operasional dalam format JSON sekarang.' },
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
    const validCategories = ['Pelayanan', 'Operasional', 'Risiko'];

    return parsed.slice(0, 3).map((item: any) => ({
      kategori: validCategories.includes(item.kategori) ? item.kategori : 'Operasional',
      text: String(item.text || ''),
      color: validColors.includes(item.color) ? item.color : 'blue',
      iconType: validIcons.includes(item.iconType) ? item.iconType : 'user',
    }));
  } catch (error) {
    console.error('FO AI Insights Error:', error);
    return [];
  }
}
