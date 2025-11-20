'use client';

import {
  Container,
  Title,
  Text,
  Stack,
  Badge,
  Group,
  Paper,
} from '@mantine/core';
import { DashboardData } from './page';
import Surface from '@/components/Dashboard/Surface';
import OrdersTable from '@/components/Dashboard/OrdersTable';
// Import komponen lokal yang baru dibuat
import { DashboardStats } from './components/DashboardStats';

interface ClientProps {
  data: DashboardData;
}

export default function FoDashboardClient({ data }: ClientProps) {
  const { stats, orders } = data;

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

  const statsCardsData = [
    { title: 'Total Kedatangan', value: stats.todayCheckIns.toString(), diff: 0, period: 'today' },
    { title: 'Total Keberangkatan', value: stats.todayCheckOuts.toString(), diff: 0, period: 'today' },
    { title: 'Kamar Tersedia', value: stats.availableRooms.toString(), diff: 0 },
    { title: 'Kamar Kotor (Dirty)', value: stats.dirtyRooms.toString(), diff: 0 },
  ];

  return (
    <Container size="lg" style={{ background: '#f9fafc', borderRadius: 12, padding: '1.5rem' }}>
      <Stack gap="xl">
        <div>
          <Group mb="xs">
            <Title order={2} c="#1e293b">Front Office Dashboard</Title>
            <Badge size="lg" color="teal" variant="light">{stats.hotelName}</Badge>
          </Group>
          <Text c="#475569">Ringkasan operasional harian hotel.</Text>
        </div>

        {/* Menggunakan Komponen Lokal */}
        <DashboardStats data={statsCardsData} />

        <Surface>
          <Title order={4} mb="md">Daftar Tamu Check-in Hari Ini (Data Mock)</Title>
          <OrdersTable data={orders} loading={false} />
        </Surface>
      </Stack>
    </Container>
  );
}