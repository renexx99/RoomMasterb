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
  Box,
  ThemeIcon,
} from '@mantine/core';
import { IconPlus, IconArrowLeft, IconSearch, IconBed } from '@tabler/icons-react';
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

  // Konsistensi Layout
  const MAX_WIDTH = 1200;

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
        <Paper withBorder p="xl" ta="center" radius="md">
          <Text c="dimmed">Akun Anda belum terhubung dengan Hotel manapun.</Text>
        </Paper>
      </Container>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Ramping */}
      <div style={{ 
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
        padding: '0.75rem 0', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
      }}>
        <Container fluid px="lg">
          <Box maw={MAX_WIDTH} mx="auto">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                 <ThemeIcon
                  variant="light"
                  color="white"
                  size={34}
                  radius="md"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                >
                  <IconBed size={18} stroke={1.5} />
                </ThemeIcon>
                <div style={{ lineHeight: 1 }}>
                  <Title order={3} c="white" style={{ fontSize: '1rem', fontWeight: 700 }}>Manajemen Kamar</Title>
                  <Text c="white" opacity={0.9} size="xs" mt={2} style={{ fontSize: '0.75rem' }}>Kelola inventaris kamar fisik dan statusnya</Text>
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
                Tambah Kamar
              </Button>
            </Group>
          </Box>
        </Container>
      </div>

      {/* Content */}
      <Container fluid px="lg" py="md">
        <Box maw={MAX_WIDTH} mx="auto">
          <Stack gap="md">
            
            {/* Filters */}
            <Paper shadow="xs" p="sm" radius="md" withBorder>
              <Grid align="flex-end" gutter="sm">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Cari Nomor Kamar"
                    placeholder="Contoh: 101"
                    leftSection={<IconSearch size={16} stroke={1.5} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.currentTarget.value)}
                    size="sm"
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
                    searchable
                    size="sm"
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
                    size="sm"
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
        </Box>
      </Container>

      {/* Modals */}
      <RoomFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        hotelId={hotelId}
        itemToEdit={editingItem}
        roomTypes={roomTypes}
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
            Apakah Anda yakin ingin menghapus Kamar <strong>{deleteTarget?.room_number}</strong>?
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