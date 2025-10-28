// src/features/auth/hooks/useAuth.ts
'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/core/config/supabaseClient';
import { Profile, Role, UserRoleAssignment } from '@/core/types/database'; // Import Role and UserRoleAssignment

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
  profile: ProfileWithRoles | null; // Updated profile type
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    // Function to fetch profile and roles
    const fetchProfileAndRoles = async (userId: string): Promise<ProfileWithRoles | null> => {
      // Fetch profile first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) return null; // No profile found

      // Fetch user roles along with the role name using a join
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
        role_name: (ur.role as unknown as { name: string })?.name || undefined, // Type assertion for joined data
      }));


      // Combine profile and roles
      return {
        ...profileData,
        roles: rolesWithNames, // Assign the fetched roles
      };
    };

    const initializeAuth = async () => {
      try {
        setAuthState(prev => ({ ...prev, loading: true, error: null })); // Set loading true at start
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user && mounted) {
          const profileWithRoles = await fetchProfileAndRoles(session.user.id);
          if (mounted) {
            setAuthState({
              user: session.user,
              profile: profileWithRoles,
              loading: false,
              error: null,
            });
          }
        } else if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Auth Initialization Error:", error);
        if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: error instanceof Error ? error.message : 'An error occurred during auth initialization',
          });
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return; // Prevent state updates if unmounted

      setAuthState(prev => ({ ...prev, loading: true, error: null })); // Set loading on change
      try {
          if (session?.user) {
            const profileWithRoles = await fetchProfileAndRoles(session.user.id);
             if (mounted) {
                 setAuthState({
                    user: session.user,
                    profile: profileWithRoles,
                    loading: false,
                    error: null,
                });
             }
          } else {
             if (mounted) {
                 setAuthState({
                    user: null,
                    profile: null,
                    loading: false,
                    error: null,
                });
             }
          }
      } catch(error) {
          console.error("Auth State Change Error:", error);
           if (mounted) {
                setAuthState({
                    user: null,
                    profile: null,
                    loading: false,
                    error: error instanceof Error ? error.message : 'An error occurred processing auth change',
                });
           }
      }
    });

    // Cleanup function
    return () => {
      mounted = false;
      subscription?.unsubscribe(); // Check if subscription exists before unsubscribing
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return authState;
}