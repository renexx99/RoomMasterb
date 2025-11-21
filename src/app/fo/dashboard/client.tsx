// src/app/fo/dashboard/client.tsx
'use client';

import {
  Container,
  Title,
  Text,
  Stack,
  Badge,
  Group,
  Paper,
  ThemeIcon,
  SimpleGrid,
  Box,
  Grid,
} from '@mantine/core';
import {
  IconLayoutDashboard,
  IconLogin,
  IconLogout,
  IconBed,
  IconSpray, // Icon untuk Dirty Rooms
  IconTrendingUp,
} from '@tabler/icons-react';
import { DashboardData } from './page';
import Surface from '@/components/Dashboard/Surface';
import OrdersTable from '@/components/Dashboard/OrdersTable';

interface ClientProps {
  data: DashboardData;
}

export default function FoDashboardClient({ data }: ClientProps) {
  const { stats, orders } = data;
  
  // Konsistensi Layout
  const MAX_WIDTH = 1200;

  if (!stats.hotelName) {
    return (
      <Container size="lg" py="xl">
        <Paper shadow="xs" p="xl" radius="lg" withBorder>
          <Stack align="center">
            <Title order={3} ta="center">Akses Terbatas</Title>
            <Text c="dimmed" ta="center">
              Akun Anda belum terhubung dengan Hotel manapun.
            </Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  const statCards = [
    {
      title: 'Kedatangan Hari Ini',
      value: stats.todayCheckIns,
      icon: IconLogin,
      color: 'teal',
      desc: 'Tamu akan check-in',
      diff: 0,
    },
    {
      title: 'Keberangkatan Hari Ini',
      value: stats.todayCheckOuts,
      icon: IconLogout,
      color: 'orange',
      desc: 'Tamu akan check-out',
      diff: 0,
    },
    {
      title: 'Kamar Tersedia',
      value: stats.availableRooms,
      icon: IconBed,
      color: 'blue',
      desc: 'Siap dijual',
      diff: 0,
    },
    {
      title: 'Kamar Kotor',
      value: stats.dirtyRooms,
      icon: IconSpray,
      color: 'red',
      desc: 'Perlu dibersihkan',
      diff: 0,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Ramping (FO Teal Style) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)',
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
                  Dashboard Operasional
                </Title>
                <Text c="white" opacity={0.9} size="xs" mt={2} style={{ fontSize: '0.75rem' }}>
                  {stats.hotelName} &bull; Ringkasan Harian
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

            {/* Tabel Reservasi/Tamu Terbaru */}
            <Surface>
              <Group justify="space-between" mb="sm">
                <Title order={5} style={{ fontSize: '0.95rem' }}>Aktivitas Check-in Hari Ini</Title>
                <Badge color="teal" variant="light" size="sm">Data Realtime</Badge>
              </Group>
              <OrdersTable data={orders} loading={false} />
            </Surface>

          </Stack>
        </Box>
      </Container>
    </div>
  );
}