'use client';

import { Container, Title, Text, Card, Grid, Badge, SimpleGrid, Stack, Group, Paper } from '@mantine/core';
import { IconBuilding, IconUsers, IconTrendingUp, IconShieldCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/core/config/supabaseClient';

interface DashboardStats {
  totalHotels: number;
  totalAdmins: number;
  unassignedAdmins: number;
}

export default function SuperAdminDashboard() {
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
        const { count: hotelCount } = await supabase
          .from('hotels')
          .select('*', { count: 'exact', head: true });

        const { count: adminCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'hotel_admin');

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

  return (
    <Container size="lg">
      <Stack gap="xl">
        <div>
          <Title order={2} mb="xs">
            Dashboard
          </Title>
          <Text c="dimmed">Selamat datang di Super Admin Dashboard</Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => router.push('/super-admin/hotels')}
          >
            <Group justify="space-between" mb="md">
              <div>
                <Text size="sm" c="dimmed" fw={500}>
                  Total Hotel
                </Text>
                <Text size="xl" fw={700} mt="xs">
                  {stats.totalHotels}
                </Text>
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'rgba(102, 126, 234, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconBuilding size={24} stroke={1.5} color="#667eea" />
              </div>
            </Group>
            <Text size="xs" c="dimmed">
              Klik untuk kelola hotel
            </Text>
          </Card>

          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => router.push('/super-admin/users')}
          >
            <Group justify="space-between" mb="md">
              <div>
                <Text size="sm" c="dimmed" fw={500}>
                  Hotel Admin
                </Text>
                <Text size="xl" fw={700} mt="xs">
                  {stats.totalAdmins}
                </Text>
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'rgba(102, 126, 234, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconUsers size={24} stroke={1.5} color="#667eea" />
              </div>
            </Group>
            <Text size="xs" c="dimmed">
              Klik untuk kelola user
            </Text>
          </Card>

          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => router.push('/super-admin/users')}
          >
            <Group justify="space-between" mb="md">
              <div>
                <Text size="sm" c="dimmed" fw={500}>
                  Admin Belum Ditugaskan
                </Text>
                <Text size="xl" fw={700} mt="xs" c="orange">
                  {stats.unassignedAdmins}
                </Text>
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'rgba(250, 152, 78, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconTrendingUp size={24} stroke={1.5} color="#fa984e" />
              </div>
            </Group>
            <Text size="xs" c="dimmed">
              Admin tanpa hotel
            </Text>
          </Card>
        </SimpleGrid>

        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper shadow="sm" p="lg" radius="md" withBorder>
              <Group mb="md">
                <IconShieldCheck size={24} stroke={1.5} color="#667eea" />
                <Title order={4}>Status Sistem</Title>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Semua sistem berjalan normal
              </Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Database</Text>
                  <Badge color="green" variant="light">
                    Online
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Authentication</Text>
                  <Badge color="green" variant="light">
                    Active
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">API Services</Text>
                  <Badge color="green" variant="light">
                    Running
                  </Badge>
                </Group>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper shadow="sm" p="lg" radius="md" withBorder>
              <Title order={4} mb="md">
                Quick Actions
              </Title>
              <Stack gap="sm">
                <Card
                  padding="md"
                  radius="md"
                  withBorder
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push('/super-admin/hotels')}
                >
                  <Group>
                    <IconBuilding size={20} stroke={1.5} />
                    <Text size="sm" fw={500}>
                      Tambah Hotel Baru
                    </Text>
                  </Group>
                </Card>
                <Card
                  padding="md"
                  radius="md"
                  withBorder
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push('/super-admin/users')}
                >
                  <Group>
                    <IconUsers size={20} stroke={1.5} />
                    <Text size="sm" fw={500}>
                      Tambah User Baru
                    </Text>
                  </Group>
                </Card>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}