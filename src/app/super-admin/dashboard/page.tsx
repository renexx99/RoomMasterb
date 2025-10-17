'use client';

import { Container, Title, Text, Paper, Group, Button, Card, Grid, Badge, SimpleGrid, Stack, Box } from '@mantine/core';
import { IconLogout, IconUser, IconShieldCheck, IconBuilding, IconUsers, IconTrendingUp } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { useEffect, useState } from 'react';

interface DashboardStats {
  totalHotels: number;
  totalAdmins: number;
  unassignedAdmins: number;
}

function SuperAdminDashboardContent() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalHotels: 0,
    totalAdmins: 0,
    unassignedAdmins: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total hotels
        const { count: hotelCount } = await supabase
          .from('hotels')
          .select('*', { count: 'exact', head: true });

        // Fetch total hotel admins
        const { count: adminCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'hotel_admin');

        // Fetch unassigned admins
        const { count: unassignedCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'hotel_admin')
          .is('hotel_id', null);

        setStats({
          totalHotels: hotelCount || 0,
          totalAdmins: adminCount || 0,
          unassignedAdmins: unassignedCount || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

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
      {/* Header */}
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

      <Container size="lg" py="xl">
        {/* Statistics Cards */}
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="xl">
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <div>
                <Text fw={500} size="sm" c="dimmed">
                  Total Hotels
                </Text>
                <Text fw={700} size="xl" mt="xs">
                  {stats.totalHotels}
                </Text>
              </div>
              <IconBuilding size={32} stroke={1.5} opacity={0.7} />
            </Group>
            <Button
              variant="light"
              fullWidth
              mt="md"
              onClick={() => router.push('/super-admin/hotels')}
            >
              Manage Hotels
            </Button>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <div>
                <Text fw={500} size="sm" c="dimmed">
                  Hotel Admins
                </Text>
                <Text fw={700} size="xl" mt="xs">
                  {stats.totalAdmins}
                </Text>
              </div>
              <IconUsers size={32} stroke={1.5} opacity={0.7} />
            </Group>
            <Button
              variant="light"
              fullWidth
              mt="md"
              onClick={() => router.push('/super-admin/users')}
            >
              Manage Users
            </Button>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <div>
                <Text fw={500} size="sm" c="dimmed">
                  Unassigned Admins
                </Text>
                <Text fw={700} size="xl" mt="xs" c="orange">
                  {stats.unassignedAdmins}
                </Text>
              </div>
              <Badge color="orange" variant="light" p="lg">
                <IconTrendingUp size={20} />
              </Badge>
            </Group>
            <Button
              variant="light"
              fullWidth
              mt="md"
              color="orange"
              onClick={() => router.push('/super-admin/users')}
            >
              Assign Hotels
            </Button>
          </Card>
        </SimpleGrid>

        {/* Profile Information */}
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
                <Text size="sm" c="dimmed">
                  Name
                </Text>
                <Text fw={500} mb="sm">
                  {profile.full_name}
                </Text>

                <Text size="sm" c="dimmed">
                  Email
                </Text>
                <Text fw={500} mb="sm">
                  {profile.email}
                </Text>

                <Text size="sm" c="dimmed">
                  Role
                </Text>
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
                System Overview
              </Title>
              <Text c="dimmed" mb="lg">
                As a Super Admin, you have full access to manage all aspects of the Property Management System.
              </Text>

              <Stack gap="md">
                <Box>
                  <Text fw={500} mb="sm">
                    Quick Actions
                  </Text>
                  <Group>
                    <Button
                      variant="default"
                      onClick={() => router.push('/super-admin/hotels')}
                    >
                      Hotels Management
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => router.push('/super-admin/users')}
                    >
                      User Management
                    </Button>
                  </Group>
                </Box>

                <Box>
                  <Text fw={500} size="sm" c="dimmed">
                    System Status: All systems operational ✓
                  </Text>
                </Box>
              </Stack>
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