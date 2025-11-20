'use client';

import { useState, useMemo } from 'react';
import {
  Container,
  Title,
  Group,
  TextInput,
  Stack,
  Paper,
  ActionIcon,
  Text,
  Grid,
  MultiSelect,
  Select,
  Box
} from '@mantine/core';
import { IconArrowLeft, IconSearch } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import ReservationTapeChart from '@/components/ReservationChart/ReservationTapeChart';
import { RoomType } from '@/core/types/database';
import { RoomWithType } from './page';
// Import komponen lokal
import { AvailabilityTable } from './components/AvailabilityTable';

interface ClientProps {
  initialRooms: RoomWithType[];
  roomTypes: RoomType[];
}

export default function FoAvailabilityClient({ initialRooms, roomTypes }: ClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('room_number_asc');
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>(['available']);

  // Filter & Sort Logic
  const filteredAndSortedRooms = useMemo(() => {
    let result = [...initialRooms];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((r) => r.room_number.toLowerCase().includes(lowerSearch));
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
      case 'type_name_asc':
        result.sort((a, b) => (a.room_type?.name || '').localeCompare(b.room_type?.name || ''));
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

  const roomTypeFilterOptions = roomTypes.map((rt) => ({ value: rt.id, label: rt.name }));
  const statusFilterOptions = [
    { value: 'available', label: 'Tersedia' },
    { value: 'occupied', label: 'Terisi' },
    { value: 'maintenance', label: 'Maintenance' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)', padding: '2rem 0', marginBottom: '2rem' }}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <div>
              <Group mb="xs">
                <ActionIcon variant="transparent" color="white" onClick={() => router.push('/fo/dashboard')}>
                  <IconArrowLeft size={20} />
                </ActionIcon>
                <Title order={1} c="white">Status & Ketersediaan Kamar</Title>
              </Group>
              <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>
                Lihat status semua kamar dan cari ketersediaan.
              </Text>
            </div>
          </Group>
        </Container>
      </div>

      <Container size="lg" pb="xl">
        <Stack gap="lg">
          <Title order={2} mb="xs">Visual Tape Chart</Title>
          <ReservationTapeChart />

          {/* Filter Section */}
          <Paper shadow="xs" p="md" radius="md" withBorder mb="lg" mt="xl">
            <Title order={3} mb="md">Filter Tabel Kamar</Title>
            <Grid align="flex-end" gutter="md">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  label="Cari Nomor Kamar"
                  placeholder="Cari nomor..."
                  leftSection={<IconSearch size={16} />}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.currentTarget.value)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <MultiSelect
                  label="Filter Tipe Kamar"
                  placeholder="Semua Tipe"
                  data={roomTypeFilterOptions}
                  value={filterType}
                  onChange={setFilterType}
                  clearable
                  searchable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                <MultiSelect
                  label="Filter Status"
                  placeholder="Semua Status"
                  data={statusFilterOptions}
                  value={filterStatus}
                  onChange={setFilterStatus}
                  clearable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  label="Urutkan"
                  value={sortBy}
                  onChange={(value) => setSortBy(value || 'room_number_asc')}
                  data={[
                    { value: 'room_number_asc', label: 'No. Kamar (Asc)' },
                    { value: 'room_number_desc', label: 'No. Kamar (Desc)' },
                    { value: 'type_name_asc', label: 'Tipe (A-Z)' },
                    { value: 'price_asc', label: 'Harga Termurah' },
                  ]}
                />
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Menggunakan Komponen Tabel Lokal */}
          {initialRooms.length === 0 ? (
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Box ta="center"><Text c="dimmed">Belum ada data kamar.</Text></Box>
            </Paper>
          ) : (
            <AvailabilityTable rooms={filteredAndSortedRooms} />
          )}
        </Stack>
      </Container>
    </div>
  );
}