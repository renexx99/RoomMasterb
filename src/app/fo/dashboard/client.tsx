// src/app/fo/dashboard/client.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Box, Container, Stack, Grid } from '@mantine/core';
import { DashboardData } from './page';
import { FOSummaryData } from './actions';
import { DashboardStats } from './components/DashboardStats';
import { RecentActivityTable } from './components/RecentActivityTable';
import { WaitingListWidget } from './components/WaitingListWidget';
import { AICopilotWidget } from './components/AICopilotWidget';
import { ProactiveInsightsWidget } from './components/ProactiveInsightsWidget';
import { ReservationInvoiceModal } from '../reservations/components/ReservationInvoiceModal';
import { ReservationDetails } from '../reservations/page';

interface ClientProps {
  data: DashboardData;
}

// Helper: Nama hari dalam Bahasa Indonesia
function getDayName(date: Date): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
}

export default function FoDashboardClient({ data }: ClientProps) {
  const { stats, recentReservations, todayArrivals } = data;
  
  const [invoiceModalOpened, setInvoiceModalOpened] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationDetails | null>(null);

  const handleViewInvoice = (reservation: ReservationDetails) => {
    setSelectedReservation(reservation);
    setInvoiceModalOpened(true);
  };

  // Construct summary data for AI insights (memoized)
  const insightsSummary: FOSummaryData = useMemo(() => {
    const now = new Date();
    return {
      todayDate: now.toISOString().split('T')[0],
      dayOfWeek: getDayName(now),
      hotelName: stats.hotelName,
      stats: {
        todayCheckIns: stats.todayCheckIns,
        todayCheckOuts: stats.todayCheckOuts,
        availableRooms: stats.availableRooms,
        dirtyRooms: stats.dirtyRooms,
      },
      todayArrivals: todayArrivals,
    };
  }, [stats, todayArrivals]);

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

          {/* 2. AI Daily Briefing (loads in background) */}
          <ProactiveInsightsWidget summaryData={insightsSummary} />

          {/* 3. Main Content Grid */}
          <Grid gutter="md">
            {/* Left Col: Activity Table */}
            <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
              <RecentActivityTable 
                data={recentReservations} 
                onViewInvoice={handleViewInvoice} 
              />
            </Grid.Col>

            {/* Right Col: Waiting List (Static for now as requested) */}
            <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
              <WaitingListWidget />
            </Grid.Col>
          </Grid>

        </Stack>
      </Container>

      {/* 4. Floating AI Widget */}
      <AICopilotWidget />

      {/* 5. Invoice Modal */}
      <ReservationInvoiceModal 
        opened={invoiceModalOpened} 
        onClose={() => setInvoiceModalOpened(false)} 
        reservation={selectedReservation} 
      />
    </Box>
  );
}