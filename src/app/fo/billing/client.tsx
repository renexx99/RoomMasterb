// src/app/fo/billing/client.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Box, Group, Text, ActionIcon, Flex,
  Paper, Grid, TextInput, Select, RingProgress, Center, Loader, Title
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconSearch, IconCalendarStats, IconChartPie, IconWallet } from '@tabler/icons-react';
import { ReservationDetails } from './page';
import { BillingList } from './components/BillingList';
import { ReservationInvoiceModal } from '../reservations/components/ReservationInvoiceModal';
import { getBillingStats } from './actions';
import dayjs from 'dayjs';

interface ClientProps {
  initialReservations: ReservationDetails[];
  hotelId: string | null;
  initialStats: { revenue: number; occupancy: number };
}

export default function BillingClient({ initialReservations, hotelId, initialStats }: ClientProps) {
  // --- STATE LIST ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRes, setSelectedRes] = useState<ReservationDetails | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  // --- STATE STATS & FILTER ---
  const [stats, setStats] = useState(initialStats);
  const [loadingStats, setLoadingStats] = useState(false);
  const [filterType, setFilterType] = useState<string>('this_month');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    dayjs().startOf('month').toDate(),
    dayjs().endOf('month').toDate(),
  ]);

  // --- HANDLER FILTER PERIODE ---
  const handleFilterChange = (value: string | null) => {
    if (!value) return;
    setFilterType(value);
    
    const today = dayjs();
    let start: Date | null = null;
    let end: Date | null = null;

    switch (value) {
      case 'this_month':
        start = today.startOf('month').toDate();
        end = today.endOf('month').toDate();
        break;
      case 'last_month':
        start = today.subtract(1, 'month').startOf('month').toDate();
        end = today.subtract(1, 'month').endOf('month').toDate();
        break;
      case 'this_year':
        start = today.startOf('year').toDate();
        end = today.endOf('year').toDate();
        break;
      case 'custom':
        start = dateRange[0];
        end = dateRange[1];
        break;
    }

    if (value !== 'custom') {
      setDateRange([start, end]);
    }
  };

  // --- FETCH STATS EFFECT ---
  useEffect(() => {
    async function fetchStats() {
      if (!hotelId || !dateRange[0] || !dateRange[1]) return;
      
      setLoadingStats(true);
      try {
        const startStr = dayjs(dateRange[0]).format('YYYY-MM-DD');
        const endStr = dayjs(dateRange[1]).format('YYYY-MM-DD');
        const res = await getBillingStats(hotelId, startStr, endStr);
        setStats(res);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoadingStats(false);
      }
    }

    fetchStats();
  }, [dateRange, hotelId]);

  // Filter List Logic
  const filteredReservations = useMemo(() => {
    if (!searchTerm) return initialReservations;
    const lower = searchTerm.toLowerCase();
    return initialReservations.filter(r => 
      r.guest?.full_name?.toLowerCase().includes(lower) ||
      r.room?.room_number?.toLowerCase().includes(lower)
    );
  }, [initialReservations, searchTerm]);

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
      <Box p="lg">
        <Paper withBorder p="xl" ta="center"><Text c="dimmed">Akun tidak terhubung ke hotel.</Text></Paper>
      </Box>
    );
  }

  return (
    // Penambahan p="lg" (padding large) di wrapper utama agar tidak mentok kiri/kanan/atas/bawah
    <Box p="lg">
      
      {/* HEADER DIHAPUS - Langsung masuk ke konten Statistik & Filter */}

      {/* --- STATISTICS & FILTERS SECTION --- */}
      <Grid mb="lg" align="stretch">
        {/* Revenue Card */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="lg" radius="md" h="100%">
            <Group justify="space-between" mb="md">
              <Text size="sm" fw={600} c="dimmed" tt="uppercase">Total Revenue</Text>
              <ActionIcon variant="light" color="teal" size="md" radius="md">
                <IconWallet size={18} />
              </ActionIcon>
            </Group>
            <Group align="flex-end" gap="xs">
              {loadingStats ? <Loader size="sm" color="teal" /> : (
                <Text fw={700} size="xl" c="teal.7">
                  Rp {stats.revenue.toLocaleString('id-ID')}
                </Text>
              )}
            </Group>
            <Text size="xs" c="dimmed" mt={8}>
              Total dari reservasi yang sudah dibayar
            </Text>
          </Paper>
        </Grid.Col>

        {/* Occupancy Card */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="lg" radius="md" h="100%">
            <Group justify="space-between" wrap="nowrap">
              <div>
                <Text size="sm" fw={600} c="dimmed" tt="uppercase">Occupancy Rate</Text>
                {loadingStats ? <Loader size="sm" mt="md" color="blue" /> : (
                  <Text fw={700} size="xl" mt="xs" c="blue.7">{stats.occupancy}%</Text>
                )}
                <Text size="xs" c="dimmed" mt={8}>Rata-rata penggunaan kamar</Text>
              </div>
              <RingProgress
                size={85}
                roundCaps
                thickness={8}
                sections={[{ value: stats.occupancy, color: 'blue' }]}
                label={
                  <Center>
                    <IconChartPie size={24} style={{ opacity: 0.5 }} />
                  </Center>
                }
              />
            </Group>
          </Paper>
        </Grid.Col>

        {/* Filters */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Flex direction="column" gap="sm" h="100%" justify="center">
              <Select 
                data={[
                  { label: 'Bulan Ini', value: 'this_month' },
                  { label: 'Bulan Lalu', value: 'last_month' },
                  { label: 'Tahun Ini', value: 'this_year' },
                  { label: 'Custom Range', value: 'custom' },
                ]}
                value={filterType}
                onChange={handleFilterChange}
                size="sm"
                leftSection={<IconCalendarStats size={16}/>}
              />
              <DatePickerInput
                type="range"
                placeholder="Pilih rentang tanggal"
                value={dateRange}
                onChange={(val) => {
                  setDateRange([val[0] ? new Date(val[0]) : null, val[1] ? new Date(val[1]) : null]);
                  if(filterType !== 'custom') setFilterType('custom');
                }}
                clearable={false}
                size="sm"
                disabled={filterType !== 'custom'}
              />
            </Flex>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* --- ACTIVE BILLINGS SECTION --- */}
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" mb="md">
          <Title order={4} fw={600} c="dark.7">Active Billings</Title>
          <TextInput
            placeholder="Cari tamu atau nomor kamar..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            style={{ width: 250 }}
          />
        </Group>

        <BillingList 
          reservations={filteredReservations} 
          onViewInvoice={handleOpenInvoice} 
        />
      </Paper>

      <ReservationInvoiceModal 
        opened={modalOpened} 
        onClose={handleCloseModal} 
        reservation={selectedRes}
      />
    </Box>
  );
}