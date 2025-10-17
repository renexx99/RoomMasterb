'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Stack, Anchor, Divider } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconMail, IconLock, IconLogin } from '@tabler/icons-react';
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

      if (profile.role === 'hotel_admin' && !profile.hotel_id) {
        await supabase.auth.signOut();
        throw new Error('Akun Anda belum diaktifkan oleh Super Admin. Mohon tunggu hingga hotel Anda ditentukan.');
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
              },
              label: {
                fontWeight: 500,
                marginBottom: '0.5rem',
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
              },
              label: {
                fontWeight: 500,
                marginBottom: '0.5rem',
              },
            }}
            {...form.getInputProps('password')}
            disabled={loading}
            suppressHydrationWarning
          />

          {/* Forgot Password Link */}
          <Anchor 
            component="button" 
            type="button" 
            c="dimmed" 
            size="sm"
            ta="right"
            style={{
              marginTop: '-0.5rem',
            }}
          >
            Forgot password?
          </Anchor>

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
              marginTop: '0.5rem',
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