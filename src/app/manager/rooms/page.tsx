'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Title,
  Button,
  Table,
  Group,
  Modal,
  TextInput,
  Stack,
  Paper,
  ActionIcon,
  Text,
  Box,
  Loader,
  Badge,
  Select,
  Center,
  Grid,
  MultiSelect,
} from '@mantine/core';
import { IconEdit, IconTrash, IconPlus, IconArrowLeft, IconSearch } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

// Interface
interface RoomType {
  id: string;
  name: string;
  price_per_night: number;
  capacity: number;
  created_at: string;
}

// Tipe Status Kamar (Kembali ke Tipe Awal)
type RoomStatus = 'available' | 'occupied' | 'maintenance';

interface Room {
  id: string;
  room_number: string;
  room_type_id: string;
  status: RoomStatus; // Gunakan tipe yang standar
  room_type?: RoomType;
  created_at: string;
}

// Komponen utama
function RoomsManagementContent() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  // Ambil assignedHotelId dari roles
  const assignedHotelId = profile?.roles?.find(r => r.hotel_id && r.role_name === 'Hotel Manager')?.hotel_id;

  // Modal State (Lengkap)
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('room_number_asc');
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]); // Tetap gunakan RoomStatus

  // Form (Lengkap untuk CRUD)
  const form = useForm({
    initialValues: {
        room_number: '',
        room_type_id: '',
        status: 'available' as RoomStatus, // Gunakan tipe standar
    },
    validate: {
        room_number: (value) => (!value ? 'Nomor kamar harus diisi' : null),
        room_type_id: (value) => (!value ? 'Tipe kamar harus dipilih' : null),
        status: (value) => (!value ? 'Status harus dipilih' : null),
    },
  });

  useEffect(() => {
    if (!authLoading && assignedHotelId) {
      fetchData();
    } else if (!authLoading && !assignedHotelId) {
      setLoading(false);
      notifications.show({ title: 'Error', message: 'Anda tidak terhubung ke hotel manapun.', color: 'red' });
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
        console.error("Error fetching room data:", error);
        notifications.show({ title: 'Error', message: error?.message || 'Gagal mengambil data kamar.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  // --- Filter & Sort Logic (Status disederhanakan) ---
  const filteredAndSortedRooms = useMemo(() => {
    let result = [...rooms];

    // Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(r => r.room_number.toLowerCase().includes(lowerSearch));
    }
    if (filterType.length > 0) {
      result = result.filter(r => filterType.includes(r.room_type_id));
    }
    if (filterStatus.length > 0) {
      result = result.filter(r => filterStatus.includes(r.status));
    }

    // Sort
    switch (sortBy) {
        // ... (case sort lainnya)
        case 'type_name_asc':
            result.sort((a, b) => (a.room_type?.name || '').localeCompare(b.room_type?.name || ''));
            break;
        case 'type_name_desc':
            result.sort((a, b) => (b.room_type?.name || '').localeCompare(a.room_type?.name || ''));
            break;
        // ... (case sort harga, kapasitas, dll)
        
        case 'status':
            // Urutkan: available -> maintenance -> occupied
            const statusOrder = { available: 1, maintenance: 2, occupied: 3 };
            result.sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
            break;
        case 'room_number_asc':
        default:
            result.sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));
            break;
    }

    return result;
  }, [rooms, searchTerm, sortBy, filterType, filterStatus]);


  // --- handleSubmit (Full CRUD) ---
  const handleSubmit = async (values: typeof form.values) => {
     if (!assignedHotelId) return;

    try {
      if (editingRoom) {
        // Update
        const { error } = await supabase
          .from('rooms')
          .update({
            room_number: values.room_number,
            room_type_id: values.room_type_id,
            status: values.status,
          })
          .eq('id', editingRoom.id);
        if (error) throw error;
        notifications.show({ title: 'Success', message: 'Kamar berhasil diperbarui', color: 'green' });
      } else {
        // Create
        const { error } = await supabase
          .from('rooms')
          .insert({
            hotel_id: assignedHotelId,
            room_number: values.room_number,
            room_type_id: values.room_type_id,
            status: values.status,
          });
        if (error) throw error;
        notifications.show({ title: 'Success', message: 'Kamar baru berhasil dibuat', color: 'green' });
      }
      handleCloseModal();
      await fetchData();
    } catch (error: any) {
      notifications.show({ title: 'Error', message: error?.message || 'Gagal menyimpan kamar', color: 'red' });
    }
  };

  // --- handleEdit (Full CRUD) ---
  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    form.setValues({
      room_number: room.room_number,
      room_type_id: room.room_type_id,
      status: room.status,
    });
    setModalOpened(true);
  };

  // --- handleDelete (Full CRUD) ---
  const handleDelete = async () => {
     if (!deleteTarget) return;
    try {
      // (Optional) Cek reservasi terkait
      // ...
      const { error } = await supabase.from('rooms').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      notifications.show({ title: 'Success', message: 'Kamar berhasil dihapus', color: 'green' });
      handleCloseDeleteModal();
      await fetchData();
    } catch (error: any) {
      notifications.show({ title: 'Error', message: error?.message || 'Gagal menghapus kamar', color: 'red' });
    }
  };

  // --- Close Handlers ---
  const handleCloseModal = () => {
    setModalOpened(false);
    setEditingRoom(null);
    form.reset();
  };
  const handleCloseDeleteModal = () => {
      setDeleteModalOpened(false);
      setDeleteTarget(null);
  };

  // --- Status Helpers (Disederhanakan) ---
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
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading || authLoading) {
     return (
      <Center style={{ minHeight: 'calc(100vh - 140px)' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  // Opsi Select Tipe Kamar (Modal)
  const roomTypeOptionsModal = roomTypes.map((rt) => ({
    value: rt.id,
    label: `${rt.name} (Rp ${rt.price_per_night.toLocaleString('id-ID')}/malam)`,
  }));

  // Opsi Filter Tipe Kamar
  const roomTypeFilterOptions = roomTypes.map((rt) => ({
    value: rt.id,
    label: rt.name,
  }));

  // Opsi Status (Modal) - Disederhanakan (Sesuai permintaan Anda)
  const statusOptionsModal = [
    { value: 'available', label: 'Tersedia' },
    { value: 'occupied', label: 'Terisi' }, // Manager boleh set manual
    { value: 'maintenance', label: 'Maintenance' },
  ];

  // Opsi Filter Status - Disederhanakan
  const statusFilterOptions = [
    { value: 'available', label: 'Tersedia' },
    { value: 'occupied', label: 'Terisi' },
    { value: 'maintenance', label: 'Maintenance' },
   ];

  return (
     <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        {/* Header Gradient (Manager) */}
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
                    <ActionIcon variant="transparent" color="white" onClick={() => router.push('/manager/dashboard')} aria-label="Kembali ke Dashboard Manager" >
                        <IconArrowLeft size={20} />
                    </ActionIcon>
                    <Title order={1} c="white"> Manajemen Kamar </Title>
                </Group>
                <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}> Kelola kamar hotel Anda </Text>
                </div>
                {/* Tombol "Tambah Kamar" */}
                <Button leftSection={<IconPlus size={18} />} onClick={() => { setEditingRoom(null); form.reset(); setModalOpened(true); }} disabled={roomTypes.length === 0} variant="white" color="blue" >
                    Tambah Kamar
                </Button>
            </Group>
            </Container>
        </div>

      <Container size="lg" pb="xl">
        <Stack gap="lg">
            {/* --- Filter & Search Inputs (statusFilterOptions disederhanakan) --- */}
            {roomTypes.length > 0 && rooms.length > 0 && (
                 <Paper shadow="xs" p="md" radius="md" withBorder mb="lg">
                 <Grid align="flex-end" gutter="md">
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <TextInput label="Cari Nomor Kamar" placeholder="Cari nomor..." leftSection={<IconSearch size={16} />} value={searchTerm} onChange={(event) => setSearchTerm(event.currentTarget.value)} />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <MultiSelect label="Filter Tipe Kamar" placeholder="Semua Tipe" data={roomTypeFilterOptions} value={filterType} onChange={setFilterType} clearable searchable nothingFoundMessage="Tipe tidak ditemukan" />
                    </Grid.Col>
                     <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                      <MultiSelect label="Filter Status" placeholder="Semua Status" data={statusFilterOptions} value={filterStatus} onChange={setFilterStatus} clearable />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 3 }}>
                      <Select label="Urutkan" value={sortBy} onChange={(value) => setSortBy(value || 'room_number_asc')}
                        data={[
                            { value: 'room_number_asc', label: 'No. Kamar (Asc)' },
                            { value: 'room_number_desc', label: 'No. Kamar (Desc)' },
                            { value: 'type_name_asc', label: 'Tipe (A-Z)' },
                            { value: 'type_name_desc', label: 'Tipe (Z-A)' },
                            // ... (sort by price/capacity bisa ditambahkan kembali jika perlu)
                            { value: 'status', label: 'Status' },
                        ]}
                      />
                    </Grid.Col>
                  </Grid>
                </Paper>
            )}

            {/* --- Table (Aksi CRUD Penuh) --- */}
            {roomTypes.length === 0 ? (
                <Paper shadow="sm" p="xl" radius="md" withBorder> <Box ta="center"> <Text c="dimmed" mb="md"> Anda perlu membuat Tipe Kamar terlebih dahulu di halaman Tipe Kamar. </Text> </Box> </Paper>
            ) : rooms.length === 0 ? (
                <Paper shadow="sm" p="xl" radius="md" withBorder> <Box ta="center"> <Text c="dimmed" mb="md"> Belum ada kamar. Klik tombol 'Tambah Kamar' di atas. </Text> </Box> </Paper>
            ) : filteredAndSortedRooms.length === 0 ? (
                <Paper shadow="sm" p="lg" radius="md" withBorder> <Text c="dimmed" ta="center" py="xl"> Tidak ada kamar yang cocok dengan filter atau pencarian Anda. </Text> </Paper>
            ) : (
                <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Table striped highlightOnHover>
                    <Table.Thead>
                    <Table.Tr>
                        <Table.Th>No. Kamar</Table.Th>
                        <Table.Th>Tipe Kamar</Table.Th>
                        <Table.Th>Harga/Malam</Table.Th>
                        <Table.Th>Kapasitas</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Aksi</Table.Th>
                    </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                    {filteredAndSortedRooms.map((room) => (
                        <Table.Tr key={room.id}>
                        <Table.Td fw={600}>{room.room_number}</Table.Td>
                        <Table.Td>{room.room_type?.name || 'N/A'}</Table.Td>
                        <Table.Td> Rp {room.room_type?.price_per_night.toLocaleString('id-ID') || '0'} </Table.Td>
                        <Table.Td>{room.room_type?.capacity || 0} orang</Table.Td>
                        <Table.Td> <Badge color={getStatusColor(room.status)} variant="light"> {getStatusLabel(room.status)} </Badge> </Table.Td>
                        <Table.Td>
                            <Group gap="xs">
                            <ActionIcon color="blue" variant="light" onClick={() => handleEdit(room)} aria-label={`Edit kamar ${room.room_number}`} > <IconEdit size={16} /> </ActionIcon>
                            <ActionIcon color="red" variant="light" onClick={() => { setDeleteTarget(room); setDeleteModalOpened(true); }} aria-label={`Hapus kamar ${room.room_number}`} > <IconTrash size={16} /> </ActionIcon>
                            </Group>
                        </Table.Td>
                        </Table.Tr>
                    ))}
                    </Table.Tbody>
                </Table>
                </Paper>
            )}
        </Stack>

        {/* --- Modal Add/Edit (statusOptionsModal disederhanakan) --- */}
        <Modal opened={modalOpened} onClose={handleCloseModal} title={editingRoom ? 'Edit Kamar' : 'Tambah Kamar Baru'} centered >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput label="Nomor Kamar" placeholder="Contoh: 101, 202, A-15" required {...form.getInputProps('room_number')} />
              <Select label="Tipe Kamar" placeholder="Pilih tipe kamar" data={roomTypeOptionsModal} required searchable nothingFoundMessage="Tipe kamar tidak ditemukan" {...form.getInputProps('room_type_id')} />
              <Select label="Status" placeholder="Pilih status" data={statusOptionsModal} required {...form.getInputProps('status')} />
              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={handleCloseModal}> Batal </Button>
                <Button type="submit"> {editingRoom ? 'Update Kamar' : 'Tambah Kamar'} </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* --- Modal Delete --- */}
        <Modal opened={deleteModalOpened} onClose={handleCloseDeleteModal} title="Hapus Kamar" centered size="sm" >
          <Stack gap="md">
            <Text size="sm"> Apakah Anda yakin ingin menghapus kamar <strong>{deleteTarget?.room_number}</strong>? Tindakan ini tidak dapat dibatalkan. </Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={handleCloseDeleteModal} > Batal </Button>
              <Button color="red" onClick={handleDelete}> Hapus Kamar </Button>
            </Group>
          </Stack>
        </Modal>
      </Container>
    </div>
  );
}

// Bungkus dengan ProtectedRoute
export default function ManagerRoomsPage() {
  return (
    <ProtectedRoute requiredRoleName="Hotel Manager">
      <RoomsManagementContent />
    </ProtectedRoute>
  );
}