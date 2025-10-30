// src/app/manager/room-types/page.tsx
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
  Center,
  Grid,
  Select,
  NumberInput,
} from '@mantine/core';
import { IconEdit, IconTrash, IconPlus, IconArrowLeft, IconSearch } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { RoomType } from '@/core/types/database';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'; // Import ProtectedRoute

function RoomTypesManagementContent() {
  const { profile, loading: authLoading } = useAuth(); // Gunakan useAuth
  const router = useRouter();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  // Ambil assignedHotelId dari roles
  const assignedHotelId = profile?.roles?.find(r => r.hotel_id && r.role_name === 'Hotel Manager')?.hotel_id;

  // Modal State
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoomType | null>(null);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');

  const form = useForm({
    initialValues: {
      name: '',
      price_per_night: 0,
      capacity: 1,
    },
    validate: {
      name: (value) => (!value ? 'Nama tipe kamar harus diisi' : null),
      price_per_night: (value) =>
        value <= 0 ? 'Harga harus lebih besar dari 0' : null,
      capacity: (value) => (value <= 0 ? 'Kapasitas minimal 1 orang' : null),
    },
  });

  useEffect(() => {
    if (!authLoading && assignedHotelId) {
      fetchRoomTypes();
    } else if (!authLoading && !assignedHotelId) {
      // Handle jika manager tidak punya hotel assignment
      setLoading(false);
      notifications.show({
        title: 'Error',
        message: 'Anda tidak terhubung ke hotel manapun.',
        color: 'red',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, assignedHotelId]);

  const fetchRoomTypes = async () => {
    if (!assignedHotelId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .eq('hotel_id', assignedHotelId); // Filter berdasarkan assignedHotelId

      if (error) throw error;
      setRoomTypes(data || []);
    } catch (error: any) {
      console.error("Error fetching room types:", error);
      notifications.show({
        title: 'Error Pengambilan Data',
        message: error?.message || 'Gagal mengambil data tipe kamar.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort Logic (Sama seperti admin)
  const filteredAndSortedRoomTypes = useMemo(() => {
    let result = [...roomTypes];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(rt => rt.name.toLowerCase().includes(lowerSearch));
    }
    switch (sortBy) {
      case 'name_desc': result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'price_asc': result.sort((a, b) => a.price_per_night - b.price_per_night); break;
      case 'price_desc': result.sort((a, b) => b.price_per_night - a.price_per_night); break;
      case 'capacity_asc': result.sort((a, b) => a.capacity - b.capacity); break;
      case 'capacity_desc': result.sort((a, b) => b.capacity - b.capacity); break;
      case 'name_asc': default: result.sort((a, b) => a.name.localeCompare(a.name)); break;
    }
    return result;
  }, [roomTypes, searchTerm, sortBy]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!assignedHotelId) return; // Guard

    try {
      if (editingRoomType) {
        // Update
        const { error } = await supabase
          .from('room_types')
          .update({
            name: values.name,
            price_per_night: values.price_per_night,
            capacity: values.capacity,
          })
          .eq('id', editingRoomType.id);
        if (error) throw error;
        notifications.show({ title: 'Sukses', message: 'Tipe kamar berhasil diperbarui', color: 'green' });
      } else {
        // Create
        const { error } = await supabase.from('room_types').insert({
          hotel_id: assignedHotelId, // Gunakan assignedHotelId
          name: values.name,
          price_per_night: values.price_per_night,
          capacity: values.capacity,
        });
        if (error) throw error;
        notifications.show({ title: 'Sukses', message: 'Tipe kamar berhasil dibuat', color: 'green' });
      }
      handleCloseModal();
      await fetchRoomTypes();
    } catch (error: any) {
      console.error("Error saving room type:", error);
      notifications.show({ title: 'Error Penyimpanan', message: error?.message || 'Gagal menyimpan tipe kamar.', color: 'red' });
    }
  };

  const handleEdit = (roomType: RoomType) => {
    // ... (logic sama seperti admin)
    setEditingRoomType(roomType);
    form.setValues({ name: roomType.name, price_per_night: roomType.price_per_night, capacity: roomType.capacity });
    setModalOpened(true);
  };

  const handleDelete = async () => {
    // ... (logic sama seperti admin)
    if (!deleteTarget) return;
    try {
      const { count, error: checkError } = await supabase.from('rooms')
        .select('*', { count: 'exact', head: true }).eq('room_type_id', deleteTarget.id);
      if (checkError) throw checkError;
      if (count !== null && count > 0) {
        notifications.show({ title: 'Gagal Hapus', message: `Tidak dapat menghapus, tipe kamar digunakan oleh ${count} kamar.`, color: 'orange' });
        setDeleteModalOpened(false); setDeleteTarget(null); return;
      }
      const { error } = await supabase.from('room_types').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      notifications.show({ title: 'Sukses', message: 'Tipe kamar berhasil dihapus', color: 'green' });
      handleCloseDeleteModal();
      await fetchRoomTypes();
    } catch (error: any) {
      console.error("Error deleting room type:", error);
      notifications.show({ title: 'Error Penghapusan', message: error?.message || 'Gagal menghapus tipe kamar.', color: 'red' });
    }
  };

  const handleCloseModal = () => { /* ... (sama) ... */ setModalOpened(false); setEditingRoomType(null); form.reset(); };
  const handleCloseDeleteModal = () => { /* ... (sama) ... */ setDeleteModalOpened(false); setDeleteTarget(null); };

  if (loading || authLoading) { // Cek authLoading juga
    return (
      <Center style={{ minHeight: 'calc(100vh - 140px)' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Gradient */}
      <div
        style={{
          // Gunakan style header biru dari manager/layout
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
                  onClick={() => router.push('/manager/dashboard')} // Ganti ke dashboard manager
                  aria-label="Kembali ke Dashboard Manager" // Ganti label
                >
                  <IconArrowLeft size={20} />
                </ActionIcon>
                <Title order={1} c="white">
                  Manajemen Tipe Kamar
                </Title>
              </Group>
              <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>
                Kelola tipe kamar hotel Anda
              </Text>
            </div>
            {/* Tombol Tambah (karena CRUD penuh) */}
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => { setEditingRoomType(null); form.reset(); setModalOpened(true); }}
              variant="white"
              color="blue" // Sesuaikan warna
            >
              Tambah Tipe Kamar
            </Button>
          </Group>
        </Container>
      </div>

      <Container size="lg" pb="xl">
        {/* ... (Sisa JSX sama seperti admin/room-types) ... */}
         <Stack gap="lg">
          {/* Filter & Search Inputs */}
          {roomTypes.length > 0 && (
            <Paper shadow="xs" p="md" radius="md" withBorder mb="lg">
              <Grid align="flex-end" gutter="md">
                <Grid.Col span={{ base: 12, sm: 8 }}>
                  <TextInput label="Cari Tipe Kamar" placeholder="Cari berdasarkan nama..." leftSection={<IconSearch size={16} />} value={searchTerm} onChange={(event) => setSearchTerm(event.currentTarget.value)} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <Select label="Urutkan" value={sortBy} onChange={(value) => setSortBy(value || 'name_asc')}
                    data={[
                      { value: 'name_asc', label: 'Nama (A-Z)' },
                      { value: 'name_desc', label: 'Nama (Z-A)' },
                      { value: 'price_asc', label: 'Harga Termurah' },
                      { value: 'price_desc', label: 'Harga Termahal' },
                      { value: 'capacity_asc', label: 'Kapasitas Terkecil' },
                      { value: 'capacity_desc', label: 'Kapasitas Terbesar' },
                    ]}
                  />
                </Grid.Col>
              </Grid>
            </Paper>
          )}

          {/* Table */}
          {roomTypes.length === 0 ? (
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Box ta="center"> <Text c="dimmed" mb="md"> Belum ada tipe kamar. Klik tombol 'Tambah Tipe Kamar' di atas. </Text> </Box>
            </Paper>
          ) : filteredAndSortedRoomTypes.length === 0 ? (
            <Paper shadow="sm" p="lg" radius="md" withBorder> <Text c="dimmed" ta="center" py="xl"> Tidak ada tipe kamar yang cocok dengan pencarian Anda. </Text> </Paper>
          ) : (
            <Paper shadow="sm" p="lg" radius="md" withBorder>
              <Table striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Nama Tipe</Table.Th>
                    <Table.Th>Harga / Malam</Table.Th>
                    <Table.Th>Kapasitas</Table.Th>
                    <Table.Th ta="center">Aksi</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredAndSortedRoomTypes.map((rt) => (
                    <Table.Tr key={rt.id}>
                      <Table.Td fw={500}>{rt.name}</Table.Td>
                      <Table.Td>Rp {rt.price_per_night.toLocaleString('id-ID')}</Table.Td>
                      <Table.Td>{rt.capacity} orang</Table.Td>
                      <Table.Td>
                        <Group gap="xs" justify="center">
                          <ActionIcon variant="light" color="blue" onClick={() => handleEdit(rt)} aria-label={`Edit tipe kamar ${rt.name}`}>
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon variant="light" color="red" onClick={() => { setDeleteTarget(rt); setDeleteModalOpened(true); }} aria-label={`Hapus tipe kamar ${rt.name}`}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          )}
        </Stack>
      </Container>

      {/* Modal Add/Edit Room Type (Sama) */}
      <Modal opened={modalOpened} onClose={handleCloseModal} title={editingRoomType ? 'Edit Tipe Kamar' : 'Tambah Tipe Kamar Baru'} centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput label="Nama Tipe Kamar" placeholder="Contoh: Standard, Deluxe, Suite" required {...form.getInputProps('name')} />
            <NumberInput label="Harga per Malam (Rp)" placeholder="Masukkan harga" required min={1} step={1000} thousandSeparator="." decimalSeparator="," hideControls {...form.getInputProps('price_per_night')} />
            <NumberInput label="Kapasitas (orang)" placeholder="Masukkan kapasitas" required min={1} allowDecimal={false} {...form.getInputProps('capacity')} />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={handleCloseModal}> Batal </Button>
              <Button type="submit"> {editingRoomType ? 'Update Tipe Kamar' : 'Simpan Tipe Kamar'} </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal Delete Confirmation (Sama) */}
      <Modal opened={deleteModalOpened} onClose={handleCloseDeleteModal} title="Konfirmasi Hapus Tipe Kamar" centered size="sm">
        <Stack gap="md">
          <Text size="sm"> Apakah Anda yakin ingin menghapus tipe kamar{' '} <strong>{deleteTarget?.name}</strong>? Tindakan ini tidak dapat dibatalkan. </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={handleCloseDeleteModal}> Batal </Button>
            <Button color="red" onClick={handleDelete}> Hapus Tipe Kamar </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}

// Bungkus dengan ProtectedRoute
export default function ManagerRoomTypesPage() {
  return (
    <ProtectedRoute requiredRoleName="Hotel Manager">
      <RoomTypesManagementContent />
    </ProtectedRoute>
  );
}