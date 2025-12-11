'use client';

import { useState, useMemo } from 'react';
import {
  Container, Title, Button, Group, Paper, TextInput, Select,
  Text, Box, Grid, MultiSelect, ActionIcon, Modal, Stack, Center
} from '@mantine/core';
import { IconPlus, IconArrowLeft, IconSearch } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { RoomType, Room } from '@/core/types/database';
import { RoomWithDetails } from './page';
import { RoomFormModal } from './components/RoomFormModal';
import { RoomCard } from './components/RoomCard';
import { deleteRoomAction } from './actions';

interface ClientProps {
  initialRooms: RoomWithDetails[];
  roomTypes: RoomType[];
  hotelId: string;
}

export default function RoomsManagementClient({ initialRooms, roomTypes, hotelId }: ClientProps) {
  const router = useRouter();
  
  // State
  const rooms = initialRooms;
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomWithDetails | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoomWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('room_number_asc');
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterFloor, setFilterFloor] = useState<string[]>([]);

  // Unique Floors for Filter
  const uniqueFloors = useMemo(() => {
    const floors = new Set<number>();
    rooms.forEach(r => { if (r.floor_number) floors.add(r.floor_number); });
    return Array.from(floors).sort((a, b) => a - b).map(f => ({ value: f.toString(), label: `Lantai ${f}` }));
  }, [rooms]);

  // Filter Logic
  const filteredRooms = useMemo(() => {
    let result = [...rooms];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => r.room_number.toLowerCase().includes(lower));
    }
    if (filterType.length > 0) result = result.filter(r => filterType.includes(r.room_type_id));
    if (filterStatus.length > 0) result = result.filter(r => filterStatus.includes(r.status));
    if (filterFloor.length > 0) result = result.filter(r => r.floor_number && filterFloor.includes(r.floor_number.toString()));

    // Sorting
    switch (sortBy) {
      case 'room_number_desc': result.sort((a, b) => b.room_number.localeCompare(a.room_number, undefined, { numeric: true })); break;
      case 'floor_asc': result.sort((a, b) => (a.floor_number || 0) - (b.floor_number || 0)); break;
      case 'floor_desc': result.sort((a, b) => (b.floor_number || 0) - (a.floor_number || 0)); break;
      case 'status': 
        const statusOrder: Record<string, number> = { available: 1, maintenance: 2, occupied: 3 };
        result.sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
        break;
      case 'room_number_asc': default: result.sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true })); break;
    }
    return result;
  }, [rooms, searchTerm, sortBy, filterType, filterStatus, filterFloor]);

  // Handlers
  const handleCreate = () => { setEditingRoom(null); setModalOpened(true); };
  const handleEdit = (room: RoomWithDetails) => { setEditingRoom(room); setModalOpened(true); };
  
  const handleDeleteConfirm = (room: RoomWithDetails) => {
    setDeleteTarget(room);
    setDeleteModalOpened(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const res = await deleteRoomAction(deleteTarget.id);
    setIsDeleting(false);

    if (res.error) {
        notifications.show({ title: 'Gagal', message: res.error, color: 'red' });
    } else {
        notifications.show({ title: 'Sukses', message: 'Kamar dihapus', color: 'green' });
        setDeleteModalOpened(false);
        setDeleteTarget(null);
    }
  };

  return (
    <Box style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <Box style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', padding: '2rem 0', marginBottom: '2rem' }}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <div>
              <Group mb="xs">
                <ActionIcon variant="transparent" color="white" onClick={() => router.push('/manager/dashboard')}>
                  <IconArrowLeft size={20} />
                </ActionIcon>
                <Title order={1} c="white">Manajemen Kamar</Title>
              </Group>
              <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>
                Kelola detail inventaris kamar hotel
              </Text>
            </div>
            <Button leftSection={<IconPlus size={18} />} onClick={handleCreate} disabled={roomTypes.length === 0} variant="white" color="blue">
              Tambah Kamar
            </Button>
          </Group>
        </Container>
      </Box>

      {/* Content */}
      <Container size="lg" pb="xl">
        <Stack gap="lg">
          
          {/* Filters */}
          {roomTypes.length > 0 && (
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
                    data={roomTypes.map(rt => ({ value: rt.id, label: rt.name }))}
                    value={filterType}
                    onChange={setFilterType}
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                  <MultiSelect
                    label="Status"
                    placeholder="Semua"
                    data={['available', 'occupied', 'maintenance']}
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

          {/* Room List */}
          {roomTypes.length === 0 ? (
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Center><Text c="dimmed">Buat Tipe Kamar terlebih dahulu di menu Tipe Kamar.</Text></Center>
            </Paper>
          ) : filteredRooms.length === 0 ? (
            <Paper shadow="sm" p="lg" radius="md" withBorder>
              <Center><Text c="dimmed">Tidak ada kamar yang sesuai filter.</Text></Center>
            </Paper>
          ) : (
            <Grid>
              {filteredRooms.map((room) => (
                <Grid.Col key={room.id} span={{ base: 12, sm: 6, md: 4 }}>
                  <RoomCard 
                    room={room} 
                    onEdit={handleEdit} 
                    onDelete={handleDeleteConfirm} 
                  />
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Stack>
      </Container>

      {/* Modals */}
      <RoomFormModal 
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        hotelId={hotelId}
        itemToEdit={editingRoom}
        roomTypes={roomTypes}
      />

      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="Hapus Kamar"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Apakah Anda yakin ingin menghapus kamar <strong>{deleteTarget?.room_number}</strong>?
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteModalOpened(false)} disabled={isDeleting}>
              Batal
            </Button>
            <Button color="red" onClick={executeDelete} loading={isDeleting}>
              Hapus
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}