'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/core/config/supabaseClient';
import { Profile } from '@/core/types/database';

interface AuthState {
  user: User | null;
  profile: Profile | null;
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

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user && mounted) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) throw profileError;

          setAuthState({
            user: session.user,
            profile: profile,
            loading: false,
            error: null,
          });
        } else if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: error instanceof Error ? error.message : 'An error occurred',
          });
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user && mounted) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          setAuthState({
            user: session.user,
            profile: profile,
            loading: false,
            error: null,
          });
        } else if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: null,
          });
        }
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return authState;
}
