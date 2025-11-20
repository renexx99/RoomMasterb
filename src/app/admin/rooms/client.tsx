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
  MultiSelect,
} from '@mantine/core';
import { IconPlus, IconArrowLeft, IconSearch } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { RoomType } from '@/core/types/database';
import { RoomWithDetails } from './page';
import { RoomsTable } from './components/RoomsTable';
import { RoomFormModal } from './components/RoomFormModal';
import { deleteRoom } from './actions';

interface ClientProps {
  initialRooms: RoomWithDetails[];
  roomTypes: RoomType[];
  hotelId: string | null;
}

export default function RoomsManagementClient({ initialRooms, roomTypes, hotelId }: ClientProps) {
  const router = useRouter();

  // State Data
  const rooms = initialRooms;

  // UI States
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingItem, setEditingItem] = useState<RoomWithDetails | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoomWithDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // --- Logic Filter ---
  const filteredRooms = useMemo(() => {
    let result = [...rooms];

    // 1. Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(r => r.room_number.toLowerCase().includes(lowerSearch));
    }

    // 2. Status Filter
    if (statusFilter.length > 0) {
      result = result.filter(r => statusFilter.includes(r.status));
    }

    // 3. Type Filter
    if (typeFilter) {
      result = result.filter(r => r.room_type_id === typeFilter);
    }

    return result;
  }, [rooms, searchTerm, statusFilter, typeFilter]);

  // --- Handlers ---
  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpened(true);
  };

  const handleOpenEdit = (item: RoomWithDetails) => {
    setEditingItem(item);
    setModalOpened(true);
  };

  const handleOpenDelete = (item: RoomWithDetails) => {
    setDeleteTarget(item);
    setDeleteModalOpened(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const result = await deleteRoom(deleteTarget.id);
      
      if (result.error) {
        notifications.show({ title: 'Gagal', message: result.error, color: 'red' });
      } else {
        notifications.show({ title: 'Sukses', message: 'Kamar berhasil dihapus', color: 'green' });
        setDeleteModalOpened(false);
        setDeleteTarget(null);
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Terjadi kesalahan sistem', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Options for Selects
  const typeOptions = useMemo(() => roomTypes.map(t => ({ value: t.id, label: t.name })), [roomTypes]);

  if (!hotelId) {
    return (
      <Container size="lg" py="xl">
        <Paper withBorder p="xl" ta="center">
          <Text c="dimmed">Akun Anda belum terhubung dengan Hotel manapun.</Text>
        </Paper>
      </Container>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '2rem 0', marginBottom: '2rem' }}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <div>
              <Group mb="xs">
                <ActionIcon variant="transparent" color="white" onClick={() => router.push('/admin/dashboard')} aria-label="Kembali">
                  <IconArrowLeft size={20} />
                </ActionIcon>
                <Title order={1} c="white">Manajemen Kamar</Title>
              </Group>
              <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>Kelola daftar kamar fisik dan statusnya</Text>
            </div>
            <Button leftSection={<IconPlus size={18} />} onClick={handleOpenCreate} variant="white" color="teal">
              Tambah Kamar
            </Button>
          </Group>
        </Container>
      </div>

      {/* Content */}
      <Container size="lg" pb="xl">
        <Stack gap="lg">
          {/* Filters */}
          <Paper shadow="xs" p="md" radius="md" withBorder>
            <Grid align="flex-end" gutter="md">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  label="Cari Nomor Kamar"
                  placeholder="Contoh: 101"
                  leftSection={<IconSearch size={16} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.currentTarget.value)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                 <Select
                  label="Tipe Kamar"
                  placeholder="Semua Tipe"
                  data={typeOptions}
                  value={typeFilter}
                  onChange={setTypeFilter}
                  clearable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <MultiSelect
                  label="Status Kamar"
                  placeholder="Filter Status"
                  data={[
                    { value: 'available', label: 'Tersedia' },
                    { value: 'occupied', label: 'Terisi' },
                    { value: 'maintenance', label: 'Perbaikan' },
                    { value: 'dirty', label: 'Kotor' },
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  clearable
                />
              </Grid.Col>
            </Grid>
          </Paper>

          <RoomsTable 
            data={filteredRooms}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
          />
        </Stack>
      </Container>

      {/* Modals */}
      <RoomFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        hotelId={hotelId}
        itemToEdit={editingItem}
        roomTypes={roomTypes}
      />

      <Modal opened={deleteModalOpened} onClose={() => setDeleteModalOpened(false)} title="Konfirmasi Hapus" centered size="sm">
        <Stack gap="md">
          <Text size="sm">
            Apakah Anda yakin ingin menghapus Kamar <strong>{deleteTarget?.room_number}</strong>?
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteModalOpened(false)} disabled={isSubmitting}>Batal</Button>
            <Button color="red" onClick={handleDeleteConfirm} loading={isSubmitting}>Hapus</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}