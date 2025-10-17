'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Stack, Anchor } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
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
    <Paper radius="md" p="xl" withBorder shadow="sm">
      <Title order={2} mb="xs">
        Create an Account
      </Title>
      <Text c="dimmed" size="sm" mb="xl">
        Join RoomMaster to manage your properties with ease.
      </Text>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          <TextInput
            label="Full Name"
            placeholder="John Doe"
            required
            {...form.getInputProps('fullName')}
            disabled={loading}
          />

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

          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm your password"
            required
            {...form.getInputProps('confirmPassword')}
            disabled={loading}
          />

          <Button type="submit" fullWidth loading={loading} size="md" mt="md">
            Register
          </Button>

          <Text c="dimmed" size="sm" ta="center">
            Already have an account?{' '}
            <Anchor component={Link} href="/auth/login" size="sm">
              Login here
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Paper>
  );
}