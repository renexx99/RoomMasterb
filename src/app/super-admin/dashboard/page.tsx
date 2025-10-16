'use client';

import { Container, Title, Text, Paper, Group, Button, Card, Grid, Badge } from '@mantine/core';
import { IconLogout, IconUser, IconShieldCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

function SuperAdminDashboardContent() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      notifications.show({
        title: 'Success',
        message: 'Logged out successfully',
        color: 'green',
      });

      router.push('/auth/login');
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to logout',
        color: 'red',
      });
    }
  };

  if (loading || !profile) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem 0' }}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <div>
              <Title order={1} c="white" mb="xs">
                Super Admin Dashboard
              </Title>
              <Text c="white" size="lg" opacity={0.9}>
                Welcome back, {profile.full_name}
              </Text>
            </div>
            <Button
              leftSection={<IconLogout size={18} />}
              variant="white"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Group>
        </Container>
      </div>

      <Container size="lg" mt="xl">
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text fw={500}>Profile Information</Text>
                <IconUser size={20} />
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Your account details
              </Text>
              <div style={{ marginTop: '1rem' }}>
                <Text size="sm" c="dimmed">Name</Text>
                <Text fw={500} mb="sm">{profile.full_name}</Text>

                <Text size="sm" c="dimmed">Email</Text>
                <Text fw={500} mb="sm">{profile.email}</Text>

                <Text size="sm" c="dimmed">Role</Text>
                <Badge color="violet" variant="light" mt="xs">
                  <Group gap="xs">
                    <IconShieldCheck size={14} />
                    {profile.role.replace('_', ' ').toUpperCase()}
                  </Group>
                </Badge>
              </div>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper shadow="sm" p="lg" radius="md" withBorder>
              <Title order={3} mb="md">
                Welcome to RoomMaster
              </Title>
              <Text c="dimmed" mb="lg">
                As a Super Admin, you have full access to manage all aspects of the Property Management System.
              </Text>

              <div style={{ marginTop: '2rem' }}>
                <Title order={4} mb="md">Quick Access</Title>
                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Card p="md" radius="md" withBorder style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
                      <Text fw={500} mb="xs">Manage Hotels</Text>
                      <Text size="sm" c="dimmed">
                        View and manage all registered hotels in the system
                      </Text>
                    </Card>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Card p="md" radius="md" withBorder style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
                      <Text fw={500} mb="xs">User Management</Text>
                      <Text size="sm" c="dimmed">
                        Manage admin users and their permissions
                      </Text>
                    </Card>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Card p="md" radius="md" withBorder style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
                      <Text fw={500} mb="xs">System Settings</Text>
                      <Text size="sm" c="dimmed">
                        Configure system-wide settings and preferences
                      </Text>
                    </Card>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Card p="md" radius="md" withBorder style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
                      <Text fw={500} mb="xs">Reports</Text>
                      <Text size="sm" c="dimmed">
                        View analytics and generate system reports
                      </Text>
                    </Card>
                  </Grid.Col>
                </Grid>
              </div>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </div>
  );
}

export default function SuperAdminDashboard() {
  return (
    <ProtectedRoute requiredRole="super_admin">
      <SuperAdminDashboardContent />
    </ProtectedRoute>
  );
}
