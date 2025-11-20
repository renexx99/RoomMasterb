'use client';

import { Container, Title, Stack, Grid, Paper, Text, Group, Badge, Box } from '@mantine/core';
import { DashboardData } from './page';
import { DashboardStats } from './components/DashboardStats';
import { RecentReservationsTable } from './components/RecentReservationsTable';
import SalesChart from '@/components/SalesChart/SalesChart';
import RevenueChart from '@/components/RevenueChart/RevenueChart';

interface ClientProps {
  data: DashboardData;
}

export default function AdminDashboardClient({ data }: ClientProps) {
  // 1. DESTRUKTURISASI DATA
  const { stats, recentReservations, hotelId } = data;

  // 2. PANGGIL HOOKS DI SINI (JIKA ADA)
  // Meskipun saat ini belum ada hooks eksplisit, menempatkan struktur ini
  // mencegah error jika nanti Anda menambahkan useMantineTheme(), useRouter(), dll.
  // const theme = useMantineTheme(); 

  // 3. LOGIKA RENDERING (RETURN)
  // Kita gunakan satu return utama dan kondisikan kontennya di dalam JSX
  
  // Jika tidak ada Hotel ID (Kondisi Error/Belum Assign)
  if (!hotelId) {
    return (
      <Container size="lg" py="xl">
         <Paper withBorder p="xl" ta="center" radius="md">
           <Title order={3} mb="sm">Akses Terbatas</Title>
           <Text size="lg" fw={500} c="dimmed">
             Akun Anda belum terhubung dengan Hotel manapun.
           </Text>
           <Text size="sm" c="dimmed">Hubungi Super Admin untuk penugasan.</Text>
         </Paper>
       </Container>
    );
  }

  // Jika Hotel ID ada (Render Dashboard Normal)
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
            {/* Pastikan komponen SalesChart tidak error internal */}
            <SalesChart withBorder radius="md" />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }}>
             {/* Pastikan komponen RevenueChart tidak error internal */}
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