'use client';

import {
  Container,
  Title,
  Text,
  Card,
  Grid,
  Badge,
  SimpleGrid,
  Stack,
  Group,
  Paper,
} from '@mantine/core';
import {
  IconBuilding,
  IconUsers,
  IconTrendingUp,
  IconShieldCheck,
} from '@tabler/icons-react';
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
      }
    };

    fetchStats();
  }, []);

  return (
    <Container size="lg" style={{ background: '#f9fafc', borderRadius: 12, padding: '1.5rem' }}>
      <Stack gap="xl">
        <div>
          <Title order={2} mb="xs" c="#1e293b">
            Dashboard
          </Title>
          <Text c="#475569">Selamat datang di Coorporate Dashboard</Text>
        </div>

        {/* Stats Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {[
            {
              title: 'Total Hotel',
              value: stats.totalHotels,
              color: '#4f46e5',
              icon: <IconBuilding size={24} stroke={1.5} color="#4f46e5" />,
              route: '/super-admin/hotels',
            },
            {
              title: 'Hotel Admin',
              value: stats.totalAdmins,
              color: '#4f46e5',
              icon: <IconUsers size={24} stroke={1.5} color="#4f46e5" />,
              route: '/super-admin/users',
            },
            {
              title: 'Admin Belum Ditugaskan',
              value: stats.unassignedAdmins,
              color: '#f97316',
              icon: <IconTrendingUp size={24} stroke={1.5} color="#f97316" />,
              route: '/super-admin/users',
            },
          ].map((item) => (
            <Card
              key={item.title}
              padding="lg"
              radius="lg"
              shadow="xs"
              style={{
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                background: 'white',
                border: 'none',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
              }}
              onClick={() => router.push(item.route)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(99,102,241,0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Group justify="space-between" mb="md">
                <div>
                  <Text size="sm" c="#1e293b" fw={500}>
                    {item.title}
                  </Text>
                  <Text size="xl" fw={700} mt="xs" c={item.color}>
                    {item.value}
                  </Text>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: `${item.color}1A`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </div>
              </Group>
              <Text size="xs" c="#64748b">
                Klik untuk kelola
              </Text>
            </Card>
          ))}
        </SimpleGrid>

        {/* Bottom Section */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper
              shadow="xs"
              p="lg"
              radius="lg"
              style={{
                background: 'white',
                border: 'none',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
              }}
            >
              <Group mb="md">
                <IconShieldCheck size={24} stroke={1.5} color="#4f46e5" />
                <Title order={4} c="#1e293b">
                  Status Sistem
                </Title>
              </Group>
              <Text size="sm" c="#475569" mb="md">
                Semua sistem berjalan normal
              </Text>
              <Stack gap="xs">
                {['Database', 'Authentication', 'API Services'].map((label) => (
                  <Group justify="space-between" key={label}>
                    <Text size="sm" c="#1e293b">
                      {label}
                    </Text>
                    <Badge color="green" variant="light">
                      ONLINE
                    </Badge>
                  </Group>
                ))}
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper
              shadow="xs"
              p="lg"
              radius="lg"
              style={{
                background: 'white',
                border: 'none',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
              }}
            >
              <Title order={4} mb="md" c="#1e293b">
                Quick Actions
              </Title>
              <Stack gap="sm">
                <Card
                  padding="md"
                  radius="md"
                  style={{
                    cursor: 'pointer',
                    background: '#f9fafb',
                    border: 'none',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#eef2ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#f9fafb')}
                  onClick={() => router.push('/super-admin/hotels')}
                >
                  <Group>
                    <IconBuilding size={20} stroke={1.5} color="#4f46e5" />
                    <Text size="sm" fw={500} c="#1e293b">
                      Tambah Hotel Baru
                    </Text>
                  </Group>
                </Card>
                <Card
                  padding="md"
                  radius="md"
                  style={{
                    cursor: 'pointer',
                    background: '#f9fafb',
                    border: 'none',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#eef2ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#f9fafb')}
                  onClick={() => router.push('/super-admin/users')}
                >
                  <Group>
                    <IconUsers size={20} stroke={1.5} color="#4f46e5" />
                    <Text size="sm" fw={500} c="#1e293b">
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
