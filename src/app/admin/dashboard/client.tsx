'use client';

import React from 'react';
import {
  Container,
  Grid,
  Stack,
  Box,
  Paper,
  Group,
  Title,
  Text,
  Button
} from '@mantine/core';
import { DashboardData } from './page';
import { DashboardStats } from './components/DashboardStats';
import { RecentReservationsTable } from './components/RecentReservationsTable';
import { AdminRevenueTrend, AdminOccupancyRing } from './components/AdminCharts'; // Import komponen baru

interface ClientProps {
  data: DashboardData;
}

export default function AdminDashboardClient({ data }: ClientProps) {
  const { stats, recentReservations, hotelId } = data;

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

  return (
    <Box style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Container fluid px="md" py="lg">
        <Stack gap="sm">
          
          {/* 1. KPI Stats Cards (Tampilan Baru - Identik Manager) */}
          <DashboardStats stats={stats} />

          {/* 2. Charts Row (Tampilan Baru - Identik Manager) */}
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, md: 8 }}>
              {/* Grafik Bar Chart (Pengganti Revenue Area Chart) */}
              <AdminRevenueTrend />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              {/* Grafik Ring Chart (Pengganti Sales Donut Chart) */}
              <AdminOccupancyRing />
            </Grid.Col>
          </Grid>

          {/* 3. Recent Reservations List */}
          <Paper p="md" radius="md" shadow="sm" withBorder>
            <Group justify="space-between" mb="md">
              <div>
                <Text size="sm" fw={700}>Reservasi Terbaru</Text>
                <Text size="xs" c="dimmed">Aktivitas booking terakhir</Text>
              </div>
              <Button variant="light" color="teal" size="xs">
                Lihat Semua
              </Button>
            </Group>
            <RecentReservationsTable reservations={recentReservations} />
          </Paper>

        </Stack>
      </Container>
    </Box>
  );
}