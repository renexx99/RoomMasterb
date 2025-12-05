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
  const { stats } = data;

  return (
    <Box style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Container fluid px="md" py="lg">
        <Stack gap="sm">
          
          {/* 1. KPI Stats Cards */}
          {/* Kita passing data real dari props ke komponen ini */}
          <DashboardStats 
            availableRooms={stats.availableRooms}
            todayCheckIns={stats.todayCheckIns}
          />

          {/* 2. Charts Row */}
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <OccupancyChart />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <RevenueChart />
            </Grid.Col>
          </Grid>

          {/* 3. Recent Reservations List */}
          <RecentReservations />

        </Stack>
      </Container>

      {/* 4. Floating AI Widget */}
      <AICopilotWidget />
    </Box>
  );
}