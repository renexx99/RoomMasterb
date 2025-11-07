'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Title,
  Table,
  Group,
  TextInput,
  Stack,
  Paper,
  Text,
  Loader,
  Badge,
  Select,
  Center,
  Grid,
  MultiSelect,
  ActionIcon,
  Box,
} from '@mantine/core';
import { IconArrowLeft, IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
// --- Impor Tambahan ---
import ReservationTapeChart from '@/components/ReservationChart/ReservationTapeChart';

// Interface
interface RoomType {
  id: string;
  name: string;
  price_per_night: number;
  capacity: number;
  created_at: string;
}

type RoomStatus = 'available' | 'occupied' | 'maintenance';

interface Room {
  id: string;
  room_number: string;
  room_type_id: string;
  status: RoomStatus;
  room_type?: RoomType; // Relasi join
  created_at: string;
}

function AvailabilityContent() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  // Ambil assignedHotelId dari roles
  const assignedHotelId = profile?.roles?.find(
    (r) => r.hotel_id && r.role_name === 'Front Office'
  )?.hotel_id;

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('room_number_asc');
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>(['available']);

  useEffect(() => {
    if (!authLoading && assignedHotelId) {
      fetchData();
    } else if (!authLoading && !assignedHotelId) {
      setLoading(false);
      notifications.show({
        title: 'Error',
        message: 'Anda tidak terhubung ke hotel manapun.',
        color: 'red',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, assignedHotelId]);

  const fetchData = async () => {
    if (!assignedHotelId) return;
    try {
      setLoading(true);
      // Fetch room types
      const { data: typesData, error: typesError } = await supabase
        .from('room_types')
        .select('*')
        .eq('hotel_id', assignedHotelId);
      if (typesError) throw typesError;
      setRoomTypes(typesData || []);

      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', assignedHotelId);
      if (roomsError) throw roomsError;

      // Merge data
      const roomsWithTypes = (roomsData || []).map((room) => ({
        ...room,
        room_type: typesData?.find((t) => t.id === room.room_type_id),
      })) as Room[];

      setRooms(roomsWithTypes);
    } catch (error: any) {
      console.error('Error fetching room data:', error);
      notifications.show({
        title: 'Error',
        message: error?.message || 'Gagal mengambil data kamar.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Filter & Sort Logic (Sama seperti manager/rooms) ---
  const filteredAndSortedRooms = useMemo(() => {
    let result = [...rooms];

    // Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((r) =>
        r.room_number.toLowerCase().includes(lowerSearch)
      );
    }
    if (filterType.length > 0) {
      result = result.filter((r) => filterType.includes(r.room_type_id));
    }
    if (filterStatus.length > 0) {
      result = result.filter((r) => filterStatus.includes(r.status));
    }

    // Sort
    switch (sortBy) {
      case 'room_number_desc':
        result.sort((a, b) =>
          b.room_number.localeCompare(a.room_number, undefined, {
            numeric: true,
          })
        );
        break;
      case 'type_name_asc':
        result.sort((a, b) =>
          (a.room_type?.name || '').localeCompare(b.room_type?.name || '')
        );
        break;
      case 'type_name_desc':
        result.sort((a, b) =>
          (b.room_type?.name || '').localeCompare(a.room_type?.name || '')
        );
        break;
      case 'price_asc':
        result.sort(
          (a, b) =>
            (a.room_type?.price_per_night || 0) -
            (b.room_type?.price_per_night || 0)
        );
        break;
      case 'price_desc':
        result.sort(
          (a, b) =>
            (b.room_type?.price_per_night || 0) -
            (a.room_type?.price_per_night || 0)
        );
        break;
      case 'capacity_asc':
        result.sort(
          (a, b) => (a.room_type?.capacity || 0) - (b.room_type?.capacity || 0)
        );
        break;
      case 'capacity_desc':
        result.sort(
          (a, b) => (b.room_type?.capacity || 0) - (a.room_type?.capacity || 0)
        );
        break;
      case 'status':
        const statusOrder = { available: 1, maintenance: 2, occupied: 3 };
        result.sort(
          (a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99)
        );
        break;
      case 'room_number_asc':
      default:
        result.sort((a, b) =>
          a.room_number.localeCompare(b.room_number, undefined, {
            numeric: true,
          })
        );
        break;
    }

    return result;
  }, [rooms, searchTerm, sortBy, filterType, filterStatus]);

  // --- Status Helpers ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'green';
      case 'occupied':
        return 'red';
      case 'maintenance':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Tersedia';
      case 'occupied':
        return 'Terisi';
      case 'maintenance':
        return 'Maintenance';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading || authLoading) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 140px)' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  // Opsi Filter Tipe Kamar
  const roomTypeFilterOptions = roomTypes.map((rt) => ({
    value: rt.id,
    label: rt.name,
  }));

  // Opsi Filter Status
  const statusFilterOptions = [
    { value: 'available', label: 'Tersedia' },
    { value: 'occupied', label: 'Terisi' },
    { value: 'maintenance', label: 'Maintenance' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Halaman */}
      <div
        style={{
          background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)',
          padding: '2rem 0',
          marginBottom: '2rem',
        }}
      >
        <Container size="lg">
          <Group justify="space-between" align="center">
            <div>
              <Group mb="xs">
                <ActionIcon
                  variant="transparent"
                  color="white"
                  onClick={() => router.push('/fo/dashboard')}
                  aria-label="Kembali ke Dashboard"
                >
                  <IconArrowLeft size={20} />
                </ActionIcon>
                <Title order={1} c="white">
                  Status & Ketersediaan Kamar
                </Title>
              </Group>
              <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>
                Lihat status semua kamar dan cari ketersediaan.
              </Text>
            </div>
            {/* Tidak ada tombol 'Tambah Kamar' untuk FO */}
          </Group>
        </Container>
      </div>

      <Container size="lg" pb="xl">
        <Stack gap="lg">
          
          {/* --- [PENAMBAHAN] TAPE CHART --- */}
          <Title order={2} mb="xs">
            Visual Tape Chart
          </Title>
          <ReservationTapeChart />
          {/* --- AKHIR PENAMBAHAN --- */}


          {/* --- [ASLI] Filter & Search Inputs --- */}
          {roomTypes.length > 0 && rooms.length > 0 && (
            <Paper shadow="xs" p="md" radius="md" withBorder mb="lg" mt="xl">
              <Title order={3} mb="md">
                Filter Tabel Kamar
              </Title>
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
                    nothingFoundMessage="Tipe tidak ditemukan"
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                  <MultiSelect
                    label="Filter Status Saat Ini"
                    placeholder="Semua Status"
                    data={statusFilterOptions}
                    value={filterStatus} // Menggunakan state
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
                      { value: 'type_name_desc', label: 'Tipe (Z-A)' },
                      { value: 'price_asc', label: 'Harga Termurah' },
                      { value: 'price_desc', label: 'Harga Termahal' },
                      { value: 'capacity_asc', label: 'Kapasitas Terkecil' },
                      { value: 'capacity_desc', label: 'Kapasitas Terbesar' },
                      { value: 'status', label: 'Status' },
                    ]}
                  />
                </Grid.Col>
              </Grid>
            </Paper>
          )}

          {/* --- [ASLI] Table (READ ONLY) --- */}
          {roomTypes.length === 0 ? (
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Box ta="center">
                <Text c="dimmed" mb="md">
                  Hotel ini belum memiliki Tipe Kamar.
                </Text>
              </Box>
            </Paper>
          ) : rooms.length === 0 ? (
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Box ta="center">
                <Text c="dimmed" mb="md">
                  Hotel ini belum memiliki data kamar.
                </Text>
              </Box>
            </Paper>
          ) : filteredAndSortedRooms.length === 0 ? (
            <Paper shadow="sm" p="lg" radius="md" withBorder>
              <Text c="dimmed" ta="center" py="xl">
                Tidak ada kamar yang cocok dengan filter atau pencarian Anda.
              </Text>
            </Paper>
          ) : (
            <Paper shadow="sm" p="lg" radius="md" withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>No. Kamar</Table.Th>
                    <Table.Th>Tipe Kamar</Table.Th>
                    <Table.Th>Harga/Malam</Table.Th>
                    <Table.Th>Kapasitas</Table.Th>
                    <Table.Th>Status Saat Ini</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredAndSortedRooms.map((room) => (
                    <Table.Tr key={room.id}>
                      <Table.Td fw={600}>{room.room_number}</Table.Td>
                      <Table.Td>{room.room_type?.name || 'N/A'}</Table.Td>
                      <Table.Td>
                        Rp {room.room_type?.price_per_night.toLocaleString('id-ID') || '0'}
                      </Table.Td>
                      <Table.Td>{room.room_type?.capacity || 0} orang</Table.Td>
                      <Table.Td>
                        <Badge
                          color={getStatusColor(room.status)}
                          variant="light"
                        >
                          {getStatusLabel(room.status)}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          )}
        </Stack>
      </Container>
    </div>
  );
}

// Bungkus dengan ProtectedRoute
export default function AvailabilityPage() {
  return (
    <ProtectedRoute requiredRoleName="Front Office">
      <AvailabilityContent />
    </ProtectedRoute>
  );
}