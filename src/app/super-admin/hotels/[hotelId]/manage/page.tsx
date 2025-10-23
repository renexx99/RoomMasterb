'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Tabs,
  NumberInput,
  Select,
  Loader,
  Center,
  Badge,
  Tooltip,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconArrowLeft,
  IconBed,
  IconCategory,
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

interface RoomType {
  id: string;
  name: string;
  price_per_night: number;
  capacity: number;
  hotel_id: string;
}

interface Room {
  id: string;
  room_number: string;
  room_type_id: string;
  status: 'available' | 'occupied' | 'maintenance';
  hotel_id: string;
  room_type?: RoomType;
}

function HotelManageContent() {
  const params = useParams();
  const router = useRouter();
  const hotelId = params.hotelId as string;

  const [hotelName, setHotelName] = useState<string>('');
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Room Type Modals
  const [roomTypeModalOpened, setRoomTypeModalOpened] = useState(false);
  const [roomTypeDeleteModalOpened, setRoomTypeDeleteModalOpened] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
  const [deleteTargetRoomType, setDeleteTargetRoomType] = useState<RoomType | null>(null);

  // Room Modals
  const [roomModalOpened, setRoomModalOpened] = useState(false);
  const [roomDeleteModalOpened, setRoomDeleteModalOpened] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteTargetRoom, setDeleteTargetRoom] = useState<Room | null>(null);

  const roomTypeForm = useForm({
    initialValues: {
      name: '',
      price_per_night: 0,
      capacity: 1,
    },
    validate: {
      name: (value) => (!value ? 'Nama tipe kamar harus diisi' : null),
      price_per_night: (value) =>
        value <= 0 ? 'Harga harus lebih besar dari 0' : null,
      capacity: (value) => (value <= 0 ? 'Kapasitas minimal 1' : null),
    },
  });

  const roomForm = useForm({
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
    if (hotelId) {
      fetchData();
    }
  }, [hotelId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch hotel name
      const { data: hotelData, error: hotelError } = await supabase
        .from('hotels')
        .select('name')
        .eq('id', hotelId)
        .maybeSingle();

      if (hotelError) throw hotelError;
      if (hotelData) setHotelName(hotelData.name);

      // Fetch room types
      const { data: roomTypesData, error: roomTypesError } = await supabase
        .from('room_types')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('name', { ascending: true });

      if (roomTypesError) throw roomTypesError;
      setRoomTypes(roomTypesData || []);

      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('room_number', { ascending: true });

      if (roomsError) throw roomsError;

      // Merge room type data with rooms
      const roomsWithTypes = (roomsData || []).map((room) => ({
        ...room,
        room_type: roomTypesData?.find((rt) => rt.id === room.room_type_id),
      }));

      setRooms(roomsWithTypes);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Gagal mengambil data',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Room Type CRUD Handlers ---
  const handleRoomTypeSubmit = async (values: typeof roomTypeForm.values) => {
    try {
      if (editingRoomType) {
        const { error } = await supabase
          .from('room_types')
          .update({
            name: values.name,
            price_per_night: values.price_per_night,
            capacity: values.capacity,
          })
          .eq('id', editingRoomType.id);

        if (error) throw error;
        notifications.show({
          title: 'Sukses',
          message: 'Tipe kamar berhasil diperbarui',
          color: 'green',
        });
      } else {
        const { error } = await supabase.from('room_types').insert({
          hotel_id: hotelId,
          name: values.name,
          price_per_night: values.price_per_night,
          capacity: values.capacity,
        });

        if (error) throw error;
        notifications.show({
          title: 'Sukses',
          message: 'Tipe kamar berhasil dibuat',
          color: 'green',
        });
      }
      roomTypeForm.reset();
      setRoomTypeModalOpened(false);
      setEditingRoomType(null);
      fetchData(); // Refresh data
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error?.message || 'Gagal menyimpan tipe kamar',
        color: 'red',
      });
    }
  };

  const handleRoomTypeDelete = async () => {
    if (!deleteTargetRoomType) return;
    try {
      const { error } = await supabase
        .from('room_types')
        .delete()
        .eq('id', deleteTargetRoomType.id);

      if (error) throw error;
      notifications.show({
        title: 'Sukses',
        message: 'Tipe kamar berhasil dihapus',
        color: 'green',
      });
      setRoomTypeDeleteModalOpened(false);
      setDeleteTargetRoomType(null);
      fetchData(); // Refresh data
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error?.message || 'Gagal menghapus tipe kamar',
        color: 'red',
      });
    }
  };

  const handleCloseRoomTypeModal = () => {
      setRoomTypeModalOpened(false);
      setEditingRoomType(null);
      roomTypeForm.reset();
  };

  // --- Room CRUD Handlers ---
  const handleRoomSubmit = async (values: typeof roomForm.values) => {
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
          title: 'Sukses',
          message: 'Kamar berhasil diperbarui',
          color: 'green',
        });
      } else {
        const { error } = await supabase.from('rooms').insert({
          hotel_id: hotelId,
          room_number: values.room_number,
          room_type_id: values.room_type_id,
          status: values.status,
        });

        if (error) throw error;
        notifications.show({
          title: 'Sukses',
          message: 'Kamar berhasil dibuat',
          color: 'green',
        });
      }
      roomForm.reset();
      setRoomModalOpened(false);
      setEditingRoom(null);
      fetchData(); // Refresh data
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error?.message || 'Gagal menyimpan kamar',
        color: 'red',
      });
    }
  };

  const handleRoomDelete = async () => {
    if (!deleteTargetRoom) return;
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', deleteTargetRoom.id);

      if (error) throw error;
      notifications.show({
        title: 'Sukses',
        message: 'Kamar berhasil dihapus',
        color: 'green',
      });
      setRoomDeleteModalOpened(false);
      setDeleteTargetRoom(null);
      fetchData(); // Refresh data
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error?.message || 'Gagal menghapus kamar',
        color: 'red',
      });
    }
  };

  const handleCloseRoomModal = () => {
      setRoomModalOpened(false);
      setEditingRoom(null);
      roomForm.reset();
  };


  // --- Helper Functions ---
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

  // --- Loading State ---
  if (loading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  // --- Data for Select Inputs ---
  const roomTypeOptions = roomTypes.map((rt) => ({
    value: rt.id,
    label: `${rt.name} (Rp ${rt.price_per_night.toLocaleString()}/malam, ${rt.capacity} org)`,
  }));

  const statusOptions = [
    { value: 'available', label: 'Tersedia' },
    { value: 'occupied', label: 'Terisi' },
    { value: 'maintenance', label: 'Maintenance' },
  ];

  const noRoomTypes = roomTypes.length === 0;

  // --- JSX ---
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '2rem 0',
          marginBottom: '2rem',
        }}
      >
        <Container size="lg">
          <Group mb="xs" align="center">
            <ActionIcon
              variant="transparent"
              color="white"
              onClick={() => router.push('/super-admin/hotels')}
              aria-label="Kembali ke Manajemen Hotel"
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Title order={1} c="white" style={{ flexGrow: 1 }}>
              Kelola Kamar & Tipe - {hotelName || 'Memuat...'}
            </Title>
          </Group>
          <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}> {/* Indentasi teks deskripsi */}
            Atur tipe kamar dan daftar kamar untuk hotel ini.
          </Text>
        </Container>
      </div>

      <Container size="lg" pb="xl">
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Tabs defaultValue="room-types">
            <Tabs.List grow>
              <Tabs.Tab value="room-types" leftSection={<IconCategory size={16} />}>
                Tipe Kamar ({roomTypes.length})
              </Tabs.Tab>
              <Tabs.Tab value="rooms" leftSection={<IconBed size={16} />}>
                Daftar Kamar ({rooms.length})
              </Tabs.Tab>
            </Tabs.List>

            {/* Room Types Tab Panel */}
            <Tabs.Panel value="room-types" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between">
                  <Title order={3}>Manajemen Tipe Kamar</Title>
                  <Button
                    leftSection={<IconPlus size={18} />}
                    onClick={() => {
                      setEditingRoomType(null);
                      roomTypeForm.reset();
                      setRoomTypeModalOpened(true);
                    }}
                  >
                    Tambah Tipe Kamar
                  </Button>
                </Group>

                {roomTypes.length === 0 ? (
                  <Text c="dimmed" ta="center" py="xl">
                    Belum ada tipe kamar untuk hotel ini. Silakan tambahkan tipe kamar baru.
                  </Text>
                ) : (
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
                      {roomTypes.map((rt) => (
                        <Table.Tr key={rt.id}>
                          <Table.Td fw={500}>{rt.name}</Table.Td>
                          <Table.Td>Rp {rt.price_per_night.toLocaleString()}</Table.Td>
                          <Table.Td>{rt.capacity} orang</Table.Td>
                          <Table.Td>
                            <Group gap="xs" justify="center">
                              <ActionIcon
                                variant="light" color="blue"
                                onClick={() => {
                                  setEditingRoomType(rt);
                                  roomTypeForm.setValues({
                                    name: rt.name,
                                    price_per_night: rt.price_per_night,
                                    capacity: rt.capacity,
                                  });
                                  setRoomTypeModalOpened(true);
                                }}
                                aria-label={`Edit tipe kamar ${rt.name}`}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light" color="red"
                                onClick={() => {
                                  setDeleteTargetRoomType(rt);
                                  setRoomTypeDeleteModalOpened(true);
                                }}
                                aria-label={`Hapus tipe kamar ${rt.name}`}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Rooms Tab Panel */}
            <Tabs.Panel value="rooms" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between">
                  <Title order={3}>Manajemen Daftar Kamar</Title>
                  <Tooltip
                    label="Anda harus membuat Tipe Kamar terlebih dahulu"
                    disabled={!noRoomTypes}
                    position="left"
                    withArrow
                  >
                     {/* Tambahkan div wrapper untuk Tooltip agar bekerja pada Button disabled */}
                    <div>
                      <Button
                        leftSection={<IconPlus size={18} />}
                        onClick={() => {
                          setEditingRoom(null);
                          roomForm.reset();
                          setRoomModalOpened(true);
                        }}
                        disabled={noRoomTypes}
                      >
                        Tambah Kamar
                      </Button>
                    </div>
                  </Tooltip>
                </Group>

                {noRoomTypes ? (
                  <Text c="dimmed" ta="center" py="xl">
                    Silakan tambahkan Tipe Kamar terlebih dahulu di tab sebelah sebelum menambahkan kamar.
                  </Text>
                ) : rooms.length === 0 ? (
                  <Text c="dimmed" ta="center" py="xl">
                    Belum ada kamar untuk hotel ini. Silakan tambahkan kamar baru.
                  </Text>
                ) : (
                  <Table striped highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>No. Kamar</Table.Th>
                        <Table.Th>Tipe Kamar</Table.Th>
                        <Table.Th>Harga / Malam</Table.Th>
                        <Table.Th>Kapasitas</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th ta="center">Aksi</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {rooms.map((room) => (
                        <Table.Tr key={room.id}>
                          <Table.Td fw={500}>{room.room_number}</Table.Td>
                          <Table.Td>{room.room_type?.name || 'N/A'}</Table.Td>
                          <Table.Td>Rp {room.room_type?.price_per_night?.toLocaleString() || 'N/A'}</Table.Td>
                          <Table.Td>{room.room_type?.capacity || 'N/A'} orang</Table.Td>
                          <Table.Td>
                            <Badge color={getStatusColor(room.status)} variant="light" size="sm">
                              {getStatusLabel(room.status)}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs" justify="center">
                              <ActionIcon
                                variant="light" color="blue"
                                onClick={() => {
                                  setEditingRoom(room);
                                  roomForm.setValues({
                                    room_number: room.room_number,
                                    room_type_id: room.room_type_id,
                                    status: room.status,
                                  });
                                  setRoomModalOpened(true);
                                }}
                                aria-label={`Edit kamar ${room.room_number}`}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light" color="red"
                                onClick={() => {
                                  setDeleteTargetRoom(room);
                                  setRoomDeleteModalOpened(true);
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
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Container>

      {/* --- Modals --- */}

      {/* Modal Add/Edit Room Type */}
      <Modal
        opened={roomTypeModalOpened}
        onClose={handleCloseRoomTypeModal}
        title={editingRoomType ? 'Edit Tipe Kamar' : 'Tambah Tipe Kamar Baru'}
        centered
      >
        <form onSubmit={roomTypeForm.onSubmit(handleRoomTypeSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Nama Tipe Kamar"
              placeholder="Contoh: Standard, Deluxe, Suite"
              required
              {...roomTypeForm.getInputProps('name')}
            />
            <NumberInput
              label="Harga per Malam (Rp)"
              placeholder="Masukkan harga"
              required
              min={0}
              step={50000}
              thousandSeparator="."
              decimalSeparator=","
              {...roomTypeForm.getInputProps('price_per_night')}
            />
            <NumberInput
              label="Kapasitas (orang)"
              placeholder="Masukkan kapasitas"
              required
              min={1}
              allowDecimal={false}
              {...roomTypeForm.getInputProps('capacity')}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={handleCloseRoomTypeModal}>
                Batal
              </Button>
              <Button type="submit">
                {editingRoomType ? 'Update Tipe Kamar' : 'Simpan Tipe Kamar'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal Delete Room Type Confirmation */}
      <Modal
        opened={roomTypeDeleteModalOpened}
        onClose={() => setRoomTypeDeleteModalOpened(false)}
        title="Konfirmasi Hapus Tipe Kamar"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text>
            Apakah Anda yakin ingin menghapus tipe kamar{' '}
            <strong>{deleteTargetRoomType?.name}</strong>? Tindakan ini tidak dapat dibatalkan. Menghapus tipe kamar juga dapat mempengaruhi kamar yang menggunakan tipe ini.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                  setRoomTypeDeleteModalOpened(false);
                  setDeleteTargetRoomType(null);
              }}
            >
              Batal
            </Button>
            <Button color="red" onClick={handleRoomTypeDelete}>
              Hapus Tipe Kamar
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal Add/Edit Room */}
      <Modal
        opened={roomModalOpened}
        onClose={handleCloseRoomModal}
        title={editingRoom ? 'Edit Kamar' : 'Tambah Kamar Baru'}
        centered
      >
        <form onSubmit={roomForm.onSubmit(handleRoomSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Nomor Kamar"
              placeholder="Contoh: 101, 202A, Lobby Suite"
              required
              {...roomForm.getInputProps('room_number')}
            />
            <Select
              label="Tipe Kamar"
              placeholder="Pilih tipe kamar"
              data={roomTypeOptions}
              required
              searchable
              nothingFoundMessage="Tipe kamar tidak ditemukan"
              {...roomForm.getInputProps('room_type_id')}
            />
            <Select
              label="Status Kamar"
              placeholder="Pilih status"
              data={statusOptions}
              required
              {...roomForm.getInputProps('status')}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={handleCloseRoomModal}>
                Batal
              </Button>
              <Button type="submit">
                {editingRoom ? 'Update Kamar' : 'Simpan Kamar'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal Delete Room Confirmation */}
      <Modal
        opened={roomDeleteModalOpened}
        onClose={() => setRoomDeleteModalOpened(false)}
        title="Konfirmasi Hapus Kamar"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text>
            Apakah Anda yakin ingin menghapus kamar nomor{' '}
            <strong>{deleteTargetRoom?.room_number}</strong>? Tindakan ini tidak dapat dibatalkan.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                  setRoomDeleteModalOpened(false);
                  setDeleteTargetRoom(null);
              }}
            >
              Batal
            </Button>
            <Button color="red" onClick={handleRoomDelete}>
              Hapus Kamar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div> // Closing div for the main layout
  ); // Closing return statement
} // Closing HotelManageContent function

// Default export wrapping the content with ProtectedRoute
export default function ManageHotelPage() {
  return (
    <ProtectedRoute requiredRole="super_admin">
      <HotelManageContent />
    </ProtectedRoute>
  );
}