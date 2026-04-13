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
  if (!data.password) return { error: "Password is required for new users." };
  
  // Use a clean client instance to avoid overwriting the current session cookies
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 1. Create Auth User
  const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (authError) return { error: `Auth Error: ${authError.message}` };
  if (!authData.user) return { error: "Failed to create user account." };

  const supabase = await getSupabase();

  // 2. Create Profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: data.email,
      full_name: data.full_name,
    });

  if (profileError) return { error: `Profile Error: ${profileError.message}` };

  // 3. Assign Role if provided
  if (data.role_id) {
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role_id: data.role_id,
        hotel_id: data.hotel_id || null,
      });

    if (roleError) return { error: `Role Error: ${roleError.message}` };
  }

  revalidatePath('/admin/staff');
  return { success: true };
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

  revalidatePath('/admin/staff');
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

  revalidatePath('/admin/staff');
  return { success: true };
}