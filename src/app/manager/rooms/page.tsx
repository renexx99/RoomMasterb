// src/app/manager/rooms/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Container, Title, Button, Group, Modal, TextInput, Stack,
  Paper, ActionIcon, Text, Box, Loader, Badge, Select, Center,
  Grid, MultiSelect, Card, ThemeIcon, Divider, NumberInput,
  Textarea, Tabs
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import '@mantine/dates/styles.css';
import {
  IconEdit, IconTrash, IconPlus, IconArrowLeft, IconSearch,
  IconBuildingWarehouse, IconMapPin, IconTool, IconCalendar,
  IconNote
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

// Types
type RoomStatus = 'available' | 'occupied' | 'maintenance';
type FurnitureCondition = 'excellent' | 'good' | 'fair' | 'needs_replacement';
type WingType = 'North Wing' | 'South Wing' | 'East Wing' | 'West Wing' | 'Central';

interface RoomType {
  id: string;
  name: string;
  price_per_night: number;
  capacity: number;
  bed_type?: string;
}

interface Room {
  id: string;
  room_number: string;
  room_type_id: string;
  status: RoomStatus;
  floor_number?: number;
  wing?: WingType;
  furniture_condition?: FurnitureCondition;
  last_renovation_date?: string;
  special_notes?: string;
  room_type?: RoomType;
  created_at: string;
}

// Constants
const WING_TYPES = [
  { value: 'North Wing', label: 'North Wing' },
  { value: 'South Wing', label: 'South Wing' },
  { value: 'East Wing', label: 'East Wing' },
  { value: 'West Wing', label: 'West Wing' },
  { value: 'Central', label: 'Central Building' },
];

const FURNITURE_CONDITIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'needs_replacement', label: 'Needs Replacement' },
];

const STATUS_OPTIONS = [
  { value: 'available', label: 'Tersedia' },
  { value: 'occupied', label: 'Terisi' },
  { value: 'maintenance', label: 'Maintenance' },
];

function RoomsContent() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('room_number_asc');
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterFloor, setFilterFloor] = useState<string[]>([]);

  const assignedHotelId = profile?.roles?.find(
    r => r.hotel_id && r.role_name === 'Hotel Manager'
  )?.hotel_id;

  const form = useForm({
    initialValues: {
      room_number: '',
      room_type_id: '',
      status: 'available' as RoomStatus,
      floor_number: 1,
      wing: '' as WingType | '',
      furniture_condition: 'good' as FurnitureCondition,
      last_renovation_date: null as Date | null,
      special_notes: '',
    },
    validate: {
      room_number: (v) => (!v ? 'Nomor kamar harus diisi' : null),
      room_type_id: (v) => (!v ? 'Tipe kamar harus dipilih' : null),
      status: (v) => (!v ? 'Status harus dipilih' : null),
      floor_number: (v) => (v < 1 ? 'Lantai minimal 1' : null),
    },
  });

  useEffect(() => {
    if (!authLoading && assignedHotelId) {
      fetchData();
    } else if (!authLoading && !assignedHotelId) {
      setLoading(false);
      notifications.show({
        title: 'Error',
        message: 'Tidak terhubung ke hotel',
        color: 'red',
      });
    }
  }, [authLoading, assignedHotelId]);

  const fetchData = async () => {
    if (!assignedHotelId) return;
    try {
      setLoading(true);
      const [typesRes, roomsRes] = await Promise.all([
        supabase.from('room_types').select('*').eq('hotel_id', assignedHotelId),
        supabase.from('rooms').select('*').eq('hotel_id', assignedHotelId),
      ]);

      if (typesRes.error) throw typesRes.error;
      if (roomsRes.error) throw roomsRes.error;

      setRoomTypes(typesRes.data || []);
      const roomsWithTypes = (roomsRes.data || []).map((room) => ({
        ...room,
        room_type: typesRes.data?.find((t) => t.id === room.room_type_id),
      })) as Room[];
      setRooms(roomsWithTypes);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error?.message || 'Gagal mengambil data',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get unique floors for filter
  const uniqueFloors = useMemo(() => {
    const floors = new Set<number>();
    rooms.forEach(r => {
      if (r.floor_number) floors.add(r.floor_number);
    });
    return Array.from(floors).sort((a, b) => a - b).map(f => ({
      value: f.toString(),
      label: `Lantai ${f}`
    }));
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    let result = [...rooms];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => r.room_number.toLowerCase().includes(lower));
    }
    if (filterType.length > 0) {
      result = result.filter(r => filterType.includes(r.room_type_id));
    }
    if (filterStatus.length > 0) {
      result = result.filter(r => filterStatus.includes(r.status));
    }
    if (filterFloor.length > 0) {
      result = result.filter(r => 
        r.floor_number && filterFloor.includes(r.floor_number.toString())
      );
    }

    switch (sortBy) {
      case 'room_number_desc':
        result.sort((a, b) => b.room_number.localeCompare(a.room_number, undefined, { numeric: true }));
        break;
      case 'floor_asc':
        result.sort((a, b) => (a.floor_number || 0) - (b.floor_number || 0));
        break;
      case 'floor_desc':
        result.sort((a, b) => (b.floor_number || 0) - (a.floor_number || 0));
        break;
      case 'status':
        const statusOrder = { available: 1, maintenance: 2, occupied: 3 };
        result.sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
        break;
      case 'room_number_asc':
      default:
        result.sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));
        break;
    }

    return result;
  }, [rooms, searchTerm, sortBy, filterType, filterStatus, filterFloor]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!assignedHotelId) return;
    try {
      const payload = {
        hotel_id: assignedHotelId,
        room_number: values.room_number,
        room_type_id: values.room_type_id,
        status: values.status,
        floor_number: values.floor_number,
        wing: values.wing || null,
        furniture_condition: values.furniture_condition,
        last_renovation_date: values.last_renovation_date?.toISOString().split('T')[0] || null,
        special_notes: values.special_notes || null,
      };

      if (editingRoom) {
        const { error } = await supabase
          .from('rooms')
          .update(payload)
          .eq('id', editingRoom.id);
        if (error) throw error;
        notifications.show({
          title: 'Sukses',
          message: 'Kamar berhasil diperbarui',
          color: 'green',
        });
      } else {
        const { error } = await supabase.from('rooms').insert(payload);
        if (error) throw error;
        notifications.show({
          title: 'Sukses',
          message: 'Kamar berhasil dibuat',
          color: 'green',
        });
      }
      handleCloseModal();
      await fetchData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error?.message || 'Gagal menyimpan',
        color: 'red',
      });
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    form.setValues({
      room_number: room.room_number,
      room_type_id: room.room_type_id,
      status: room.status,
      floor_number: room.floor_number || 1,
      wing: (room.wing as WingType) || '',
      furniture_condition: (room.furniture_condition as FurnitureCondition) || 'good',
      last_renovation_date: room.last_renovation_date ? new Date(room.last_renovation_date) : null,
      special_notes: room.special_notes || '',
    });
    setModalOpened(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from('rooms').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      notifications.show({
        title: 'Sukses',
        message: 'Kamar berhasil dihapus',
        color: 'green',
      });
      handleCloseDeleteModal();
      await fetchData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error?.message || 'Gagal menghapus',
        color: 'red',
      });
    }
  };

  const handleCloseModal = () => {
    setModalOpened(false);
    setEditingRoom(null);
    form.reset();
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpened(false);
    setDeleteTarget(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'green';
      case 'occupied': return 'red';
      case 'maintenance': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Tersedia';
      case 'occupied': return 'Terisi';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };

  const getFurnitureColor = (condition?: string) => {
    switch (condition) {
      case 'excellent': return 'teal';
      case 'good': return 'blue';
      case 'fair': return 'yellow';
      case 'needs_replacement': return 'red';
      default: return 'gray';
    }
  };

  if (loading || authLoading) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 140px)' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  const roomTypeOptions = roomTypes.map(rt => ({
    value: rt.id,
    label: `${rt.name} - Rp ${rt.price_per_night.toLocaleString('id-ID')}/malam`,
  }));

  const roomTypeFilterOptions = roomTypes.map(rt => ({
    value: rt.id,
    label: rt.name,
  }));

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
                  onClick={() => router.push('/manager/dashboard')}
                >
                  <IconArrowLeft size={20} />
                </ActionIcon>
                <Title order={1} c="white">
                  Manajemen Kamar
                </Title>
              </Group>
              <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>
                Kelola detail inventaris kamar hotel
              </Text>
            </div>
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => {
                setEditingRoom(null);
                form.reset();
                setModalOpened(true);
              }}
              disabled={roomTypes.length === 0}
              variant="white"
              color="blue"
            >
              Tambah Kamar
            </Button>
          </Group>
        </Container>
      </div>

      <Container size="lg" pb="xl">
        <Stack gap="lg">
          {/* Filters */}
          {roomTypes.length > 0 && rooms.length > 0 && (
            <Paper shadow="xs" p="md" radius="md" withBorder>
              <Grid align="flex-end" gutter="md">
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <TextInput
                    label="Cari Nomor Kamar"
                    placeholder="Cari..."
                    leftSection={<IconSearch size={16} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                  <MultiSelect
                    label="Tipe Kamar"
                    placeholder="Semua"
                    data={roomTypeFilterOptions}
                    value={filterType}
                    onChange={setFilterType}
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                  <MultiSelect
                    label="Status"
                    placeholder="Semua"
                    data={STATUS_OPTIONS}
                    value={filterStatus}
                    onChange={setFilterStatus}
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                  <MultiSelect
                    label="Lantai"
                    placeholder="Semua"
                    data={uniqueFloors}
                    value={filterFloor}
                    onChange={setFilterFloor}
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Select
                    label="Urutkan"
                    value={sortBy}
                    onChange={(v) => setSortBy(v || 'room_number_asc')}
                    data={[
                      { value: 'room_number_asc', label: 'No. Kamar (Asc)' },
                      { value: 'room_number_desc', label: 'No. Kamar (Desc)' },
                      { value: 'floor_asc', label: 'Lantai (Asc)' },
                      { value: 'floor_desc', label: 'Lantai (Desc)' },
                      { value: 'status', label: 'Status' },
                    ]}
                  />
                </Grid.Col>
              </Grid>
            </Paper>
          )}

          {/* Cards */}
          {roomTypes.length === 0 ? (
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Box ta="center">
                <Text c="dimmed">
                  Buat Tipe Kamar terlebih dahulu
                </Text>
              </Box>
            </Paper>
          ) : rooms.length === 0 ? (
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Box ta="center">
                <Text c="dimmed">Belum ada kamar</Text>
              </Box>
            </Paper>
          ) : filteredRooms.length === 0 ? (
            <Paper shadow="sm" p="lg" radius="md" withBorder>
              <Text c="dimmed" ta="center">
                Tidak ada hasil
              </Text>
            </Paper>
          ) : (
            <Grid>
              {filteredRooms.map((room) => (
                <Grid.Col key={room.id} span={{ base: 12, sm: 6, md: 4 }}>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Stack gap="xs">
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Text fw={700} size="xl">
                            {room.room_number}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {room.room_type?.name || 'N/A'}
                          </Text>
                        </div>
                        <Group gap={4}>
                          <ActionIcon
                            variant="light"
                            color="blue"
                            size="sm"
                            onClick={() => handleEdit(room)}
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="sm"
                            onClick={() => {
                              setDeleteTarget(room);
                              setDeleteModalOpened(true);
                            }}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Group>

                      <Badge
                        color={getStatusColor(room.status)}
                        variant="light"
                        size="sm"
                      >
                        {getStatusLabel(room.status)}
                      </Badge>

                      <Divider />

                      <Stack gap={4}>
                        {room.floor_number && (
                          <Group gap={6}>
                            <ThemeIcon size="xs" variant="light" color="indigo">
                              <IconBuildingWarehouse size={12} />
                            </ThemeIcon>
                            <Text size="xs">Lantai {room.floor_number}</Text>
                          </Group>
                        )}
                        {room.wing && (
                          <Group gap={6}>
                            <ThemeIcon size="xs" variant="light" color="cyan">
                              <IconMapPin size={12} />
                            </ThemeIcon>
                            <Text size="xs">{room.wing}</Text>
                          </Group>
                        )}
                        {room.furniture_condition && (
                          <Group gap={6}>
                            <ThemeIcon
                              size="xs"
                              variant="light"
                              color={getFurnitureColor(room.furniture_condition)}
                            >
                              <IconTool size={12} />
                            </ThemeIcon>
                            <Text size="xs" tt="capitalize">
                              {room.furniture_condition.replace('_', ' ')}
                            </Text>
                          </Group>
                        )}
                        {room.last_renovation_date && (
                          <Group gap={6}>
                            <ThemeIcon size="xs" variant="light" color="violet">
                              <IconCalendar size={12} />
                            </ThemeIcon>
                            <Text size="xs">
                              Renovasi:{' '}
                              {new Date(
                                room.last_renovation_date
                              ).toLocaleDateString('id-ID')}
                            </Text>
                          </Group>
                        )}
                        {room.special_notes && (
                          <Group gap={6} align="flex-start">
                            <ThemeIcon size="xs" variant="light" color="gray">
                              <IconNote size={12} />
                            </ThemeIcon>
                            <Text size="xs" lineClamp={2}>
                              {room.special_notes}
                            </Text>
                          </Group>
                        )}
                      </Stack>
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Stack>
      </Container>

      {/* Modal Add/Edit */}
      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={editingRoom ? 'Edit Kamar' : 'Tambah Kamar'}
        size="lg"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Tabs defaultValue="basic">
            <Tabs.List>
              <Tabs.Tab value="basic">Info Dasar</Tabs.Tab>
              <Tabs.Tab value="details">Detail</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="basic" pt="md">
              <Stack gap="md">
                <TextInput
                  label="Nomor Kamar"
                  placeholder="101, 202, A-15..."
                  required
                  {...form.getInputProps('room_number')}
                />
                <Select
                  label="Tipe Kamar"
                  placeholder="Pilih tipe"
                  data={roomTypeOptions}
                  required
                  searchable
                  {...form.getInputProps('room_type_id')}
                />
                <Select
                  label="Status"
                  data={STATUS_OPTIONS}
                  required
                  {...form.getInputProps('status')}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="details" pt="md">
              <Stack gap="md">
                <Grid>
                  <Grid.Col span={6}>
                    <NumberInput
                      label="Lantai"
                      min={1}
                      {...form.getInputProps('floor_number')}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Select
                      label="Wing/Lokasi"
                      placeholder="Pilih"
                      data={WING_TYPES}
                      clearable
                      {...form.getInputProps('wing')}
                    />
                  </Grid.Col>
                </Grid>
                <Select
                  label="Kondisi Furniture"
                  data={FURNITURE_CONDITIONS}
                  {...form.getInputProps('furniture_condition')}
                />
                <DateInput
                  label="Tanggal Renovasi Terakhir"
                  placeholder="Pilih tanggal"
                  valueFormat="DD MMMM YYYY"
                  clearable
                  {...form.getInputProps('last_renovation_date')}
                />
                <Textarea
                  label="Catatan Khusus"
                  placeholder="Catatan tambahan..."
                  minRows={2}
                  {...form.getInputProps('special_notes')}
                />
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button type="submit">
              {editingRoom ? 'Update' : 'Tambah'}
            </Button>
          </Group>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={handleCloseDeleteModal}
        title="Hapus Kamar"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Hapus kamar <strong>{deleteTarget?.room_number}</strong>?
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={handleCloseDeleteModal}>
              Batal
            </Button>
            <Button color="red" onClick={handleDelete}>
              Hapus
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}

export default function ManagerRoomsPage() {
  return (
    <ProtectedRoute requiredRoleName="Hotel Manager">
      <RoomsContent />
    </ProtectedRoute>
  );
}