'use client';

import React from 'react';
import { Box, Container, Grid, Stack } from '@mantine/core';
import { SuperAdminStats } from './components/SuperAdminStats';
import { GlobalRevenueChart } from './components/GlobalRevenueChart';
import { HotelDistributionChart } from './components/HotelDistributionChart';
import { RecentActivities } from './components/RecentActivities';
import { SuperAdminDashboardData } from './page';

interface DashboardProps {
  data: SuperAdminDashboardData;
}

export default function SuperAdminDashboardClient({ data }: DashboardProps) {
  const { stats, monthlyRevenue, hotelDistribution, recentActivities } = data;

  return (
    <Box style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Container fluid px="md" py="lg">
        <Stack gap="sm">
          
          {/* 1. KPI Stats Cards - All Real Data */}
          <SuperAdminStats 
            totalHotels={stats.totalHotels}
            totalUsers={stats.totalUsers}
            totalRevenue={stats.totalRevenue}
            totalReservations={stats.totalReservations}
          />

          {/* 2. Charts Row - Real Data */}
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <GlobalRevenueChart data={monthlyRevenue} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <HotelDistributionChart data={hotelDistribution} totalHotels={stats.totalHotels} />
            </Grid.Col>
          </Grid>

          {/* 3. Recent Activities List - Real Data */}
          <RecentActivities data={recentActivities} />

        </Stack>
      </Container>
    </Box>
  );
}