// src/app/manager/guests/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();
  // @ts-ignore
  return createServerActionClient({ cookies: () => cookieStore });
}

export interface GuestData {
  hotel_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  title: string;
  loyalty_tier: string;
  preferences?: string[]; // Stored as JSONB
}

// --- UPDATE GUEST ---
export async function updateGuestAction(id: string, data: Partial<GuestData>) {
  const supabase = await getSupabase();

  const payload: any = { ...data };
  if (data.preferences) {
    payload.preferences = { tags: data.preferences };
  }

  const { error } = await supabase
    .from('guests')
    .update(payload)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/manager/guests');
  return { success: true };
}

// --- CREATE GUEST ---
export async function createGuestAction(data: GuestData) {
  const supabase = await getSupabase();

  const payload: any = { ...data };
  if (data.preferences) {
    payload.preferences = { tags: data.preferences };
  }

  const { error } = await supabase
    .from('guests')
    .insert(payload);

  if (error) {
    if (error.code === '23505') return { error: 'Email already registered.' };
    return { error: error.message };
  }

  revalidatePath('/manager/guests');
  return { success: true };
}

// --- FETCH GUEST HISTORY ---
export async function getGuestHistory(guestId: string) {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id,
      check_in_date,
      check_out_date,
      total_price,
      room:rooms(room_number, room_type:room_types(name))
    `)
    .eq('guest_id', guestId)
    .order('check_in_date', { ascending: false });

  if (error) return [];
  return data;
}

// --- GENERATE AI INSIGHTS ---
export async function generateGuestInsights(guestData: any, historyData: any[]) {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Data Trimming: ambil maksimal 3 kunjungan terakhir, ekstrak info penting saja
  const trimmedHistory = historyData.slice(0, 3).map((h: any) => ({
    roomType: h.room?.room_type?.name || 'Unknown',
    roomNumber: h.room?.room_number || '-',
    checkIn: h.check_in_date,
    checkOut: h.check_out_date,
    stayDuration: h.check_in_date && h.check_out_date
      ? Math.ceil((new Date(h.check_out_date).getTime() - new Date(h.check_in_date).getTime()) / (1000 * 60 * 60 * 24))
      : 0,
    totalSpend: h.total_price || 0,
  }));

  const recentHistory = trimmedHistory;

  const systemPrompt = `
Kamu adalah sebuah AI Co-Pilot tingkat lanjut di dalam Property Management System B2B.
Tugasmu menganalisis profil dan riwayat tamu, lalu memberikan 2 insight operasional/upselling yang sangat SPESIFIK dan BERAGAM kepada staf hotel.

DATA TAMU:
- Nama: ${guestData.full_name}
- Tier Loyalty: ${guestData.loyalty_tier} (Poin: ${guestData.loyalty_points || 0})
- Preferensi: ${(guestData.preferences as any)?.tags?.join(', ') || 'Belum ada data'}
- Total Kunjungan: ${historyData.length} kali
- Kunjungan Terakhir: ${JSON.stringify(recentHistory)}

ATURAN WAJIB (PELANGGARAN AKAN MENGAKIBATKAN ERROR SISTEM):
1. BAHASA: WAJIB menggunakan Bahasa Indonesia yang profesional, ringkas, dan langsung pada intinya (Maksimal 15 kata per insight).
2. DILARANG GENERIK: JANGAN PERNAH menyarankan "kirim email terima kasih", "tawarkan loyalty program", atau "tawarkan upgrade" tanpa alasan spesifik.
3. LOGIKA ANALISIS (Gunakan ini untuk variasi):
   - Jika Total Kunjungan = 1: Fokus pada impresi. (Contoh: "Tamu baru pertama kali menginap, tawarkan welcome drink spesial atau voucher diskon resto" -> iconType: 'star', color: 'teal')
   - Jika Total Kunjungan > 3: Analisis kebiasaannya. (Contoh: "Tamu sering memesan tipe Deluxe, informasikan bahwa kamarnya sudah disiapkan sesuai standar langganannya" -> iconType: 'bed', color: 'blue')
   - Jika Poin Loyalty Tinggi (>1000): (Contoh: "Poin tamu sudah ${guestData.loyalty_points}, ingatkan FO untuk menawarkan penukaran poin dengan layanan Spa" -> iconType: 'coin', color: 'violet')
   - Jika ada Preferensi Tertentu: (Contoh: "Pastikan kamar bebas asap rokok dan bantal tambahan sudah disiapkan sesuai preferensi" -> iconType: 'bolt', color: 'red')

ATURAN OUTPUT (STRICT JSON ARRAY):
Kamu HANYA BOLEH mengembalikan JSON array. Jangan ada teks markdown, pembuka, atau penutup.
[
  {
    "text": "Saran actionable dalam Bahasa Indonesia (String)",
    "color": "Warna sentimen: violet (upsell/revenue), teal (apresiasi/loyalty), red (mitigasi/peringatan), blue (info umum)",
    "iconType": "Pilih salah satu: sparkles, bolt, star, bed, coin"
  }
]
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Analisis dan berikan insight JSON sekarang.' },
      ],
      temperature: 0.4,
      max_tokens: 300,
    });

    const raw = response.choices[0]?.message?.content?.trim() || '[]';
    // Strip potential markdown fencing
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    // Validate & sanitize each insight
    return parsed.slice(0, 2).map((item: any) => ({
      text: String(item.text || ''),
      color: ['violet', 'teal', 'red', 'blue'].includes(item.color) ? item.color : 'violet',
      iconType: ['sparkles', 'bolt', 'star', 'bed', 'coin'].includes(item.iconType) ? item.iconType : 'sparkles',
    }));
  } catch (error) {
    console.error('AI Insights Error:', error);
    return [];
  }
}

// --- DELETE GUEST ---
export async function deleteGuestAction(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('guests')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/manager/guests');
  return { success: true };
}