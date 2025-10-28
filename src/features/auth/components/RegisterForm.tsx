// src/features/auth/components/RegisterForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Stack, Anchor, Divider, Box } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconMail, IconLock, IconUser, IconUserPlus, IconBuildingSkyscraper } from '@tabler/icons-react';
import { supabase } from '@/core/config/supabaseClient';
import Link from 'next/link';

interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
    },
    validate: {
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Invalid email format';
        return null;
      },
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return null;
      },
      confirmPassword: (value, values) => {
        if (!value) return 'Please confirm your password';
        if (value !== values.password) return 'Passwords do not match';
        return null;
      },
      fullName: (value) => {
        if (!value) return 'Full name is required';
        if (value.length < 2) return 'Full name must be at least 2 characters';
        return null;
      },
    },
  });

  const handleSubmit = async (values: RegisterFormValues) => {
    setLoading(true);

    try {
      // 1. Sign up the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (authError) {
        // Handle specific auth errors if needed (e.g., email already exists)
        if (authError.message.includes("User already registered")) {
           throw new Error("This email is already registered.");
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account.');
      }

      // 2. Create the corresponding profile in the 'profiles' table
      //    NO role or hotel_id is assigned here by default.
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: values.email,
        full_name: values.fullName,
        // 'role' column is intentionally omitted or set to null if required by schema
        // 'hotel_id' is null by default
      });

      if (profileError) {
         // If profile creation fails, potentially try to clean up the auth user?
         // This is complex, maybe just log the error and inform the user.
        console.error("Profile creation failed after signup:", profileError);
        throw new Error(`Account created, but profile setup failed. Please contact support. Error: ${profileError.message}`);
      }

      notifications.show({
        title: 'Success',
        message: 'Account created! Please check your email to confirm your address. A Super Admin needs to assign your role before you can log in.',
        color: 'green',
        autoClose: 10000, // Longer duration for this message
      });

      // Redirect to login page after successful signup
      router.push('/auth/login');

    } catch (error) {
      console.error('Registration error:', error);

      let errorMessage = 'Failed to create account';
      if (error instanceof Error) {
        errorMessage = error.message; // Use the specific error message
      }

      notifications.show({
        title: 'Registration Error',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- JSX remains the same ---
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
      {/* Header with Logo */}
      <Stack gap="md" mb="xl" align="center">
        <Box
          style={{
            width: 60,
            height: 60,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
          }}
        >
          <IconBuildingSkyscraper
            size={30}
            stroke={1.5}
            color="white"
          />
        </Box>

        <Stack gap="xs" align="center">
          <Title
            order={2}
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#1a1a1a',
              textAlign: 'center',
            }}
          >
            Create Account
          </Title>
          <Text
            c="dimmed"
            size="sm"
            ta="center"
            style={{
              fontSize: '0.95rem',
            }}
          >
            Join RoomMaster to manage your properties with ease
          </Text>
        </Stack>
      </Stack>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* Full Name Input */}
          <TextInput
            label="Full Name"
            placeholder="John Doe"
            required
            leftSection={<IconUser size={18} stroke={1.5} />}
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
            {...form.getInputProps('fullName')}
            disabled={loading}
            suppressHydrationWarning
          />

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
            placeholder="Create a strong password"
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

          {/* Confirm Password Input */}
          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm your password"
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
            {...form.getInputProps('confirmPassword')}
            disabled={loading}
            suppressHydrationWarning
          />

          {/* Register Button */}
          <Button
            type="submit"
            fullWidth
            loading={loading}
            size="md"
            radius="md"
            leftSection={!loading && <IconUserPlus size={18} />}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              height: '48px',
              fontSize: '1rem',
              fontWeight: 600,
              marginTop: '1rem',
            }}
            suppressHydrationWarning
          >
            Create Account
          </Button>

          {/* Divider */}
          <Divider
            label="Already have an account?"
            labelPosition="center"
            my="xs"
          />

          {/* Login Link */}
          <Text
            c="dimmed"
            size="sm"
            ta="center"
          >
            <Anchor
              component={Link}
              href="/auth/login"
              fw={600}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Sign in to your account
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Paper>
  );
}