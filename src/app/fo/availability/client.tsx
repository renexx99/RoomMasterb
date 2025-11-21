// src/app/fo/availability/client.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Container, Title, Group, TextInput, Stack, Paper, ActionIcon, Text, 
  Grid, MultiSelect, Box, ThemeIcon, Badge
} from '@mantine/core';
import { IconArrowLeft, IconSearch, IconCalendarSearch, IconFilter } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import ReservationTapeChart from '@/components/ReservationChart/ReservationTapeChart';
import { RoomType } from '@/core/types/database';
import { RoomWithDetails, ReservationDetails } from './page';

interface ClientProps {
  initialRooms: RoomWithDetails[];
  initialReservations: ReservationDetails[]; // Tambahan props
  roomTypes: RoomType[];
}

export default function FoAvailabilityClient({ initialRooms, initialReservations, roomTypes }: ClientProps) {
  const router = useRouter();
  const MAX_WIDTH = 1400; // Perlebar container agar chart lebih lega

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  // --- Filter Rooms Logic ---
  // Chart resource hanya akan menampilkan kamar yang sesuai filter
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
    
    return result;
  }, [initialRooms, searchTerm, filterType, filterStatus]);

  // Options
  const roomTypeOptions = roomTypes.map((rt) => ({ value: rt.id, label: rt.name }));
  const statusOptions = [
    { value: 'available', label: 'Available (Tersedia)' },
    { value: 'occupied', label: 'Occupied (Terisi)' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'dirty', label: 'Dirty (Kotor)' },
  ];

  const handleEventClick = (id: string) => {
    // Navigasi ke detail reservasi (bisa juga buka modal di sini)
    // router.push(`/fo/reservations?id=${id}`);
    console.log("Klik event:", id);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)', padding: '1rem 0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <Container fluid px="xl">
          <Box maw={MAX_WIDTH} mx="auto">
            <Group justify="space-between" align="center">
              <Group gap="sm">
                <ThemeIcon variant="white" color="teal" size="xl" radius="md">
                  <IconCalendarSearch size={24} stroke={1.5} />
                </ThemeIcon>
                <div>
                  <Title order={3} c="white">Ketersediaan & Timeline</Title>
                  <Text c="teal.0" size="sm" opacity={0.9}>Monitoring okupansi kamar secara visual</Text>
                </div>
              </Group>
              <ActionIcon variant="white" color="teal" size="lg" radius="md" onClick={() => router.push('/fo/dashboard')}>
                <IconArrowLeft size={20} />
              </ActionIcon>
            </Group>
          </Box>
        </Container>
      </div>

      {/* Konten Utama */}
      <Container fluid px="xl" py="lg">
        <Box maw={MAX_WIDTH} mx="auto">
          <Stack gap="lg">
            
            {/* Filter Bar (Di Atas Chart) */}
            <Paper shadow="xs" p="md" radius="md" withBorder>
              <Grid align="flex-end">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Cari Nomor Kamar"
                    placeholder="Contoh: 101"
                    leftSection={<IconSearch size={16} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <MultiSelect
                    label="Filter Tipe Kamar"
                    placeholder="Semua Tipe"
                    data={roomTypeOptions}
                    value={filterType}
                    onChange={setFilterType}
                    clearable
                    searchable
                    leftSection={<IconFilter size={16} />}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <MultiSelect
                    label="Status Fisik Kamar"
                    placeholder="Semua Status"
                    data={statusOptions}
                    value={filterStatus}
                    onChange={setFilterStatus}
                    clearable
                  />
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Visual Chart */}
            <Paper shadow="sm" p={0} radius="md" withBorder style={{ overflow: 'hidden' }}>
               <Box p="md" bg="gray.0" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                  <Group justify="space-between">
                      <Title order={5}>Timeline Kamar</Title>
                      <Group gap="xs">
                          <Badge color="teal" variant="dot">Paid</Badge>
                          <Badge color="orange" variant="dot">Pending</Badge>
                          <Badge color="red" variant="dot">Cancelled</Badge>
                      </Group>
                  </Group>
               </Box>
               
               {/* Chart Component */}
               <Box p="xs">
                  <ReservationTapeChart 
                    rooms={filteredRooms} 
                    reservations={initialReservations}
                    onEventClick={handleEventClick}
                  />
               </Box>
            </Paper>

          </Stack>
        </Box>
      </Container>
    </div>
  );
}