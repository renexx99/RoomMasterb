'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerActionClient({ cookies: () => cookieStore as any });
}

export interface UserFormData {
  email: string;
  full_name: string;
  role_id: string;
  hotel_id?: string;
  password?: string;
}

// --- CREATE USER ---
export async function createUserAction(data: UserFormData) {
  // NOTE: This currently simulates DB insertion.
  // Real implementation requires Supabase Service Role for Auth User creation.
  
  return { error: "User creation feature requires Service Role configuration. Please use the Register page for now." };
}

// --- UPDATE USER ---
export async function updateUserAction(userId: string, data: Partial<UserFormData>) {
  const supabase = await getSupabase();

  // 1. Update Profile Name
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: data.full_name })
    .eq('id', userId);

  if (profileError) return { error: `Failed to update profile: ${profileError.message}` };

  // 2. Update Role & Hotel
  if (data.role_id) {
    // Strategy: Delete old role, insert new one (ensure 1 active role)
    
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteError) return { error: `Failed to clear old roles: ${deleteError.message}` };

    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: data.role_id,
        hotel_id: data.hotel_id || null,
      });

    if (insertError) return { error: `Failed to assign new role: ${insertError.message}` };
  }

  revalidatePath('/super-admin/users');
  return { success: true };
}

// --- DELETE USER ---
export async function deleteUserAction(id: string) {
  const supabase = await getSupabase();

  // Delete roles first (if not cascaded)
  await supabase.from('user_roles').delete().eq('user_id', id);
  
  // Delete profile
  const { error } = await supabase.from('profiles').delete().eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/super-admin/users');
  return { success: true };
}