// src/features/auth/hooks/useAuth.ts
'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/core/config/supabaseClient';
import { Profile, UserRoleAssignment } from '@/core/types/database';
import { deleteCookie, setCookie } from 'cookies-next';

// Combine Profile with Role information
interface ProfileWithRoles extends Profile {
  roles: UserRoleAssignmentWithRoleName[]; // Store assigned roles here
}

// Interface to hold role assignment details along with role name
export interface UserRoleAssignmentWithRoleName extends UserRoleAssignment {
  [x: string]: any;
  role_name?: string; // Add role name for easier access
}

interface AuthState {
  user: User | null;
  profile: ProfileWithRoles | null;
  loading: boolean;
  error: string | null;
  // State tambahan untuk indikator impersonasi
  isImpersonating: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
    isImpersonating: false,
  });

  useEffect(() => {
    let mounted = true;

    // Function to fetch profile and roles
    const fetchProfileAndRoles = async (userId: string): Promise<ProfileWithRoles | null> => {
      // 1. Fetch profile first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) return null;

      // 2. Fetch user roles along with the role name using a join
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          *,
          role:roles (name)
        `)
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      // Map roles data to include role_name directly
      const rolesWithNames: UserRoleAssignmentWithRoleName[] = (userRolesData || []).map(ur => ({
        ...ur,
        role_name: (ur.role as unknown as { name: string })?.name || undefined,
      }));

      return {
        ...profileData,
        roles: rolesWithNames,
      };
    };

    const initializeAuth = async () => {
      try {
        if (mounted) setAuthState(prev => ({ ...prev, loading: true, error: null }));
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          // A. Ambil data user asli dari database
          const originalProfile = await fetchProfileAndRoles(session.user.id);
          
          if (!originalProfile) {
            if (mounted) {
              setAuthState({
                user: session.user,
                profile: null,
                loading: false,
                error: null,
                isImpersonating: false,
              });
            }
            return;
          }

          // B. Cek apakah sedang dalam mode IMPERSONASI (Login As)
          // Kita cek sessionStorage (Client side source of truth)
          const impersonationData = sessionStorage.getItem('impersonate_data');
          let finalProfile = originalProfile;
          let isImpersonating = false;

          if (impersonationData) {
            // Security Check: Pastikan user ASLI benar-benar Super Admin
            const isSuperAdmin = originalProfile.roles.some(r => r.role_name === 'Super Admin');
            
            if (isSuperAdmin) {
              const { hotelId, roleName } = JSON.parse(impersonationData);
              isImpersonating = true;

              // Buat Role Palsu (Mocked Role) untuk menggantikan role asli di session ini
              const mockedRole: UserRoleAssignmentWithRoleName = {
                id: 'temp_impersonate_id',
                user_id: session.user.id,
                role_id: 'temp_role_id',
                hotel_id: hotelId,
                role_name: roleName,
                created_at: new Date().toISOString(),
              };

              // Override profile dengan role palsu
              finalProfile = {
                ...originalProfile,
                roles: [mockedRole],
              };
            }
          }

          if (mounted) {
            setAuthState({
              user: session.user,
              profile: finalProfile,
              loading: false,
              error: null,
              isImpersonating: isImpersonating,
            });
          }

        } else {
          // Tidak ada session / user logout
          if (mounted) {
            setAuthState({
              user: null,
              profile: null,
              loading: false,
              error: null,
              isImpersonating: false,
            });
          }
        }
      } catch (error) {
        console.error("Auth Initialization Error:", error);
        if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: error instanceof Error ? error.message : 'An error occurred during auth initialization',
            isImpersonating: false,
          });
        }
      }
    };

    // Jalankan inisialisasi
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Trigger re-initialization on auth change
      initializeAuth();
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return authState;
}

// --- HELPER FUNCTIONS (Exported) ---

/**
 * Memulai sesi impersonasi (Login As).
 * Menyimpan target hotel dan role ke Cookies (untuk Server Component) 
 * dan sessionStorage (untuk Client Component), lalu me-refresh halaman.
 */
export const startImpersonation = (hotelId: string, roleName: string) => {
  if (typeof window !== 'undefined') {
    // 1. Simpan ke Client Storage (untuk UI Client side dan persistensi tab)
    sessionStorage.setItem('impersonate_data', JSON.stringify({ hotelId, roleName }));
    
    // 2. Simpan ke Cookies (agar Server Components di Next.js bisa membacanya)
    // Set expire 1 jam
    setCookie('impersonated_hotel_id', hotelId, { maxAge: 60 * 60 });
    setCookie('impersonated_role', roleName, { maxAge: 60 * 60 });

    // 3. Redirect ke dashboard yang sesuai
    if (roleName === 'Hotel Manager') window.location.href = '/manager/dashboard';
    else if (roleName === 'Front Office') window.location.href = '/fo/dashboard';
    else if (roleName === 'Hotel Admin') window.location.href = '/admin/dashboard';
    else window.location.reload(); 
  }
};

/**
 * Menghentikan sesi impersonasi.
 * Menghapus data dari sessionStorage dan Cookies, lalu kembali ke dashboard Super Admin.
 */
export const stopImpersonation = () => {
  if (typeof window !== 'undefined') {
    // Hapus data sesi client
    sessionStorage.removeItem('impersonate_data');
    
    // Hapus cookies server
    deleteCookie('impersonated_hotel_id');
    deleteCookie('impersonated_role');
    
    window.location.href = '/super-admin/dashboard';
  }
};