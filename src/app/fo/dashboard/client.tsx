'use client';

import {
  Container,
  Title,
  Text,
  Stack,
  SimpleGrid,
  Badge,
  Group,
  Paper,
} from '@mantine/core';
import StatsCard from '@/components/Dashboard/StatsCard';
import OrdersTable from '@/components/Dashboard/OrdersTable';
import Surface from '@/components/Dashboard/Surface';
import { DashboardData } from './page';

interface ClientProps {
  data: DashboardData;
}

export default function FoDashboardClient({ data }: ClientProps) {
  const { stats, orders } = data;

  // Handle kasus jika Hotel ID belum diset (misal user baru)
  if (!stats.hotelName) {
    return (
      <Container size="lg" py="xl">
        <Paper shadow="xs" p="xl" radius="lg" withBorder>
          <Stack align="center">
            <Title order={3} ta="center">
              Akses Terbatas
            </Title>
            <Text c="dimmed" ta="center">
              Akun Anda belum terhubung dengan Hotel manapun. Silakan hubungi Super Admin.
            </Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // Transformasi data untuk StatsCard
  const statsCardsData = [
    {
      title: 'Total Kedatangan',
      value: stats.todayCheckIns.toString(),
      diff: 0,
      period: 'today',
    },
    {
      title: 'Total Keberangkatan',
      value: stats.todayCheckOuts.toString(),
      diff: 0,
      period: 'today',
    },
    {
      title: 'Kamar Tersedia',
      value: stats.availableRooms.toString(),
      diff: 0,
    },
    {
      title: 'Kamar Kotor (Dirty)',
      value: stats.dirtyRooms.toString(),
      diff: 0,
    },
  ];

  return (
    <Container
      size="lg"
      style={{ background: '#f9fafc', borderRadius: 12, padding: '1.5rem' }}
    >
      <Stack gap="xl">
        {/* Header Dashboard */}
        <div>
          <Group mb="xs">
            <Title order={2} c="#1e293b">
              Front Office Dashboard
            </Title>
            <Badge size="lg" color="teal" variant="light">
              {stats.hotelName}
            </Badge>
          </Group>
          <Text c="#475569">Ringkasan operasional harian hotel.</Text>
        </div>

        {/* Baris Atas: Stats Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          {statsCardsData.map((stat) => (
            <StatsCard key={stat.title} data={stat} />
          ))}
        </SimpleGrid>

        {/* Baris Bawah: Tabel Aktivitas (Menggunakan data dari server props) */}
        <Surface>
          <Title order={4} mb="md">
            Daftar Tamu Check-in Hari Ini (Data Mock)
          </Title>
          {/* Note: OrdersTable dimodifikasi sedikit untuk menerima data langsung 
             tanpa loading state karena data sudah siap dari server 
          */}
          <OrdersTable
            data={orders}
            loading={false} 
          />
        </Surface>
      </Stack>
    </Container>
  );
}