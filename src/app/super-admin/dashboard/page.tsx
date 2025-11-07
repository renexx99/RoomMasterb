'use client';

import { Container, Title, Text, Grid, Stack } from '@mantine/core';
import { useRouter } from 'next/navigation';

// Impor komponen dashboard baru kita
import StatsGrid from '@/components/Dashboard/StatsGrid';
import RevenueChart from '@/components/Dashboard/RevenueChart';
import SalesChart from '@/components/Dashboard/SalesChart';

// Data dummy untuk Super Admin StatsGrid
const superAdminStats = [
  {
    title: 'Total Pendapatan (Chain)',
    value: 'IDR 1.2M',
    diff: 12,
    period: 'monthly',
  },
  {
    title: 'Rata-rata Okupansi (Chain)',
    value: '76.5%',
    diff: -2.5,
    period: 'monthly',
  },
  {
    title: 'Jumlah Hotel Aktif',
    value: '14',
    diff: 0,
  },
  {
    title: 'Total Tamu Hari Ini',
    value: '1,205',
    diff: 5,
  },
];

export default function SuperAdminDashboard() {
  const router = useRouter();

  return (
    <Container size="lg" style={{ background: '#f9fafc', borderRadius: 12, padding: '1.5rem' }}>
      <Stack gap="xl">
        <div>
          <Title order={2} mb="xs" c="#1e293b">
            Chain Dashboard
          </Title>
          <Text c="#475569">Ringkasan performa high-level seluruh properti.</Text>
        </div>

        {/* Baris Atas: StatsGrid */}
        <StatsGrid data={superAdminStats} />

        {/* Baris Bawah: Charts (Layout Baru) */}
        <Grid>
          {/* Kolom Kiri (2/3): RevenueChart */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <RevenueChart style={{ height: 400 }} />
          </Grid.Col>

          {/* Kolom Kanan (1/3): SalesChart */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <SalesChart style={{ height: 400 }} />
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}