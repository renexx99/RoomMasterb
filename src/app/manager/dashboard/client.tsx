// src/app/manager/dashboard/client.tsx
'use client';

import React from 'react';
import { Box, Container, Grid, Stack } from '@mantine/core';
import { ManagerDashboardData } from './page';
import { DashboardStats } from './components/DashboardStats';
import { OccupancyChart } from './components/OccupancyChart';
import { RevenueChart } from './components/RevenueChart';
import { RecentReservations } from './components/RecentReservations';
import { AICopilotWidget } from './components/AICopilotWidget';

interface ClientProps {
  data: ManagerDashboardData;
}

export default function ManagerDashboardClient({ data }: ClientProps) {
  const { stats, recentActivities, occupancyTrend, revenueBreakdown, totalRevenueToday } = data;

  return (
    <Box style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Container fluid px="md" py="lg">
        <Stack gap="sm">

          {/* 1. KPI Stats Cards - All Real Data */}
          <DashboardStats
            occupancyRate={stats.occupancyRate}
            adr={stats.adr}
            todayCheckIns={stats.todayCheckIns}
            availableRooms={stats.availableRooms}
            totalRooms={stats.totalRooms}
            occupiedRooms={stats.occupiedRooms}
          />

          {/* 2. Charts Row - Real Data */}
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <OccupancyChart data={occupancyTrend} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <RevenueChart data={revenueBreakdown} totalRevenue={totalRevenueToday} />
            </Grid.Col>
          </Grid>

          {/* 3. Recent Reservations List - Real Data */}
          <RecentReservations data={recentActivities} />

        </Stack>
      </Container>

      {/* 4. Floating AI Widget */}
      <AICopilotWidget />
    </Box>
  );
}