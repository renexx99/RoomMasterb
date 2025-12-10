'use client';

import React from 'react';
import { Box, Container, Grid, Stack } from '@mantine/core';
import { SuperAdminStats } from './components/SuperAdminStats';
import { GlobalRevenueChart } from './components/GlobalRevenueChart';
import { HotelDistributionChart } from './components/HotelDistributionChart';
import { RecentActivities } from './components/RecentActivities';

interface DashboardProps {
  stats: {
    totalHotels: number;
    totalUsers: number;
    totalRevenue: string;
    growthRate: string;
  };
}

export default function SuperAdminDashboardClient({ stats }: DashboardProps) {
  return (
    <Box style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Container fluid px="md" py="lg">
        <Stack gap="md">
          
          {/* 1. KPI Stats Cards (Ungu/Biru Theme) */}
          <SuperAdminStats 
            totalHotels={stats.totalHotels}
            totalUsers={stats.totalUsers}
            totalRevenue={stats.totalRevenue}
            growthRate={stats.growthRate}
          />

          {/* 2. Charts Row */}
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, md: 7 }}>
              {/* Menggantikan SystemHealthChart */}
              <GlobalRevenueChart />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 5 }}>
              {/* Updated Logic */}
              <HotelDistributionChart totalHotels={stats.totalHotels} />
            </Grid.Col>
          </Grid>

          {/* 3. Recent Activities List */}
          <RecentActivities />

        </Stack>
      </Container>
    </Box>
  );
}