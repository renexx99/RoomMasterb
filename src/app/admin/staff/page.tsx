// src/app/admin/staff/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import StaffManagementClient from './client';
import { Profile, Role, UserRoleAssignment } from '@/core/types/database';

export interface StaffMember extends Profile {
  assignment?: UserRoleAssignment & {
    role_name?: string;
  };
}

export default async function StaffPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // 1. Cek User
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/auth/login');

  // --- LOGIKA IMPERSONASI ---
  let hotelId: string | null = null;

  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('*, role:roles(name)')
    .eq('user_id', user.id);

  const isSuperAdmin = userRoles?.some((ur: any) => ur.role?.name === 'Super Admin');

  if (isSuperAdmin) {
    const impersonatedId = cookieStore.get('impersonated_hotel_id')?.value;
    if (impersonatedId) {
      hotelId = impersonatedId;
    } else {
      redirect('/super-admin/dashboard');
    }
  } else {
    const adminRole = userRoles?.find((ur: any) => 
      ur.hotel_id && 
      ['Hotel Admin', 'Hotel Manager'].includes(ur.role?.name || '')
    );
    hotelId = adminRole?.hotel_id || null;
  }
  // --- AKHIR LOGIKA IMPERSONASI ---

  if (!hotelId) {
    return <StaffManagementClient initialStaff={[]} availableRoles={[]} hotelId={null} />;
  }

  // 3. Fetch Data Secara Paralel
  const [rolesRes, staffRes] = await Promise.all([
    // a. Ambil Roles yang relevan untuk operasional hotel
    supabase
      .from('roles')
      .select('*')
      .in('name', ['Hotel Admin', 'Hotel Manager', 'Front Office', 'Housekeeping Supervisor'])
      .order('name', { ascending: true }),

    // b. Ambil Staf (User Roles di hotel ini join Profiles dan Roles)
    supabase
      .from('user_roles')
      .select(`
        *,
        profile:profiles(*),
        role:roles(*)
      `)
      .eq('hotel_id', hotelId)
  ]);

  const roles = (rolesRes.data as Role[]) || [];
  const rawStaff = staffRes.data || [];

  // 4. Transformasi Data Staf agar sesuai interface StaffMember
  const formattedStaff: StaffMember[] = rawStaff
    .filter((item) => item.profile) // Pastikan profile ada
    .map((item) => {
      const profile = item.profile as Profile;
      const role = item.role as Role;
      
      return {
        ...profile,
        assignment: {
          id: item.id,
          user_id: item.user_id,
          role_id: item.role_id,
          hotel_id: item.hotel_id,
          created_at: item.created_at,
          role_name: role?.name || 'Unknown Role',
        },
      };
    });

  return (
    <StaffManagementClient 
      initialStaff={formattedStaff} 
      availableRoles={roles} 
      hotelId={hotelId} 
    />
  );
}