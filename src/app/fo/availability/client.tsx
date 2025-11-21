// src/app/fo/availability/client.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Container, Title, Group, TextInput, Stack, Paper, ActionIcon, Text, Grid, MultiSelect, Select, Box, ThemeIcon
} from '@mantine/core';
import { IconArrowLeft, IconSearch, IconCalendarSearch } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import ReservationTapeChart from '@/components/ReservationChart/ReservationTapeChart';
import { RoomType } from '@/core/types/database';
import { RoomWithDetails } from './page';
import { AvailabilityTable } from './components/AvailabilityTable';

interface ClientProps {
  initialRooms: RoomWithDetails[];
  roomTypes: RoomType[];
}

export default function FoAvailabilityClient({ initialRooms, roomTypes }: ClientProps) {
  const router = useRouter();
  const MAX_WIDTH = 1200;

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('room_number_asc');
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  // --- Filter Logic ---
  const filteredRooms = useMemo(() => {
    let result = [...initialRooms];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((r) => r.room_number.toLowerCase().includes(lower));
    }
    if (filterType.length > 0) {
      result = result.filter((r) => filterType.includes(r.room_type_id));
    }
    if (filterStatus.length > 0) {
      result = result.filter((r) => filterStatus.includes(r.status));
    }

    switch (sortBy) {
      case 'room_number_desc':
        result.sort((a, b) => b.room_number.localeCompare(a.room_number, undefined, { numeric: true }));
        break;
      case 'price_asc':
        result.sort((a, b) => (a.room_type?.price_per_night || 0) - (b.room_type?.price_per_night || 0));
        break;
      default: // room_number_asc
        result.sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));
        break;
    }

    return result;
  }, [initialRooms, searchTerm, sortBy, filterType, filterStatus]);

  const roomTypeOptions = roomTypes.map((rt) => ({ value: rt.id, label: rt.name }));
  const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'occupied', label: 'Occupied' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'dirty', label: 'Dirty' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Ramping */}
      <div style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)', padding: '0.75rem 0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <Container fluid px="lg">
          <Box maw={MAX_WIDTH} mx="auto">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <ThemeIcon variant="light" color="white" size="lg" radius="md" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                  <IconCalendarSearch size={20} stroke={1.5} />
                </ThemeIcon>
                <div style={{ lineHeight: 1 }}>
                  <Title order={4} c="white" style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.2 }}>Ketersediaan Kamar</Title>
                  <Text c="white" opacity={0.8} size="xs" mt={2}>Monitoring status kamar & timeline</Text>
                </div>
              </Group>
              <ActionIcon variant="white" color="teal" size="lg" radius="md" onClick={() => router.push('/fo/dashboard')} aria-label="Kembali">
                <IconArrowLeft size={20} />
              </ActionIcon>
            </Group>
          </Box>
        </Container>
      </div>

      {/* Konten Utama */}
      <Container fluid px="lg" py="md">
        <Box maw={MAX_WIDTH} mx="auto">
          <Stack gap="lg">
            
            {/* Section: Visual Chart */}
            <Paper shadow="sm" p="sm" radius="md" withBorder>
              <Group mb="md">
                <Title order={5}>Timeline Okupansi</Title>
              </Group>
              <ReservationTapeChart />
            </Paper>

            {/* Section: Filter & Table */}
            <Paper shadow="xs" p="sm" radius="md" withBorder>
              <Grid align="flex-end" gutter="sm">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    placeholder="Cari nomor kamar..."
                    leftSection={<IconSearch size={16} stroke={1.5} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.currentTarget.value)}
                    size="sm"
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <MultiSelect
                    placeholder="Filter Tipe"
                    data={roomTypeOptions}
                    value={filterType}
                    onChange={setFilterType}
                    clearable
                    searchable
                    size="sm"
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <MultiSelect
                    placeholder="Filter Status"
                    data={statusOptions}
                    value={filterStatus}
                    onChange={setFilterStatus}
                    clearable
                    size="sm"
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 2 }}>
                  <Select
                    value={sortBy}
                    onChange={(v) => setSortBy(v || 'room_number_asc')}
                    data={[
                      { value: 'room_number_asc', label: 'No. Kamar (Asc)' },
                      { value: 'room_number_desc', label: 'No. Kamar (Desc)' },
                      { value: 'price_asc', label: 'Harga (Termurah)' },
                    ]}
                    size="sm"
                    allowDeselect={false}
                  />
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Tabel Data */}
            <AvailabilityTable data={filteredRooms} />
            
          </Stack>
        </Box>
      </Container>
    </div>
  );
}