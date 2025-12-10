// src/app/manager/room-types/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Container, Title, Button, Table, Group, Modal, TextInput,
  Stack, Paper, ActionIcon, Text, Box, Loader, Center, Grid,
  Select, NumberInput, Textarea, MultiSelect, Switch, Badge,
  Tabs, Card, ThemeIcon, Divider, rem
} from '@mantine/core';
import {
  IconEdit, IconTrash, IconPlus, IconArrowLeft, IconSearch,
  IconBed, IconRuler, IconEye, IconAirConditioning, IconPhoto,
  IconInfoCircle
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

// Types
interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  description?: string;
  price_per_night: number;
  capacity: number;
  size_sqm?: number;
  bed_type?: string;
  bed_count?: number;
  view_type?: string;
  smoking_allowed?: boolean;
  amenities?: string[];
  images?: string[];
  created_at: string;
}

// Constants
const BED_TYPES = [
  { value: 'Single', label: 'Single Bed (90cm)' },
  { value: 'Twin', label: 'Twin Beds (2x 90cm)' },
  { value: 'Double', label: 'Double Bed (140cm)' },
  { value: 'Queen', label: 'Queen Bed (160cm)' },
  { value: 'King', label: 'King Bed (180cm)' },
  { value: 'Super King', label: 'Super King Bed (200cm)' },
];

const VIEW_TYPES = [
  { value: 'City View', label: 'City View' },
  { value: 'Sea View', label: 'Sea View' },
  { value: 'Garden View', label: 'Garden View' },
  { value: 'Pool View', label: 'Pool View' },
  { value: 'Mountain View', label: 'Mountain View' },
  { value: 'No View', label: 'No View' },
];

const COMMON_AMENITIES = [
  'AC', 'TV LED', 'WiFi Gratis', 'Mini Bar', 'Coffee Maker',
  'Safe Box', 'Shower', 'Bathtub', 'Hair Dryer', 'Iron & Board',
  'Telephone', 'Work Desk', 'Sofa', 'Balcony', 'Kitchenette',
  'Microwave', 'Refrigerator'
];

function RoomTypesContent() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoomType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');

  const assignedHotelId = profile?.roles?.find(
    r => r.hotel_id && r.role_name === 'Hotel Manager'
  )?.hotel_id;

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      price_per_night: 0,
      capacity: 1,
      size_sqm: 0,
      bed_type: '',
      bed_count: 1,
      view_type: '',
      smoking_allowed: false,
      amenities: [] as string[],
    },
    validate: {
      name: (value) => (!value ? 'Nama tipe kamar harus diisi' : null),
      price_per_night: (value) => (value <= 0 ? 'Harga harus lebih dari 0' : null),
      capacity: (value) => (value <= 0 ? 'Kapasitas minimal 1' : null),
      size_sqm: (value) => (value && value < 0 ? 'Ukuran tidak valid' : null),
      bed_count: (value) => (value < 1 ? 'Minimal 1 kasur' : null),
    },
  });

  useEffect(() => {
    if (!authLoading && assignedHotelId) {
      fetchRoomTypes();
    } else if (!authLoading && !assignedHotelId) {
      setLoading(false);
      notifications.show({
        title: 'Error',
        message: 'Anda tidak terhubung ke hotel',
        color: 'red',
      });
    }
  }, [authLoading, assignedHotelId]);

  const fetchRoomTypes = async () => {
    if (!assignedHotelId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .eq('hotel_id', assignedHotelId);
      if (error) throw error;
      setRoomTypes(data || []);
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

  const filteredRoomTypes = useMemo(() => {
    let result = [...roomTypes];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(rt => rt.name.toLowerCase().includes(lower));
    }
    switch (sortBy) {
      case 'name_desc': result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'price_asc': result.sort((a, b) => a.price_per_night - b.price_per_night); break;
      case 'price_desc': result.sort((a, b) => b.price_per_night - a.price_per_night); break;
      case 'name_asc': default: result.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return result;
  }, [roomTypes, searchTerm, sortBy]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!assignedHotelId) return;
    try {
      const payload = {
        hotel_id: assignedHotelId,
        name: values.name,
        description: values.description || null,
        price_per_night: values.price_per_night,
        capacity: values.capacity,
        size_sqm: values.size_sqm || null,
        bed_type: values.bed_type || null,
        bed_count: values.bed_count,
        view_type: values.view_type || null,
        smoking_allowed: values.smoking_allowed,
        amenities: values.amenities.length > 0 ? JSON.stringify(values.amenities) : null,
      };

      if (editingRoomType) {
        const { error } = await supabase
          .from('room_types')
          .update(payload)
          .eq('id', editingRoomType.id);
        if (error) throw error;
        notifications.show({
          title: 'Sukses',
          message: 'Tipe kamar berhasil diperbarui',
          color: 'green',
        });
      } else {
        const { error } = await supabase.from('room_types').insert(payload);
        if (error) throw error;
        notifications.show({
          title: 'Sukses',
          message: 'Tipe kamar berhasil dibuat',
          color: 'green',
        });
      }
      handleCloseModal();
      await fetchRoomTypes();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error?.message || 'Gagal menyimpan',
        color: 'red',
      });
    }
  };

  const handleEdit = (rt: RoomType) => {
    setEditingRoomType(rt);
    form.setValues({
      name: rt.name,
      description: rt.description || '',
      price_per_night: rt.price_per_night,
      capacity: rt.capacity,
      size_sqm: rt.size_sqm || 0,
      bed_type: rt.bed_type || '',
      bed_count: rt.bed_count || 1,
      view_type: rt.view_type || '',
      smoking_allowed: rt.smoking_allowed || false,
      amenities: rt.amenities || [],
    });
    setModalOpened(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { count, error: checkError } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })
        .eq('room_type_id', deleteTarget.id);
      if (checkError) throw checkError;
      if (count && count > 0) {
        notifications.show({
          title: 'Gagal Hapus',
          message: `Tipe kamar digunakan oleh ${count} kamar`,
          color: 'orange',
        });
        setDeleteModalOpened(false);
        setDeleteTarget(null);
        return;
      }
      const { error } = await supabase
        .from('room_types')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      notifications.show({
        title: 'Sukses',
        message: 'Tipe kamar berhasil dihapus',
        color: 'green',
      });
      handleCloseDeleteModal();
      await fetchRoomTypes();
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
    setEditingRoomType(null);
    form.reset();
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpened(false);
    setDeleteTarget(null);
  };

  if (loading || authLoading) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 140px)' }}>
        <Loader size="xl" />
      </Center>
    );
  }

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
                  Manajemen Tipe Kamar
                </Title>
              </Group>
              <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>
                Kelola detail tipe kamar hotel Anda
              </Text>
            </div>
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => {
                setEditingRoomType(null);
                form.reset();
                setModalOpened(true);
              }}
              variant="white"
              color="blue"
            >
              Tambah Tipe Kamar
            </Button>
          </Group>
        </Container>
      </div>

      <Container size="lg" pb="xl">
        <Stack gap="lg">
          {/* Filter */}
          {roomTypes.length > 0 && (
            <Paper shadow="xs" p="md" radius="md" withBorder>
              <Grid align="flex-end" gutter="md">
                <Grid.Col span={{ base: 12, sm: 8 }}>
                  <TextInput
                    label="Cari Tipe Kamar"
                    placeholder="Cari nama..."
                    leftSection={<IconSearch size={16} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <Select
                    label="Urutkan"
                    value={sortBy}
                    onChange={(v) => setSortBy(v || 'name_asc')}
                    data={[
                      { value: 'name_asc', label: 'Nama (A-Z)' },
                      { value: 'name_desc', label: 'Nama (Z-A)' },
                      { value: 'price_asc', label: 'Harga Termurah' },
                      { value: 'price_desc', label: 'Harga Termahal' },
                    ]}
                  />
                </Grid.Col>
              </Grid>
            </Paper>
          )}

          {/* Cards Grid */}
          {roomTypes.length === 0 ? (
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Box ta="center">
                <Text c="dimmed">Belum ada tipe kamar</Text>
              </Box>
            </Paper>
          ) : filteredRoomTypes.length === 0 ? (
            <Paper shadow="sm" p="lg" radius="md" withBorder>
              <Text c="dimmed" ta="center">
                Tidak ada hasil
              </Text>
            </Paper>
          ) : (
            <Grid>
              {filteredRoomTypes.map((rt) => (
                <Grid.Col key={rt.id} span={{ base: 12, sm: 6, md: 4 }}>
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Stack gap="sm">
                      <Group justify="space-between" align="flex-start">
                        <div style={{ flex: 1 }}>
                          <Text fw={700} size="lg">
                            {rt.name}
                          </Text>
                          <Text size="xl" fw={700} c="blue" mt={4}>
                            Rp {rt.price_per_night.toLocaleString('id-ID')}
                            <Text span size="sm" c="dimmed" fw={400}>
                              {' '}/malam
                            </Text>
                          </Text>
                        </div>
                        <Group gap={4}>
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => handleEdit(rt)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => {
                              setDeleteTarget(rt);
                              setDeleteModalOpened(true);
                            }}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Group>

                      <Divider />

                      {/* Room Details */}
                      <Stack gap={6}>
                        {rt.bed_type && (
                          <Group gap={8}>
                            <ThemeIcon size="sm" variant="light" color="indigo">
                              <IconBed size={14} />
                            </ThemeIcon>
                            <Text size="sm">
                              {rt.bed_count}x {rt.bed_type}
                            </Text>
                          </Group>
                        )}
                        {rt.size_sqm && (
                          <Group gap={8}>
                            <ThemeIcon size="sm" variant="light" color="teal">
                              <IconRuler size={14} />
                            </ThemeIcon>
                            <Text size="sm">{rt.size_sqm} m²</Text>
                          </Group>
                        )}
                        {rt.view_type && (
                          <Group gap={8}>
                            <ThemeIcon size="sm" variant="light" color="cyan">
                              <IconEye size={14} />
                            </ThemeIcon>
                            <Text size="sm">{rt.view_type}</Text>
                          </Group>
                        )}
                        <Group gap={8}>
                          <ThemeIcon size="sm" variant="light" color="violet">
                            <IconInfoCircle size={14} />
                          </ThemeIcon>
                          <Text size="sm">Kapasitas: {rt.capacity} orang</Text>
                        </Group>
                      </Stack>

                      {/* Amenities */}
                      {rt.amenities && rt.amenities.length > 0 && (
                        <>
                          <Divider />
                          <Box>
                            <Text size="xs" fw={600} c="dimmed" mb={6}>
                              FASILITAS
                            </Text>
                            <Group gap={4}>
                              {rt.amenities.slice(0, 3).map((amenity, idx) => (
                                <Badge
                                  key={idx}
                                  size="xs"
                                  variant="light"
                                  color="gray"
                                >
                                  {amenity}
                                </Badge>
                              ))}
                              {rt.amenities.length > 3 && (
                                <Badge size="xs" variant="light" color="blue">
                                  +{rt.amenities.length - 3} lainnya
                                </Badge>
                              )}
                            </Group>
                          </Box>
                        </>
                      )}

                      {rt.smoking_allowed && (
                        <Badge size="sm" color="orange" variant="light">
                          Smoking Allowed
                        </Badge>
                      )}
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
        title={editingRoomType ? 'Edit Tipe Kamar' : 'Tambah Tipe Kamar'}
        size="lg"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Tabs defaultValue="basic">
            <Tabs.List>
              <Tabs.Tab value="basic">Informasi Dasar</Tabs.Tab>
              <Tabs.Tab value="details">Detail Kamar</Tabs.Tab>
              <Tabs.Tab value="amenities">Fasilitas</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="basic" pt="md">
              <Stack gap="md">
                <TextInput
                  label="Nama Tipe Kamar"
                  placeholder="Standard, Deluxe, Suite..."
                  required
                  {...form.getInputProps('name')}
                />
                <Textarea
                  label="Deskripsi"
                  placeholder="Deskripsi singkat tipe kamar..."
                  minRows={3}
                  {...form.getInputProps('description')}
                />
                <Grid>
                  <Grid.Col span={6}>
                    <NumberInput
                      label="Harga/Malam (Rp)"
                      placeholder="500000"
                      required
                      min={1}
                      step={10000}
                      thousandSeparator="."
                      hideControls
                      {...form.getInputProps('price_per_night')}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput
                      label="Kapasitas (orang)"
                      required
                      min={1}
                      {...form.getInputProps('capacity')}
                    />
                  </Grid.Col>
                </Grid>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="details" pt="md">
              <Stack gap="md">
                <NumberInput
                  label="Ukuran Kamar (m²)"
                  placeholder="28.5"
                  min={0}
                  step={0.5}
                  decimalScale={1}
                  {...form.getInputProps('size_sqm')}
                />
                <Grid>
                  <Grid.Col span={8}>
                    <Select
                      label="Tipe Kasur"
                      placeholder="Pilih tipe kasur"
                      data={BED_TYPES}
                      clearable
                      {...form.getInputProps('bed_type')}
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <NumberInput
                      label="Jumlah Kasur"
                      min={1}
                      {...form.getInputProps('bed_count')}
                    />
                  </Grid.Col>
                </Grid>
                <Select
                  label="Jenis Pemandangan"
                  placeholder="Pilih view"
                  data={VIEW_TYPES}
                  clearable
                  {...form.getInputProps('view_type')}
                />
                <Switch
                  label="Boleh Merokok"
                  {...form.getInputProps('smoking_allowed', {
                    type: 'checkbox',
                  })}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="amenities" pt="md">
              <Stack gap="md">
                <MultiSelect
                  label="Fasilitas Kamar"
                  placeholder="Pilih fasilitas"
                  data={COMMON_AMENITIES}
                  searchable
                  {...form.getInputProps('amenities')}
                />
                <Text size="xs" c="dimmed">
                  Pilih semua fasilitas yang tersedia di tipe kamar ini
                </Text>
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button type="submit">
              {editingRoomType ? 'Update' : 'Simpan'}
            </Button>
          </Group>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={handleCloseDeleteModal}
        title="Konfirmasi Hapus"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Hapus tipe kamar <strong>{deleteTarget?.name}</strong>?
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

export default function ManagerRoomTypesPage() {
  return (
    <ProtectedRoute requiredRoleName="Hotel Manager">
      <RoomTypesContent />
    </ProtectedRoute>
  );
}