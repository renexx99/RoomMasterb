'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Stack, Anchor } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import Link from 'next/link';

interface LoginFormValues {
  email: string;
  password: string;
}

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
        if (value.length < 6) return 'Password must be at least 6 characters';
        return null;
      },
    },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Authentication failed');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        throw new Error('Profile not found');
      }

      notifications.show({
        title: 'Success',
        message: 'Logged in successfully',
        color: 'green',
      });

      if (profile.role === 'super_admin') {
        router.push('/super-admin/dashboard');
      } else if (profile.role === 'hotel_admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to login',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper radius="md" p="xl" withBorder>
      <Title order={2} mb="md">
        Welcome to RoomMaster
      </Title>
      <Text c="dimmed" size="sm" mb="lg">
        Enter your credentials to access your account
      </Text>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Email"
            placeholder="your@email.com"
            required
            {...form.getInputProps('email')}
            disabled={loading}
          />

          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            {...form.getInputProps('password')}
            disabled={loading}
          />

          <Button type="submit" fullWidth loading={loading} size="md">
            Login
          </Button>

          <Text c="dimmed" size="sm" ta="center">
            Don&apos;t have an account?{' '}
            <Anchor component={Link} href="/auth/register" size="sm">
              Register here
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Paper>
  );
}
