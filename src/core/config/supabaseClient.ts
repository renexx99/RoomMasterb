// src/core/config/supabaseClient.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// createClientComponentClient secara otomatis membaca env vars:
// NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
// dan mengonfigurasi penyimpanan sesi menggunakan Cookies.

export const supabase = createClientComponentClient();