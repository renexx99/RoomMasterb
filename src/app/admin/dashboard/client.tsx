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
import { AdminRevenueTrend, AdminOccupancyRing } from './components/AdminCharts';

interface ClientProps {
  data: DashboardData;
}

export default function AdminDashboardClient({ data }: ClientProps) {
  const { stats, recentReservations, hotelId, occupancyData, revenueTrend, avgDailyRevenue } = data;

  if (!hotelId) {
    return (
      <Container size="lg" py="xl">
        <Paper withBorder p="xl" ta="center" radius="md" shadow="sm">
          <Title order={3} mb="sm">Restricted Access</Title>
          <Text c="dimmed">Your account is not linked to any property.</Text>
        </Paper>
      </Container>
    );
  }

  return (
    <Box style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Container fluid px="md" py="lg">
        <Stack gap="sm">
          
          {/* 1. KPI Stats Cards */}
          <DashboardStats stats={stats} />

          {/* 2. Charts Row - Real Data */}
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <AdminRevenueTrend data={revenueTrend} avgRevenue={avgDailyRevenue} />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <AdminOccupancyRing data={occupancyData} totalRooms={stats.totalRooms} />
            </Grid.Col>
          </Grid>

          {/* 3. Recent Reservations List */}
          <Paper p="md" radius="md" shadow="sm" withBorder>
            <Group justify="space-between" mb="md">
              <div>
                <Text size="sm" fw={700}>Recent Bookings</Text>
                <Text size="xs" c="dimmed">Latest reservation activities</Text>
              </div>
              <Button variant="light" color="teal" size="xs">
                View All
              </Button>
            </Group>
            <RecentReservationsTable reservations={recentReservations} />
          </Paper>

        </Stack>
      </Container>
    </Box>
  );
}