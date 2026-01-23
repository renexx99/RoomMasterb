// src/app/fo/billing/client.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Container, Box, Group, ThemeIcon, Title, ActionIcon, Text,
  Paper, Grid, TextInput, Select, SimpleGrid, Card, RingProgress, Center, Loader, rem
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates'; // Pastikan install @mantine/dates
import { IconArrowLeft, IconCoin, IconSearch, IconCalendarStats, IconChartPie, IconWallet } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const MAX_WIDTH = 1200;

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
  }, [dateRange, hotelId]); // Trigger when dateRange changes

  // Filter List Logic
  const filteredReservations = useMemo(() => {
    if (!searchTerm) return initialReservations;
    const lower = searchTerm.toLowerCase();
    return initialReservations.filter(r => 
      r.guest?.full_name?.toLowerCase().includes(lower) ||
      r.room?.room_number?.toLowerCase().includes(lower)
    );
  }, [initialReservations, searchTerm]);

  // Handler Modal
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
                  <Text c="white" opacity={0.8} size="xs" mt={2}>Manage payments and revenue</Text>
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
          
          {/* --- STATISTICS SECTION --- */}
          <Title order={5} mb="xs" c="dimmed">Financial Overview</Title>
          <Grid mb="lg" align="flex-end">
            <Grid.Col span={{ base: 12, md: 8 }}>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  {/* Revenue Card */}
                  <Card shadow="sm" radius="md" padding="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="xs" c="dimmed" fw={700} tt="uppercase">Total Revenue (Paid)</Text>
                        <ThemeIcon color="green" variant="light" size="sm"><IconWallet size={16}/></ThemeIcon>
                    </Group>
                    <Group align="flex-end" gap="xs">
                        {loadingStats ? <Loader size="sm" color="teal" /> : (
                            <Text fw={700} size="xl" c="teal">
                            Rp {stats.revenue.toLocaleString('id-ID')}
                            </Text>
                        )}
                    </Group>
                    <Text size="xs" c="dimmed" mt={4}>
                        Dalam periode terpilih
                    </Text>
                  </Card>

                  {/* Occupancy Card */}
                  <Card shadow="sm" radius="md" padding="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Occupancy Rate</Text>
                            {loadingStats ? <Loader size="sm" mt="sm" color="blue" /> : (
                                <Text fw={700} size="xl" mt={4} c="blue">{stats.occupancy}%</Text>
                            )}
                            <Text size="xs" c="dimmed" mt={4}>Avg. utilization</Text>
                        </div>
                        <RingProgress
                            size={70}
                            roundCaps
                            thickness={6}
                            sections={[{ value: stats.occupancy, color: 'blue' }]}
                            label={
                            <Center>
                                <IconChartPie size={20} style={{ opacity: 0.5 }} />
                            </Center>
                            }
                        />
                    </Group>
                  </Card>
                </SimpleGrid>
            </Grid.Col>

            {/* Filters */}
            <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper shadow="sm" p="md" radius="md" withBorder h="100%">
                    <Group mb="xs">
                        <IconCalendarStats size={18} color="gray"/>
                        <Text size="sm" fw={500}>Filter Periode</Text>
                    </Group>
                    <Select 
                        data={[
                            { label: 'Bulan Ini', value: 'this_month' },
                            { label: 'Bulan Lalu', value: 'last_month' },
                            { label: 'Tahun Ini', value: 'this_year' },
                            { label: 'Custom Range', value: 'custom' },
                        ]}
                        value={filterType}
                        onChange={handleFilterChange}
                        mb="sm"
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
                        leftSection={<IconCalendarStats size={16}/>}
                        disabled={filterType !== 'custom'}
                    />
                </Paper>
            </Grid.Col>
          </Grid>

          {/* --- SEARCH & LIST SECTION --- */}
          <Title order={5} mb="xs" c="dimmed" mt="xl">Active Billings</Title>
          <Paper shadow="xs" p="sm" radius="md" withBorder mb="md">
            <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                        placeholder="Cari tamu aktif atau nomor kamar..."
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
            onViewInvoice={handleOpenInvoice} 
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