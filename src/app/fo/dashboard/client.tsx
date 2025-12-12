// src/app/fo/dashboard/client.tsx
'use client';

import React, { useState } from 'react';
import { Box, Container, Stack, Grid } from '@mantine/core';
import { DashboardData } from './page';
import { DashboardStats } from './components/DashboardStats';
import { RecentActivityTable } from './components/RecentActivityTable';
import { WaitingListWidget } from './components/WaitingListWidget';
import { AICopilotWidget } from './components/AICopilotWidget';
import { ReservationInvoiceModal } from '../reservations/components/ReservationInvoiceModal';
import { ReservationDetails } from '../reservations/page';

interface ClientProps {
  data: DashboardData;
}

export default function FoDashboardClient({ data }: ClientProps) {
  const { stats, recentReservations } = data;
  
  const [invoiceModalOpened, setInvoiceModalOpened] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationDetails | null>(null);

  const handleViewInvoice = (reservation: ReservationDetails) => {
    setSelectedReservation(reservation);
    setInvoiceModalOpened(true);
  };

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

      {/* 3. Floating AI Widget */}
      <AICopilotWidget />

      {/* 4. Invoice Modal */}
      <ReservationInvoiceModal 
        opened={invoiceModalOpened} 
        onClose={() => setInvoiceModalOpened(false)} 
        reservation={selectedReservation} 
      />
    </Box>
  );
}