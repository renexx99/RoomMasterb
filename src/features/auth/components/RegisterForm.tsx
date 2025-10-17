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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: values.email,
        full_name: values.fullName,
        role: 'hotel_admin',
        hotel_id: null,
      });

      if (profileError) {
        throw profileError;
      }

      notifications.show({
        title: 'Success',
        message: 'Account created successfully! Please check your email to confirm.',
        color: 'green',
      });

      router.push('/auth/login');
    } catch (error) {
      console.error('Registration error:', error);

      let errorMessage = 'Failed to create account';
      if (error instanceof Error) {
        if (error.message.includes('already registered')) {
          errorMessage = 'This email is already registered';
        } else {
          errorMessage = error.message;
        }
      }

      notifications.show({
        title: 'Error',
        message: errorMessage,
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
              },
              label: {
                fontWeight: 500,
                marginBottom: '0.5rem',
              },
            }}
            {...form.getInputProps('fullName')}
            disabled={loading}
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
              },
              label: {
                fontWeight: 500,
                marginBottom: '0.5rem',
              },
            }}
            {...form.getInputProps('email')}
            disabled={loading}
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
              },
              label: {
                fontWeight: 500,
                marginBottom: '0.5rem',
              },
            }}
            {...form.getInputProps('password')}
            disabled={loading}
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
              },
              label: {
                fontWeight: 500,
                marginBottom: '0.5rem',
              },
            }}
            {...form.getInputProps('confirmPassword')}
            disabled={loading}
          />

          {/* Terms and Conditions */}
          <Text size="xs" c="dimmed" ta="center">
            By creating an account, you agree to our{' '}
            <Anchor size="xs" fw={500}>Terms of Service</Anchor>
            {' '}and{' '}
            <Anchor size="xs" fw={500}>Privacy Policy</Anchor>
          </Text>

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
            }}
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