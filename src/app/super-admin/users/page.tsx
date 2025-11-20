import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import UsersManagementClient, { UserWithRoles } from './client'; // Import tipe

export default async function UsersPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // 1. Fetch Profiles + Relasi ke user_roles (dan join ke roles + hotels)
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`
        *,
        user_roles (
            role_id,
            hotel_id,
            roles ( id, name ),
            hotels ( id, name )
        )
    `)
    .order('created_at', { ascending: false });

  // 2. Fetch Master Data untuk Dropdown
  const { data: hotels } = await supabase.from('hotels').select('id, name').order('name');
  const { data: roles } = await supabase.from('roles').select('id, name').order('name');

  if (error) {
    console.error("Error loading users:", error);
    return <div>Error loading users</div>;
  }

  // Casting ke UserWithRoles agar sesuai dengan Tipe di Client
  const typedProfiles = (profiles as any[]) as UserWithRoles[];

  return (
    <UsersManagementClient 
      initialUsers={typedProfiles || []} 
      hotels={hotels || []} 
      roles={roles || []}
    />
  );
}