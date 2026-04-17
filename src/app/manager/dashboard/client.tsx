// src/app/manager/dashboard/client.tsx
'use client';

import React, { useMemo } from 'react';
import { Box, Container, Grid, Stack } from '@mantine/core';
import { ManagerDashboardData } from './page';
import { ManagerSummaryData } from './actions';
import { DashboardStats } from './components/DashboardStats';
import { OccupancyChart } from './components/OccupancyChart';
import { RevenueChart } from './components/RevenueChart';
import { RecentReservations } from './components/RecentReservations';
import { AICopilotWidget } from './components/AICopilotWidget';
import { ProactiveInsightsWidget } from './components/ProactiveInsightsWidget';

interface ClientProps {
  data: ManagerDashboardData;
}

// Helper: Nama hari dalam Bahasa Indonesia
function getDayName(date: Date): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
}

export default function ManagerDashboardClient({ data }: ClientProps) {
  const { stats, recentActivities } = data;

  // Construct summary data for AI insights (memoized to prevent re-renders)
  const insightsSummary: ManagerSummaryData = useMemo(() => {
    const now = new Date();
    const totalRooms = stats.totalRooms || 1;
    const occupiedRooms = totalRooms - stats.availableRooms;
    const occupancyRate = (occupiedRooms / totalRooms) * 100;

    return {
      hotelName: stats.hotelName,
      todayDate: now.toISOString().split('T')[0],
      dayOfWeek: getDayName(now),
      availableRooms: stats.availableRooms,
      totalRooms: stats.totalRooms,
      todayCheckIns: stats.todayCheckIns,
      todayCheckOuts: stats.todayCheckOuts,
      guestsInHouse: stats.guestsInHouse,
      occupancyRate,
      recentRevenue: recentActivities.map((a) => ({
        guestName: a.guest_name,
        roomNumber: a.room_number,
        amount: a.total_price,
        status: a.status,
      })),
    };
  }, [stats, recentActivities]);

  return (
    <Box style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Container fluid px="md" py="lg">
        <Stack gap="sm">
          
          {/* 1. KPI Stats Cards */}
          <DashboardStats 
            availableRooms={stats.availableRooms}
            todayCheckIns={stats.todayCheckIns}
          />

          {/* 2. AI Proactive Insights (loads in background) */}
          <ProactiveInsightsWidget summaryData={insightsSummary} />

          {/* 3. Charts Row */}
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <OccupancyChart />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              {/* Revenue tetap dummy sesuai permintaan */}
              <RevenueChart />
            </Grid.Col>
          </Grid>

          {/* 4. Recent Reservations List - Menggunakan Data Real */}
          <RecentReservations data={recentActivities} />

        </Stack>
      </Container>

      {/* 5. Floating AI Widget */}
      <AICopilotWidget />
    </Box>
  );
}