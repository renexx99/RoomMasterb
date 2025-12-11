'use client';

import { useState, useMemo } from 'react';
import {
  Container, Title, Button, Group, Paper, TextInput, Select,
  Text, Box, Grid, ActionIcon, Modal, Stack, Center
} from '@mantine/core';
import { IconPlus, IconArrowLeft, IconSearch } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { RoomType } from '@/core/types/database';
import { RoomTypeFormModal } from './components/RoomTypeFormModal';
import { RoomTypeCard } from './components/RoomTypeCard';
import { deleteRoomTypeAction } from './actions';

interface ClientProps {
  initialRoomTypes: RoomType[];
  hotelId: string;
}

export default function RoomTypesClient({ initialRoomTypes, hotelId }: ClientProps) {
  const router = useRouter();
  
  // State
  const roomTypes = initialRoomTypes;
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingItem, setEditingItem] = useState<RoomType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoomType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');

  // Filter Logic
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

  // Handlers
  const handleCreate = () => { setEditingItem(null); setModalOpened(true); };
  const handleEdit = (rt: RoomType) => { setEditingItem(rt); setModalOpened(true); };
  const handleDeleteConfirm = (rt: RoomType) => { setDeleteTarget(rt); setDeleteModalOpened(true); };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const res = await deleteRoomTypeAction(deleteTarget.id);
    setIsDeleting(false);

    if (res.error) {
      notifications.show({ title: 'Gagal', message: res.error, color: 'red' });
      // Jangan tutup modal jika gagal agar user bisa baca error
    } else {
      notifications.show({ title: 'Sukses', message: 'Tipe kamar dihapus', color: 'green' });
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
                <Title order={1} c="white">Manajemen Tipe Kamar</Title>
              </Group>
              <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>
                Kelola detail tipe kamar hotel Anda
              </Text>
            </div>
            <Button leftSection={<IconPlus size={18} />} onClick={handleCreate} variant="white" color="blue">
              Tambah Tipe Kamar
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

          {/* Cards */}
          {roomTypes.length === 0 ? (
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Center><Text c="dimmed">Belum ada tipe kamar. Silakan buat baru.</Text></Center>
            </Paper>
          ) : filteredRoomTypes.length === 0 ? (
            <Paper shadow="sm" p="lg" radius="md" withBorder>
              <Center><Text c="dimmed">Tidak ada hasil yang sesuai.</Text></Center>
            </Paper>
          ) : (
            <Grid>
              {filteredRoomTypes.map((rt) => (
                <Grid.Col key={rt.id} span={{ base: 12, sm: 6, md: 4 }}>
                  <RoomTypeCard 
                    roomType={rt} 
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
      >
        <Stack gap="md">
          <Text size="sm">
            Apakah Anda yakin ingin menghapus tipe kamar <strong>{deleteTarget?.name}</strong>?
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