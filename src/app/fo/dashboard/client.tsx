// src/app/fo/dashboard/client.tsx
'use client';

import React from 'react';
import { Box, Container, Stack, Grid } from '@mantine/core';
import { DashboardData } from './page';
import { DashboardStats } from './components/DashboardStats';
import { RecentActivityTable } from './components/RecentActivityTable';
import { WaitingListWidget } from './components/WaitingListWidget';
import { AICopilotWidget } from './components/AICopilotWidget';

interface ClientProps {
  data: DashboardData;
}

export default function FoDashboardClient({ data }: ClientProps) {
  const { stats, orders } = data;

  // Mapping orders dummy to new structure if needed
  const mappedActivity = orders.map((o: any) => ({
    id: o.id,
    product: o.product,
    guest: 'John Doe', // Dummy, since mock might not have it
    total: o.total,
    payment_method: o.payment_method,
    status: o.status,
    date: o.date
  }));

  return (
    <Box style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      
      <Container fluid px="md" py="md">
        <Stack gap="md">
          
          {/* 1. KPI Stats Cards */}
          <DashboardStats 
            todayCheckIns={stats.todayCheckIns}
            todayCheckOuts={stats.todayCheckOuts}
            availableRooms={stats.availableRooms}
            dirtyRooms={stats.dirtyRooms}
          />

          {/* 2. Main Content Grid */}
          <Grid gutter="md">
            {/* Left Col: Activity Table */}
            <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
              <RecentActivityTable data={mappedActivity} />
            </Grid.Col>

            {/* Right Col: Waiting List & Quick Status */}
            <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
              <WaitingListWidget />
            </Grid.Col>
          </Grid>

        </Stack>
      </Container>

      {/* 3. Floating AI Widget */}
      <AICopilotWidget />
    </Box>
  );
}