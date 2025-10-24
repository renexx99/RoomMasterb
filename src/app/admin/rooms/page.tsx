'use client';

import { useState, useEffect, useMemo } from 'react'; // Tambahkan useMemo
import {
  Container,
  Title,
  Button,
  Table,
  Group,
  Modal,
  TextInput, // Pastikan ada
  Stack,
  Paper,
  ActionIcon,
  Text,
  Box,
  Loader,
  Badge,
  Select,   // Pastikan ada
  NumberInput, // Tetap ada jika digunakan di modal
  Center,
  Grid,     // Tambahkan Grid
  MultiSelect, // Tambahkan MultiSelect
} from '@mantine/core';
import { IconEdit, IconTrash, IconPlus, IconArrowLeft, IconSearch } from '@tabler/icons-react'; // Tambahkan IconSearch
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface RoomType {
  id: string;
  name: string;
  price_per_night: number;
  capacity: number;
  created_at: string; // Tambahkan jika belum ada
}

interface Room {
  id: string;
  room_number: string;
  room_type_id: string;
  status: 'available' | 'occupied' | 'maintenance';
  room_type?: RoomType;
  created_at: string; // Tambahkan jika belum ada
}

export default function RoomsManagementPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('room_number_asc');
  const [filterType, setFilterType] = useState<string[]>([]); // Filter by room type IDs
  const [filterStatus, setFilterStatus] = useState<string[]>([]); // Filter by status

  const form = useForm({
    initialValues: {
        room_number: '',
        room_type_id: '',
        status: 'available' as 'available' | 'occupied' | 'maintenance',
    },
    validate: {
        room_number: (value) => (!value ? 'Nomor kamar harus diisi' : null),
        room_type_id: (value) => (!value ? 'Tipe kamar harus dipilih' : null),
    },
  });

  useEffect(() => {
    if (profile?.hotel_id) {
      fetchData();
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.hotel_id]);

   const fetchData = async () => {
    if (!profile?.hotel_id) return;

    try {
      setLoading(true);

      // Fetch room types (tanpa sort awal)
      const { data: typesData, error: typesError } = await supabase
        .from('room_types')
        .select('*')
        .eq('hotel_id', profile.hotel_id);
        // .order('name', { ascending: true }); // Hapus sort

      if (typesError) throw typesError;
      setRoomTypes(typesData || []);

      // Fetch rooms with room type info (tanpa sort awal)
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', profile.hotel_id);
        // .order('room_number', { ascending: true }); // Hapus sort

      if (roomsError) throw roomsError;

      // Merge room type data
      const roomsWithTypes = (roomsData || []).map((room) => ({
        ...room,
        room_type: typesData?.find((t) => t.id === room.room_type_id),
      }));

      setRooms(roomsWithTypes);
    } catch (error: any) {
        console.error("Error fetching room data:", error);
        notifications.show({
            title: 'Error',
            message: error?.message || 'Gagal mengambil data kamar.',
            color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Filter & Sort Logic for Rooms (Mirip Super Admin) ---
  const filteredAndSortedRooms = useMemo(() => {
    let result = [...rooms];

    // Filter by search term (room number)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(r => r.room_number.toLowerCase().includes(lowerSearch));
    }

    // Filter by room type
    if (filterType.length > 0) {
      result = result.filter(r => filterType.includes(r.room_type_id));
    }

    // Filter by status
    if (filterStatus.length > 0) {
      result = result.filter(r => filterStatus.includes(r.status));
    }

    // Sort
    switch (sortBy) {
        case 'room_number_desc':
            result.sort((a, b) => b.room_number.localeCompare(a.room_number, undefined, { numeric: true }));
            break;
        case 'type_name_asc':
            result.sort((a, b) => (a.room_type?.name || '').localeCompare(b.room_type?.name || ''));
            break;
        case 'type_name_desc':
            result.sort((a, b) => (b.room_type?.name || '').localeCompare(a.room_type?.name || ''));
            break;
        case 'price_asc':
            result.sort((a, b) => (a.room_type?.price_per_night || 0) - (b.room_type?.price_per_night || 0));
            break;
        case 'price_desc':
            result.sort((a, b) => (b.room_type?.price_per_night || 0) - (a.room_type?.price_per_night || 0));
            break;
        case 'capacity_asc':
            result.sort((a, b) => (a.room_type?.capacity || 0) - (b.room_type?.capacity || 0));
            break;
        case 'capacity_desc':
            result.sort((a, b) => (b.room_type?.capacity || 0) - (a.room_type?.capacity || 0));
            break;
        case 'status':
            // Urutkan berdasarkan status: available -> maintenance -> occupied
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


  const handleSubmit = async (values: typeof form.values) => {
    // ... (fungsi tetap sama) ...
     if (!profile?.hotel_id) return;

    try {
      if (editingRoom) {
        const { error } = await supabase
          .from('rooms')
          .update({
            room_number: values.room_number,
            room_type_id: values.room_type_id,
            status: values.status,
          })
          .eq('id', editingRoom.id);

        if (error) throw error;

        notifications.show({ title: 'Success', message: 'Room updated successfully', color: 'green' });
      } else {
        const { error } = await supabase
          .from('rooms')
          .insert({
            hotel_id: profile.hotel_id,
            room_number: values.room_number,
            room_type_id: values.room_type_id,
            status: values.status,
          });

        if (error) throw error;

        notifications.show({ title: 'Success', message: 'Room created successfully', color: 'green' });
      }
      handleCloseModal();
      await fetchData();
    } catch (error: any) {
      notifications.show({ title: 'Error', message: error?.message || 'Failed to save room', color: 'red' });
    }
  };

    const handleEdit = (room: Room) => {
    // ... (fungsi tetap sama) ...
    setEditingRoom(room);
    form.setValues({
      room_number: room.room_number,
      room_type_id: room.room_type_id,
      status: room.status,
    });
    setModalOpened(true);
  };


  const handleDelete = async () => {
    // ... (fungsi tetap sama) ...
     if (!deleteTarget) return;
     // Tambahkan pengecekan reservasi aktif jika diperlukan
     // const { count, error: checkError } = await supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('room_id', deleteTarget.id).eq('status', 'active'); // Ganti 'status' dengan kolom status reservasi yg relevan
     // if (checkError) throw checkError;
     // if (count > 0) { /* Tampilkan notifikasi error */ return; }

    try {
      const { error } = await supabase.from('rooms').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      notifications.show({ title: 'Success', message: 'Room deleted successfully', color: 'green' });
      setDeleteModalOpened(false);
      setDeleteTarget(null);
      await fetchData();
    } catch (error: any) {
      notifications.show({ title: 'Error', message: error?.message || 'Failed to delete room', color: 'red' });
    }
  };

  const handleCloseModal = () => {
    // ... (fungsi tetap sama) ...
    setModalOpened(false);
    setEditingRoom(null);
    form.reset();
  };

    const handleCloseDeleteModal = () => {
        // ... (fungsi tetap sama) ...
        setDeleteModalOpened(false);
        setDeleteTarget(null);
    };


  const getStatusColor = (status: string) => {
    // ... (fungsi tetap sama) ...
     switch (status) {
      case 'available': return 'green';
      case 'occupied': return 'red';
      case 'maintenance': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    // ... (fungsi tetap sama) ...
     switch (status) {
      case 'available': return 'Tersedia';
      case 'occupied': return 'Terisi';
      case 'maintenance': return 'Maintenance';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading) {
    // ... (loader tetap sama) ...
     return (
      <Center style={{ minHeight: 'calc(100vh - 140px)' }}> {/* Adjust height */}
        <Loader size="xl" />
      </Center>
    );
  }

  // Opsi untuk Select Tipe Kamar di Modal
  const roomTypeOptionsModal = roomTypes.map((rt) => ({
    value: rt.id,
    label: `${rt.name} (Rp ${rt.price_per_night.toLocaleString('id-ID')}/malam)`,
  }));

  // Opsi untuk Filter Tipe Kamar
  const roomTypeFilterOptions = roomTypes.map((rt) => ({
    value: rt.id,
    label: rt.name,
  }));

  // Opsi untuk Status di Modal (Hotel Admin mungkin hanya bisa set Available/Maintenance)
  const statusOptionsModal = [
    { value: 'available', label: 'Tersedia' },
    { value: 'maintenance', label: 'Maintenance' },
    // { value: 'occupied', label: 'Terisi' }, // Mungkin tidak diizinkan diubah manual oleh admin
  ];

  // Opsi untuk Filter Status
  const statusFilterOptions = [
    { value: 'available', label: 'Tersedia' },
    { value: 'occupied', label: 'Terisi' },
    { value: 'maintenance', label: 'Maintenance' },
   ];

  return (
     <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        {/* Header Gradient */}
        {/* ... (header tetap sama) ... */}
         <div
            style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Green Gradient
            padding: '2rem 0',
            marginBottom: '2rem',
            }}
        >
            <Container size="lg">
            <Group justify="space-between" align="center">
                <div>
                <Group mb="xs">
                    <ActionIcon variant="transparent" color="white" onClick={() => router.push('/admin/dashboard')} aria-label="Kembali ke Dashboard Admin" >
                        <IconArrowLeft size={20} />
                    </ActionIcon>
                    <Title order={1} c="white"> Manajemen Kamar </Title>
                </Group>
                <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}> Kelola kamar hotel Anda </Text>
                </div>
                <Button leftSection={<IconPlus size={18} />} onClick={() => { setEditingRoom(null); form.reset(); setModalOpened(true); }} disabled={roomTypes.length === 0} variant="white" color="teal" >
                    Tambah Kamar
                </Button>
            </Group>
            </Container>
        </div>

      <Container size="lg" pb="xl">
        <Stack gap="lg">
            {/* --- Filter & Search Inputs --- */}
            {roomTypes.length > 0 && rooms.length > 0 && ( // Tampilkan filter hanya jika ada data
                 <Paper shadow="xs" p="md" radius="md" withBorder mb="lg">
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

            {/* --- Table --- */}
            {roomTypes.length === 0 ? (
                // ... (pesan jika tidak ada tipe kamar) ...
                <Paper shadow="sm" p="xl" radius="md" withBorder>
                <Box ta="center"> <Text c="dimmed" mb="md"> Anda perlu Tipe Kamar untuk bisa menambahkan Kamar. Hubungi Super Admin. </Text> </Box>
                </Paper>
            ) : rooms.length === 0 ? (
                // ... (pesan jika tidak ada kamar sama sekali) ...
                <Paper shadow="sm" p="xl" radius="md" withBorder>
                <Box ta="center"> <Text c="dimmed" mb="md"> Belum ada kamar. Klik tombol 'Tambah Kamar' di atas. </Text> </Box>
                </Paper>
            ) : filteredAndSortedRooms.length === 0 ? (
                // Pesan jika filter/search tidak menghasilkan apa-apa
                <Paper shadow="sm" p="lg" radius="md" withBorder>
                    <Text c="dimmed" ta="center" py="xl"> Tidak ada kamar yang cocok dengan filter atau pencarian Anda. </Text>
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
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Aksi</Table.Th>
                    </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                    {/* Render Filtered & Sorted Rooms */}
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

        {/* --- Modals (Tetap Sama) --- */}
        {/* Modal Add/Edit */}
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

        {/* Delete Confirmation */}
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