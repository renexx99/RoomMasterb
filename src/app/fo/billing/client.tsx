// src/app/fo/billing/client.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Container, Box, Group, ThemeIcon, Title, ActionIcon, Text,
  Paper, Grid, TextInput,
} from '@mantine/core';
import { IconArrowLeft, IconCoin, IconSearch } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { ReservationDetails } from './page';
import { BillingList } from './components/BillingList';
// REPLACE: Import Invoice Modal instead of Folio Modal
import { ReservationInvoiceModal } from '../reservations/components/ReservationInvoiceModal';

interface ClientProps {
  initialReservations: ReservationDetails[];
  hotelId: string | null;
}

export default function BillingClient({ initialReservations, hotelId }: ClientProps) {
  const router = useRouter();
  const MAX_WIDTH = 1200;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRes, setSelectedRes] = useState<ReservationDetails | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  // Filter Logic
  const filteredReservations = useMemo(() => {
    if (!searchTerm) return initialReservations;
    const lower = searchTerm.toLowerCase();
    return initialReservations.filter(r => 
      r.guest?.full_name?.toLowerCase().includes(lower) ||
      r.room?.room_number?.toLowerCase().includes(lower)
    );
  }, [initialReservations, searchTerm]);

  // Handler now opens Invoice Modal
  const handleOpenInvoice = (res: ReservationDetails) => {
    setSelectedRes(res);
    setModalOpened(true);
  };

  const handleCloseModal = () => {
    setModalOpened(false);
    setSelectedRes(null);
  };

  if (!hotelId) {
    return (
      <Container size="lg" py="xl">
        <Paper withBorder p="xl" ta="center"><Text c="dimmed">Akun tidak terhubung ke hotel.</Text></Paper>
      </Container>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)', padding: '0.75rem 0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <Container fluid px="lg">
          <Box maw={MAX_WIDTH} mx="auto">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <ThemeIcon variant="light" color="white" size="lg" radius="md" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                  <IconCoin size={20} stroke={1.5} />
                </ThemeIcon>
                <div style={{ lineHeight: 1 }}>
                  <Title order={4} c="white" style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.2 }}>Billing & Invoice</Title>
                  <Text c="white" opacity={0.8} size="xs" mt={2}>Manage guest payments and invoices</Text>
                </div>
              </Group>
              <ActionIcon variant="white" color="teal" size="lg" radius="md" onClick={() => router.push('/fo/dashboard')} aria-label="Kembali">
                <IconArrowLeft size={20} />
              </ActionIcon>
            </Group>
          </Box>
        </Container>
      </div>

      {/* Content */}
      <Container fluid px="lg" py="md">
        <Box maw={MAX_WIDTH} mx="auto">
          
          {/* Filter */}
          <Paper shadow="xs" p="sm" radius="md" withBorder mb="md">
            <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                        placeholder="Cari tamu atau nomor kamar..."
                        leftSection={<IconSearch size={16} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.currentTarget.value)}
                    />
                </Grid.Col>
            </Grid>
          </Paper>

          {/* List */}
          <BillingList 
            reservations={filteredReservations} 
            onViewInvoice={handleOpenInvoice} // Updated prop name
          />

        </Box>
      </Container>

      {/* Modal - Replaced with Invoice Modal */}
      <ReservationInvoiceModal 
        opened={modalOpened} 
        onClose={handleCloseModal} 
        reservation={selectedRes}
      />
    </div>
  );
}