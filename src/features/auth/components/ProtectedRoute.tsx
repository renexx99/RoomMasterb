'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Center, Loader, Box, Text } from '@mantine/core';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserRole } from '@/core/types/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        router.push('/auth/login');
        return;
      }

      if (requiredRole && profile.role !== requiredRole) {
        if (profile.role === 'super_admin') {
          router.push('/super-admin/dashboard');
        } else if (profile.role === 'hotel_admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
      }
    }
  }, [user, profile, loading, requiredRole, router]);

  if (loading) {
    return (
      <Box
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Center>
          <Loader size="xl" />
        </Center>
      </Box>
    );
  }

  if (!user || !profile) {
    return (
      <Box
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text>Redirecting to login...</Text>
      </Box>
    );
  }

  if (requiredRole && profile.role !== requiredRole) {
    return (
      <Box
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text>Redirecting...</Text>
      </Box>
    );
  }

  return <>{children}</>;
}
