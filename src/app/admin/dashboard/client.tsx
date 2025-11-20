'use client';

import { Container, Title, Stack, Grid, Paper, Text, Group, Badge } from '@mantine/core';
import { DashboardData } from './page';
import { DashboardStats } from './components/DashboardStats';
import { RecentReservationsTable } from './components/RecentReservationsTable';
import SalesChart from '@/components/SalesChart/SalesChart';
import RevenueChart from '@/components/RevenueChart/RevenueChart';

interface ClientProps {
  data: DashboardData;
}

export default function AdminDashboardClient({ data }: ClientProps) {
  // PENTING: Jangan panggil Hooks (useState, useEffect, dll) di sini jika ada kemungkinan early return di bawah.
  // Karena komponen ini "dumb" (hanya menerima props), kita aman.
  
  const { stats, recentReservations, hotelId } = data;

  // Kondisi 1: Jika tidak ada Hotel ID
  if (!hotelId) {
    return (
       <Container size="lg" py="xl">
         <Paper withBorder p="xl" ta="center">
           <Title order={3} mb="sm">Akses Terbatas</Title>
           <Text size="lg" fw={500} c="dimmed">
             Akun Anda belum terhubung dengan Hotel manapun.
           </Text>
           <Text size="sm" c="dimmed">Hubungi Super Admin untuk penugasan.</Text>
         </Paper>
       </Container>
    );
  }

  // Kondisi 2: Render Dashboard Normal
  return (
    <Container fluid p="lg">
      <Stack gap="lg">
        <Group justify="space-between">
            <Title order={2} fw={600}>Dashboard Admin</Title>
            <Badge size="lg" variant="light" color="blue">{stats.hotelName}</Badge>
        </Group>

        {/* Kartu Statistik */}
        <DashboardStats stats={stats} />

        {/* Grafik */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <SalesChart withBorder radius="md" />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }}>
            <RevenueChart withBorder radius="md" />
          </Grid.Col>
        </Grid>

        {/* Tabel Reservasi */}
        <Stack gap="sm">
            <Title order={3}>5 Reservasi Terbaru</Title>
            <RecentReservationsTable reservations={recentReservations} />
        </Stack>
        
      </Stack>
    </Container>
  );
}