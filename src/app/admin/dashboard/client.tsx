'use client';

import {
  Container,
  Title,
  Grid,
  Paper,
  Text,
  Group,
  ThemeIcon,
  SimpleGrid,
  Box,
} from '@mantine/core';
import {
  IconBed,
  IconCalendarCheck,
  IconClock,
  IconUsers,
  IconLayoutDashboard,
  IconTrendingUp,
} from '@tabler/icons-react';
import { DashboardData } from './page';
import { RecentReservationsTable } from './components/RecentReservationsTable';
import SalesChart from '@/components/SalesChart/SalesChart';
import RevenueChart from '@/components/RevenueChart/RevenueChart';

interface ClientProps {
  data: DashboardData;
}

export default function AdminDashboardClient({ data }: ClientProps) {
  const { stats, recentReservations, hotelId } = data;

  // Membatasi lebar agar tampilan lebih compact dan fokus di tengah
  const MAX_WIDTH = 1200; 

  if (!hotelId) {
    return (
      <Container size="lg" py="xl">
        <Paper withBorder p="xl" ta="center" radius="md" shadow="sm">
          <Title order={3} mb="sm">Akses Terbatas</Title>
          <Text c="dimmed">Akun Anda belum terhubung dengan Hotel manapun.</Text>
        </Paper>
      </Container>
    );
  }

  const statCards = [
    {
      title: 'Kamar Tersedia',
      value: stats.availableRooms,
      icon: IconBed,
      color: 'green',
      desc: 'Siap dijual',
      diff: 12,
    },
    {
      title: 'Check-in Hari Ini',
      value: stats.todayCheckIns,
      icon: IconCalendarCheck,
      color: 'blue',
      desc: 'Akan datang',
      diff: -5,
    },
    {
      title: 'Tamu In-House',
      value: stats.activeReservations,
      icon: IconClock,
      color: 'orange',
      desc: 'Sedang menginap',
      diff: 0,
    },
    {
      title: 'Total Tamu',
      value: stats.totalGuests,
      icon: IconUsers,
      color: 'violet',
      desc: 'Database tamu',
      diff: 8,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Banner Header: Compact & Rapi */}
      <div
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
                size={34} // Icon header lebih kecil
                radius="md"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
              >
                <IconLayoutDashboard size={18} stroke={1.5} />
              </ThemeIcon>
              <div style={{ lineHeight: 1 }}>
                <Title order={3} c="white" style={{ fontSize: '1rem', fontWeight: 700 }}>
                  Dashboard Admin
                </Title>
                <Text c="white" opacity={0.9} size="xs" mt={2} style={{ fontSize: '0.75rem' }}>
                  {stats.hotelName} &bull; Ringkasan Operasional
                </Text>
              </div>
            </Group>
          </Box>
        </Container>
      </div>

      {/* Konten Utama: Compact Layout */}
      <Container fluid px="lg" py="md">
        <Box maw={MAX_WIDTH} mx="auto">
          
          {/* Baris 1: Kartu Statistik (Ukuran diperkecil) */}
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="lg">
            {statCards.map((stat) => {
              const isPositive = stat.diff >= 0;
              return (
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
                      size={36} // Icon dalam kartu lebih kecil
                      radius="md"
                    >
                      <stat.icon size="1.1rem" stroke={1.5} />
                    </ThemeIcon>
                  </Group>
                  
                  <Group mt="sm" gap={6}>
                    {stat.diff !== 0 && (
                      <Text c={isPositive ? 'teal' : 'red'} size="xs" fw={600} style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                        <IconTrendingUp 
                          size={12} 
                          style={{ marginRight: 2, transform: isPositive ? 'none' : 'scaleY(-1)' }} 
                        />
                        {Math.abs(stat.diff)}%
                      </Text>
                    )}
                    <Text c="dimmed" size="xs" style={{ fontSize: '0.75rem' }}>
                      {stat.desc}
                    </Text>
                  </Group>
                </Paper>
              );
            })}
          </SimpleGrid>

          {/* Baris 2: Grafik Analitik (Lebih pendek) */}
          <Grid gutter="md" mb="lg">
            {/* Revenue Chart */}
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Paper shadow="xs" radius="md" p="sm" withBorder style={{ height: '100%', minHeight: 280 }}>
                 {/* Mengurangi minHeight agar grafik tidak terlalu tinggi */}
                 <RevenueChart style={{ height: '100%', width: '100%', border: 'none', boxShadow: 'none' }} />
              </Paper>
            </Grid.Col>

            {/* Sales/Donut Chart */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper shadow="xs" radius="md" p="sm" withBorder style={{ height: '100%', minHeight: 280 }}>
                  <SalesChart style={{ height: '100%', width: '100%', border: 'none', boxShadow: 'none' }} />
              </Paper>
            </Grid.Col>
          </Grid>

          {/* Baris 3: Tabel Reservasi Terbaru */}
          <Paper p="sm" radius="md" shadow="xs" withBorder>
            <Group justify="space-between" mb="xs">
              <Title order={5} style={{ fontSize: '0.95rem' }}>Reservasi Terbaru</Title>
              <Text size="xs" c="dimmed" style={{ cursor: 'pointer', fontSize: '0.75rem' }} td="underline">
                Lihat Semua
              </Text>
            </Group>
            {/* Tabel otomatis menyesuaikan padding dari parent Paper */}
            <RecentReservationsTable reservations={recentReservations} />
          </Paper>

        </Box>
      </Container>
    </div>
  );
}