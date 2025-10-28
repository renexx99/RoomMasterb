// src/features/auth/components/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Center, Loader, Box, Text } from '@mantine/core';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
// UserRole type might not be needed directly if we check role names as strings
// import { UserRole } from '@/core/types/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoleName?: string; // Change to check role name string (e.g., 'Super Admin', 'Hotel Admin')
}

// Define roles that access the '/admin' path
const ADMIN_PATH_ROLES = ['Hotel Admin', 'Hotel Manager', 'Front Office']; // Add roles as needed

export function ProtectedRoute({ children, requiredRoleName }: ProtectedRouteProps) {
  const { user, profile, loading, error } = useAuth(); // Include error state
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Don't do anything while loading

    // If loading finished and there's an error (e.g., failed to fetch roles)
    if (error) {
       console.error("Auth error in ProtectedRoute:", error);
       notifications.show({ // Show error notification
           title: "Authentication Error",
           message: "Could not verify your access. Please try logging in again.",
           color: "red",
       });
       supabase.auth.signOut(); // Attempt to sign out
       router.push('/auth/login'); // Redirect to login
       return;
    }


    // If not loading and no user/profile, redirect to login
    if (!user || !profile) {
      router.push('/auth/login');
      return;
    }

    // Check if the user has the required role
    const hasRequiredRole = requiredRoleName
      ? profile.roles?.some(role => role.role_name === requiredRoleName)
      : true; // If no requiredRoleName is specified, allow access if logged in

    if (!hasRequiredRole) {
      console.warn(`User does not have required role: ${requiredRoleName}. Roles:`, profile.roles);
      // Redirect logic based on existing roles if the required one isn't present
      const isSuperAdmin = profile.roles?.some(r => r.role_name === 'Super Admin');
      const hasAdminPathRole = profile.roles?.some(r => ADMIN_PATH_ROLES.includes(r.role_name || '') && r.hotel_id);

      if (isSuperAdmin) {
        router.push('/super-admin/dashboard');
      } else if (hasAdminPathRole) {
         router.push('/admin/dashboard');
      } else {
         // Fallback if user has roles but not the required one AND not super/hotel admin
         notifications.show({
            title: "Access Denied",
            message: "You do not have permission to access this page.",
            color: "orange",
        });
        // Optionally sign out or redirect to a generic page
        // supabase.auth.signOut();
        router.push('/'); // Or '/auth/login'
      }
      return; // Stop further execution in this effect run
    }

    // Specific check for hotel-specific roles trying to access non-super-admin routes without a hotel_id
    // This should ideally be caught during login, but as a safeguard:
    const requiresHotel = profile.roles?.some(r => ADMIN_PATH_ROLES.includes(r.role_name || ''));
    const assignedHotelId = profile.roles?.find(r => ADMIN_PATH_ROLES.includes(r.role_name || ''))?.hotel_id;

    if (requiresHotel && !assignedHotelId && requiredRoleName !== 'Super Admin') {
        console.error("User with hotel role but no assigned hotel_id reached ProtectedRoute.");
         notifications.show({
            title: "Configuration Error",
            message: "Your account is missing a hotel assignment. Please contact the Super Admin.",
            color: "red",
        });
        supabase.auth.signOut();
        router.push('/auth/login');
    }


  }, [user, profile, loading, requiredRoleName, router, error]); // Add error to dependency array

  // --- Loading State ---
  if (loading) {
    return (
      <Box style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Center> <Loader size="xl" /> </Center>
      </Box>
    );
  }

  // --- Redirecting States ---
  // If redirecting due to lack of user/profile or role mismatch (handled by useEffect)
  if (!loading && (!user || !profile || (requiredRoleName && !profile.roles?.some(role => role.role_name === requiredRoleName)))) {
    return (
      <Box style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text>Redirecting...</Text>
      </Box>
    );
  }

  // --- Render Children ---
  // If loading is done, user/profile exist, and role check passes
  return <>{children}</>;
}