'use client';

import React from 'react';
import { Box, Container, Grid, Stack } from '@mantine/core';
import { SuperAdminStats } from './components/SuperAdminStats';
import { SystemHealthChart } from './components/SystemHealthChart';
import { HotelDistributionChart } from './components/HotelDistributionChart';
import { RecentActivities } from './components/RecentActivities';

interface DashboardProps {
  stats: {
    totalHotels: number;
    totalUsers: number;
    activeSessions: number;
    systemHealth: string;
  };
}

export default function SuperAdminDashboardClient({ stats }: DashboardProps) {
  return (
    <Box style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Container fluid px="md" py="lg">
        <Stack gap="sm">
          
          {/* 1. KPI Stats Cards */}
          <SuperAdminStats 
            totalHotels={stats.totalHotels}
            totalUsers={stats.totalUsers}
            activeSessions={stats.activeSessions}
            systemHealth={stats.systemHealth}
          />

          {/* 2. Charts Row */}
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <SystemHealthChart />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
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