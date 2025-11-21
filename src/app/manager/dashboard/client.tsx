// src/app/manager/dashboard/client.tsx
'use client';

import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Stack,
  Group,
  Paper,
  ThemeIcon,
  Box,
  Grid,
} from '@mantine/core';
import {
  IconLayoutDashboard,
  IconLogin,
  IconLogout,
  IconBed,
  IconUsers,
} from '@tabler/icons-react';
import { ManagerDashboardData } from './page';
// Menggunakan komponen UI yang sudah ada/refactor sebelumnya
import StatsCard from '@/components/Dashboard/StatsCard';
import SalesChart from '@/components/Dashboard/SalesChart';
import OrdersTable from '@/components/Dashboard/OrdersTable';
import Surface from '@/components/Dashboard/Surface';
import { useFetchData } from '@/hooks/useFetchData';

interface ClientProps {
  data: ManagerDashboardData;
}

export default function ManagerDashboardClient({ data }: ClientProps) {
  const { stats } = data;
  
  // Konsistensi Layout
  const MAX_WIDTH = 1200;

  // Fetch dummy data untuk tabel aktivitas (sampai backend siap)
  const { data: ordersData, loading: ordersLoading } = useFetchData('/mocks/Orders.json');

  if (!data.hotelId) {
    return (
      <Container size="lg" py="xl">
        <Paper shadow="xs" p="xl" radius="lg" withBorder>
          <Stack align="center">
            <Title order={3} ta="center">Akses Terbatas</Title>
            <Text c="dimmed" ta="center">
              Akun Anda belum terhubung dengan Hotel manapun. Hubungi Super Admin.
            </Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  const statCards = [
    {
      title: 'Kamar Tersedia',
      value: stats.availableRooms.toString(),
      icon: IconBed,
      color: 'blue',
      desc: 'Siap dijual',
      diff: 0,
    },
    {
      title: 'Check-in Hari Ini',
      value: stats.todayCheckIns.toString(),
      icon: IconLogin,
      color: 'teal',
      desc: 'Tamu datang',
      diff: 0,
    },
    {
      title: 'Check-out Hari Ini',
      value: stats.todayCheckOuts.toString(),
      icon: IconLogout,
      color: 'orange',
      desc: 'Tamu pulang',
      diff: 0,
    },
    {
      title: 'Tamu In-House',
      value: stats.guestsInHouse.toString(),
      icon: IconUsers,
      color: 'violet',
      desc: 'Total menginap',
      diff: 0,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Ramping (Blue Manager Theme) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', // Blue Gradient
          padding: '0.75rem 0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <Container fluid px="lg">
          <Box maw={MAX_WIDTH} mx="auto">
            <Group gap="xs">
              <ThemeIcon
                variant="light"
                color="white"
                size={34}
                radius="md"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
              >
                <IconLayoutDashboard size={18} stroke={1.5} />
              </ThemeIcon>
              <div style={{ lineHeight: 1 }}>
                <Title order={3} c="white" style={{ fontSize: '1rem', fontWeight: 700 }}>
                  Manager Dashboard
                </Title>
                <Text c="white" opacity={0.9} size="xs" mt={2} style={{ fontSize: '0.75rem' }}>
                  {stats.hotelName} &bull; Ringkasan Manajemen
                </Text>
              </div>
            </Group>
          </Box>
        </Container>
      </div>

      {/* Konten Utama */}
      <Container fluid px="lg" py="md">
        <Box maw={MAX_WIDTH} mx="auto">
          <Stack gap="lg">
            
            {/* Baris Kartu Statistik */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
              {statCards.map((stat) => (
                <Paper key={stat.title} p="sm" radius="md" shadow="xs" withBorder>
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Text c="dimmed" size="xs" tt="uppercase" fw={700} style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                        {stat.title}
                      </Text>
                      <Text fw={700} style={{ fontSize: '1.35rem', lineHeight: 1, marginTop: 6, color: '#333' }}>
                        {stat.value}
                      </Text>
                    </div>
                    <ThemeIcon
                      color={stat.color}
                      variant="light"
                      size={36}
                      radius="md"
                    >
                      <stat.icon size="1.1rem" stroke={1.5} />
                    </ThemeIcon>
                  </Group>
                  
                  <Group mt="sm" gap={6}>
                    <Text c="dimmed" size="xs" style={{ fontSize: '0.75rem' }}>
                      {stat.desc}
                    </Text>
                  </Group>
                </Paper>
              ))}
            </SimpleGrid>

            {/* Grafik & Tabel */}
            <Grid gutter="md">
                {/* Grafik Penjualan / Okupansi */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <SalesChart style={{ height: '100%' }} />
                </Grid.Col>

                {/* Tabel Aktivitas Terbaru */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Surface>
                        <Title order={5} mb="sm" style={{ fontSize: '0.95rem' }}>
                            Aktivitas Transaksi Terbaru
                        </Title>
                        <OrdersTable data={ordersData} loading={ordersLoading} />
                    </Surface>
                </Grid.Col>
            </Grid>

          </Stack>
        </Box>
      </Container>
    </div>
  );
}