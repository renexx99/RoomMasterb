'use client';

import { useState, useMemo } from 'react';
import {
  Container,
  Title,
  Button,
  Group,
  Paper,
  TextInput,
  Select,
  ActionIcon,
  Text,
  Grid,
  Modal,
  Stack,
  Box,
  ThemeIcon,
} from '@mantine/core';
import { IconPlus, IconSearch, IconCategory } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { RoomType } from '@/core/types/database';
import { RoomTypesTable } from './components/RoomTypesTable';
import { RoomTypeFormModal } from './components/RoomTypeFormModal';
import { deleteRoomType } from './actions';

interface ClientProps {
  initialRoomTypes: RoomType[];
  hotelId: string | null;
}

export default function RoomTypesManagementClient({ initialRoomTypes, hotelId }: ClientProps) {
  const router = useRouter();

  // Konsistensi Layout
  const MAX_WIDTH = 1200;

  // State Data
  const roomTypes = initialRoomTypes;

  // UI States
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingItem, setEditingItem] = useState<RoomType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoomType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');

  // --- Logic Filter & Sort ---
  const filteredAndSortedData = useMemo(() => {
    let result = [...roomTypes];

    // Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(lowerSearch) ||
        (item.description && item.description.toLowerCase().includes(lowerSearch))
      );
    }

    // Sort
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price_per_night - b.price_per_night);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price_per_night - a.price_per_night);
        break;
      case 'capacity_desc':
        result.sort((a, b) => b.capacity - a.capacity);
        break;
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'name_asc':
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [roomTypes, searchTerm, sortBy]);

  // --- Handlers ---
  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpened(true);
  };

  const handleOpenEdit = (item: RoomType) => {
    setEditingItem(item);
    setModalOpened(true);
  };

  const handleOpenDelete = (item: RoomType) => {
    setDeleteTarget(item);
    setDeleteModalOpened(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const result = await deleteRoomType(deleteTarget.id);
      
      if (result.error) {
        notifications.show({ title: 'Gagal', message: result.error, color: 'red' });
      } else {
        notifications.show({ title: 'Sukses', message: 'Tipe Kamar dihapus', color: 'green' });
        setDeleteModalOpened(false);
        setDeleteTarget(null);
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Terjadi kesalahan sistem', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hotelId) {
    return (
      <Container size="lg" py="xl">
        <Paper withBorder p="xl" ta="center" radius="md">
          <Text c="dimmed">Akun Anda belum terhubung dengan Hotel manapun.</Text>
        </Paper>
      </Container>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Ramping (Admin Green Style) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: '0.75rem 0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <Container fluid px="lg">
          <Box maw={MAX_WIDTH} mx="auto">
            <Group justify="space-between">
              <Group gap="xs">
                <ThemeIcon
                  variant="light"
                  color="white"
                  size={34}
                  radius="md"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                >
                  <IconCategory size={18} stroke={1.5} />
                </ThemeIcon>
                <div style={{ lineHeight: 1 }}>
                  <Title order={3} c="white" style={{ fontSize: '1rem', fontWeight: 700 }}>
                    Manajemen Tipe Kamar
                  </Title>
                  <Text c="white" opacity={0.9} size="xs" mt={2} style={{ fontSize: '0.75rem' }}>
                    Atur kategori, harga, dan kapasitas kamar
                  </Text>
                </div>
              </Group>

              <Button
                leftSection={<IconPlus size={16} />}
                onClick={handleOpenCreate}
                variant="white"
                color="teal"
                size="xs"
                radius="md"
                fw={600}
              >
                Tambah Tipe
              </Button>
            </Group>
          </Box>
        </Container>
      </div>

      {/* Konten Utama */}
      <Container fluid px="lg" py="md">
        <Box maw={MAX_WIDTH} mx="auto">
          <Stack gap="md">
            
            {/* Filter Section */}
            <Paper shadow="xs" p="sm" radius="md" withBorder>
              <Grid align="center" gutter="sm">
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <TextInput
                    placeholder="Cari nama tipe atau deskripsi..."
                    leftSection={<IconSearch size={16} stroke={1.5} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.currentTarget.value)}
                    size="sm"
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    placeholder="Urutkan"
                    value={sortBy}
                    onChange={(v) => setSortBy(v || 'name_asc')}
                    data={[
                      { value: 'name_asc', label: 'Nama (A-Z)' },
                      { value: 'name_desc', label: 'Nama (Z-A)' },
                      { value: 'price_asc', label: 'Harga Termurah' },
                      { value: 'price_desc', label: 'Harga Termahal' },
                      { value: 'capacity_desc', label: 'Kapasitas Tertinggi' },
                    ]}
                    size="sm"
                  />
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Tabel Data */}
            <RoomTypesTable 
              data={filteredAndSortedData}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          </Stack>
        </Box>
      </Container>

      {/* Modals */}
      <RoomTypeFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        hotelId={hotelId}
        itemToEdit={editingItem}
      />

      <Modal 
        opened={deleteModalOpened} 
        onClose={() => setDeleteModalOpened(false)} 
        title="Konfirmasi Hapus" 
        centered 
        size="sm"
        radius="md"
      >
        <Stack gap="md">
          <Text size="sm">
            Apakah Anda yakin ingin menghapus tipe <strong>{deleteTarget?.name}</strong>?
          </Text>
          <Group justify="flex-end">
            <Button variant="default" size="xs" onClick={() => setDeleteModalOpened(false)} disabled={isSubmitting}>Batal</Button>
            <Button color="red" size="xs" onClick={handleDeleteConfirm} loading={isSubmitting}>Hapus</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}