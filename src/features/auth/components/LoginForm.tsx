// src/features/auth/components/LoginForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Stack, Anchor, Divider } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconMail, IconLock, IconLogin } from '@tabler/icons-react';
import { supabase } from '@/core/config/supabaseClient';
import Link from 'next/link';
import { UserRoleAssignmentWithRoleName } from '../hooks/useAuth'; // Import the interface

interface LoginFormValues {
  email: string;
  password: string;
}

// Define roles that require a hotel assignment to function
const ROLES_REQUIRING_HOTEL = ['Hotel Admin', 'Hotel Manager', 'Front Office']; // Add other roles as needed

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Invalid email format';
        return null;
      },
      password: (value) => {
        if (!value) return 'Password is required';
        // Password length check can be less strict here as it's just login
        return null;
      },
    },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      // 1. Sign in the user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (authError) {
         // Provide more specific feedback for invalid credentials
         if (authError.message.includes("Invalid login credentials")) {
             throw new Error("Invalid email or password.");
         }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Authentication failed. User data not found.');
      }

      // 2. Fetch the user's roles from the 'user_roles' table, joining with 'roles'
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          hotel_id,
          role:roles (name)
        `)
        .eq('user_id', authData.user.id);

      if (rolesError) {
        console.error("Error fetching user roles:", rolesError);
        throw new Error('Could not retrieve user role information.');
      }

       // Map to the structure expected by useAuth/ProtectedRoute, adding role_name
      const roles: UserRoleAssignmentWithRoleName[] = (userRolesData || []).map(ur => ({
          id: '', // Placeholder, adjust if needed
          user_id: authData.user.id,
          role_id: '', // Placeholder, adjust if needed
          created_at: '', // Placeholder, adjust if needed
          hotel_id: ur.hotel_id,
          role_name: (ur.role as unknown as { name: string })?.name || 'Unknown Role', // Handle potential null role join
      }));


      // 3. Check for role assignment and required hotel_id
      if (!roles || roles.length === 0) {
        await supabase.auth.signOut(); // Log out user if no roles assigned
        throw new Error('Your account has not been assigned a role yet. Please contact the Super Admin.');
      }

      // Find the primary role (e.g., Super Admin takes precedence)
      const superAdminRole = roles.find(r => r.role_name === 'Super Admin');
      const hotelSpecificRole = roles.find(r => ROLES_REQUIRING_HOTEL.includes(r.role_name || ''));

       let assignedHotelId: string | null = null;
       let effectiveRoleName: string | undefined = undefined;

       if (superAdminRole) {
           effectiveRoleName = 'Super Admin';
           // Super Admin doesn't strictly need a hotel_id for global access
       } else if (hotelSpecificRole) {
           if (!hotelSpecificRole.hotel_id) {
               await supabase.auth.signOut(); // Log out if required hotel_id is missing
               throw new Error(`Your role (${hotelSpecificRole.role_name}) requires a hotel assignment. Please contact the Super Admin.`);
           }
           effectiveRoleName = hotelSpecificRole.role_name;
           assignedHotelId = hotelSpecificRole.hotel_id;
       } else {
           // Handle cases with other roles if necessary, or deny login if no recognized operational role
           await supabase.auth.signOut();
           throw new Error('Your assigned role does not permit login to this application.');
       }


      notifications.show({
        title: 'Success',
        message: 'Logged in successfully!',
        color: 'green',
      });

      // 4. Redirect based on the effective role
      if (effectiveRoleName === 'Super Admin') {
        router.push('/super-admin/dashboard');
      } else if (assignedHotelId && ROLES_REQUIRING_HOTEL.includes(effectiveRoleName || '')) {
         // Redirect hotel-specific roles to the general admin dashboard
         // The specific hotel context will be managed within the admin section via useAuth
        router.push('/admin/dashboard');
      } else {
         // Fallback or handle other roles
         console.warn("User logged in but has an unhandled role:", effectiveRoleName);
         router.push('/'); // Redirect to a default page or show an error
      }

    } catch (error) {
      console.error('Login error:', error);
      notifications.show({
        title: 'Login Failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred during login.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- JSX remains largely the same ---
  return (
    <Paper
      radius="xl"
      p="xl"
      shadow="xl"
      withBorder
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Header */}
      <Stack gap="xs" mb="xl">
        <Title
          order={2}
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#1a1a1a',
          }}
        >
          Welcome Back
        </Title>
        <Text
          c="dimmed"
          size="sm"
          style={{
            fontSize: '0.95rem',
          }}
        >
          Enter your credentials to access your account
        </Text>
      </Stack>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* Email Input */}
          <TextInput
            label="Email Address"
            placeholder="your@email.com"
            required
            leftSection={<IconMail size={18} stroke={1.5} />}
            size="md"
            radius="md"
            styles={{
              input: {
                fontSize: '0.95rem',
                padding: '1.5rem 1rem 1.5rem 2.5rem',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                color: '#343a40',
              },
              label: {
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: '#212529',
              },
            }}
            {...form.getInputProps('email')}
            disabled={loading}
            suppressHydrationWarning
          />

          {/* Password Input */}
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            leftSection={<IconLock size={18} stroke={1.5} />}
            size="md"
            radius="md"
            styles={{
              input: {
                fontSize: '0.95rem',
                padding: '1.5rem 1rem 1.5rem 2.5rem',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                color: '#343a40',
              },
              label: {
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: '#212529',
              },
            }}
            {...form.getInputProps('password')}
            disabled={loading}
            suppressHydrationWarning
          />

          {/* Login Button */}
          <Button
            type="submit"
            fullWidth
            loading={loading}
            size="md"
            radius="md"
            leftSection={!loading && <IconLogin size={18} />}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              height: '48px',
              fontSize: '1rem',
              fontWeight: 600,
              marginTop: '1.5rem',
            }}
            suppressHydrationWarning
          >
            Sign In
          </Button>

          {/* Divider */}
          <Divider
            label="Or continue with"
            labelPosition="center"
            my="sm"
          />

          {/* Register Link */}
          <Text
            c="dimmed"
            size="sm"
            ta="center"
            style={{
              marginTop: '0.5rem',
            }}
          >
            Don&apos;t have an account?{' '}
            <Anchor
              component={Link}
              href="/auth/register"
              fw={600}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Create account
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Paper>
  );
}