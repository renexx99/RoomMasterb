'use client';

import { useState, useEffect } from 'react';
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
  NumberInput,
  Center, // Pastikan NumberInput diimpor jika diperlukan di modal
} from '@mantine/core';
import { IconEdit, IconTrash, IconPlus, IconArrowLeft } from '@tabler/icons-react'; // Tambahkan IconArrowLeft
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation'; // Tambahkan useRouter

interface RoomType {
  id: string;
  name: string;
  price_per_night: number;
  capacity: number;
}

interface Room {
  id: string;
  room_number: string;
  room_type_id: string;
  status: 'available' | 'occupied' | 'maintenance';
  room_type?: RoomType;
}

export default function RoomsManagementPage() {
  const { profile } = useAuth();
  const router = useRouter(); // Inisialisasi router
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

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

  // ... (fetchData, handleSubmit, handleEdit, handleDelete, handleCloseModal tetap sama) ...
   const fetchData = async () => {
    if (!profile?.hotel_id) return;

    try {
      setLoading(true);

      // Fetch room types
      const { data: typesData, error: typesError } = await supabase
        .from('room_types')
        .select('*')
        .eq('hotel_id', profile.hotel_id)
        .order('name', { ascending: true });

      if (typesError) throw typesError;
      setRoomTypes(typesData || []);

      // Fetch rooms with room type info
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', profile.hotel_id)
        .order('room_number', { ascending: true });

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

  const handleSubmit = async (values: typeof form.values) => {
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

        notifications.show({
          title: 'Success',
          message: 'Room updated successfully',
          color: 'green',
        });
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

        notifications.show({
          title: 'Success',
          message: 'Room created successfully',
          color: 'green',
        });
      }
      handleCloseModal();
      await fetchData(); // Use await here
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error?.message || 'Failed to save room',
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
    });
    setModalOpened(true);
  };


  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      notifications.show({
        title: 'Success',
        message: 'Room deleted successfully',
        color: 'green',
      });

      setDeleteModalOpened(false);
      setDeleteTarget(null);
      await fetchData(); // Use await here
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error?.message || 'Failed to delete room',
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

  if (loading) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 140px)' }}> {/* Adjust height */}
        <Loader size="xl" />
      </Center>
    );
  }

  const roomTypeOptions = roomTypes.map((rt) => ({
    value: rt.id,
    label: `${rt.name} (Rp ${rt.price_per_night.toLocaleString('id-ID')}/malam)`, // Indonesian locale
  }));

  const statusOptions = [
    { value: 'available', label: 'Tersedia' },
    // Hotel admin should ideally not set occupied directly, maybe only maintenance
    // { value: 'occupied', label: 'Terisi' },
    { value: 'maintenance', label: 'Maintenance' },
  ];

  return (
     <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        {/* Header Gradient */}
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
                    <ActionIcon
                    variant="transparent"
                    color="white"
                    onClick={() => router.push('/admin/dashboard')} // Navigate back to admin dashboard
                    aria-label="Kembali ke Dashboard Admin"
                    >
                    <IconArrowLeft size={20} />
                    </ActionIcon>
                    <Title order={1} c="white">
                        Manajemen Kamar
                    </Title>
                </Group>
                <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>
                    Kelola kamar hotel Anda
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
                    variant="white" // Button style for contrast
                    color="teal"      // Text color matches theme
                >
                    Tambah Kamar
                </Button>
            </Group>
            </Container>
        </div>

      <Container size="lg" pb="xl"> {/* Added bottom padding */}
        <Stack gap="lg">
           {/* Removed the old header Group */}

          {roomTypes.length === 0 ? (
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Box ta="center">
                <Text c="dimmed" mb="md">
                  Anda perlu Tipe Kamar untuk bisa menambahkan Kamar. Hubungi Super Admin.
                </Text>
              </Box>
            </Paper>
          ) : rooms.length === 0 ? (
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Box ta="center">
                <Text c="dimmed" mb="md">
                  Belum ada kamar. Klik tombol 'Tambah Kamar' di atas.
                </Text>
                 {/* Button moved to header */}
              </Box>
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
                  {rooms.map((room) => (
                    <Table.Tr key={room.id}>
                      <Table.Td fw={600}>{room.room_number}</Table.Td>
                      <Table.Td>{room.room_type?.name || 'N/A'}</Table.Td>
                      <Table.Td>
                        Rp {room.room_type?.price_per_night.toLocaleString('id-ID') || '0'}
                      </Table.Td>
                      <Table.Td>{room.room_type?.capacity || 0} orang</Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(room.status)} variant="light">
                          {getStatusLabel(room.status)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            color="blue"
                            variant="light"
                            onClick={() => handleEdit(room)}
                            aria-label={`Edit kamar ${room.room_number}`}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            color="red"
                            variant="light"
                            onClick={() => {
                              setDeleteTarget(room);
                              setDeleteModalOpened(true);
                            }}
                            aria-label={`Hapus kamar ${room.room_number}`}
                          >
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

        {/* Modal Add/Edit */}
        <Modal
          opened={modalOpened}
          onClose={handleCloseModal}
          title={editingRoom ? 'Edit Kamar' : 'Tambah Kamar Baru'}
          centered
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Nomor Kamar"
                placeholder="Contoh: 101, 202, A-15"
                required
                {...form.getInputProps('room_number')}
              />
              <Select
                label="Tipe Kamar"
                placeholder="Pilih tipe kamar"
                data={roomTypeOptions}
                required
                searchable
                 nothingFoundMessage="Tipe kamar tidak ditemukan"
                {...form.getInputProps('room_type_id')}
              />
              <Select
                label="Status"
                placeholder="Pilih status"
                data={statusOptions}
                required
                {...form.getInputProps('status')}
              />
              <Group justify="flex-end" mt="md"> {/* Added margin-top */}
                <Button variant="default" onClick={handleCloseModal}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingRoom ? 'Update Kamar' : 'Tambah Kamar'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* Delete Confirmation */}
        <Modal
          opened={deleteModalOpened}
          onClose={handleCloseDeleteModal}
          title="Hapus Kamar"
          centered
          size="sm"
        >
          <Stack gap="md">
            <Text size="sm">
              Apakah Anda yakin ingin menghapus kamar <strong>{deleteTarget?.room_number}</strong>? Tindakan ini tidak dapat dibatalkan.
            </Text>
            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={handleCloseDeleteModal}
              >
                Batal
              </Button>
              <Button color="red" onClick={handleDelete}>
                Hapus Kamar
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Container>
    </div>
  );
}