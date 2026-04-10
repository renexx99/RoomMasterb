'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();
  // @ts-ignore
  return createServerActionClient({ cookies: () => cookieStore });
}

export async function reportIssue(data: {
  hotelId: string;
  roomId: string;
  category: string;
  description: string;
  severity: string;
}) {
  const supabase = await getSupabase();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: 'Not authenticated' };

  const { error } = await supabase.from('maintenance_reports').insert({
    hotel_id: data.hotelId,
    room_id: data.roomId,
    reported_by: session.user.id,
    category: data.category,
    description: data.description,
    severity: data.severity,
    status: 'open',
  });

  if (error) return { error: `Failed to submit report: ${error.message}` };

  revalidatePath('/housekeeping/report');
  revalidatePath('/housekeeping/dashboard');
  return { success: true };
}

export async function getMyReports(hotelId: string) {
  const supabase = await getSupabase();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: 'Not authenticated', reports: [] };

  const { data, error } = await supabase
    .from('maintenance_reports')
    .select(`
      *,
      room:rooms(id, room_number, room_type:room_types(id, name))
    `)
    .eq('hotel_id', hotelId)
    .eq('reported_by', session.user.id)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) return { error: error.message, reports: [] };
  return { reports: data || [] };
}
