'use client';

import { useState, useMemo } from 'react';
import {
  Container, Title, Button, Group, Paper, TextInput,
  Select, ActionIcon, Text, Grid, Modal, Stack, SimpleGrid
} from '@mantine/core';
import { IconPlus, IconSearch, IconBuildingStore } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { HotelWithStats } from '@/core/types/database';
import { HotelFormModal } from './components/HotelFormModal';
import { HotelCard } from './components/HotelCard';
import { deleteHotel } from './actions';

interface ClientProps {
  initialHotels: HotelWithStats[];
}

export default function HotelsManagementClient({ initialHotels }: ClientProps) {
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingItem, setEditingItem] = useState<HotelWithStats | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HotelWithStats | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at_desc');

  const filteredHotels = useMemo(() => {
    let result = [...initialHotels];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(h => 
        h.name.toLowerCase().includes(lower) || 
        h.address.toLowerCase().includes(lower) ||
        (h.code && h.code.toLowerCase().includes(lower))
      );
    }

    switch (sortBy) {
      case 'name_asc': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'rooms_desc': result.sort((a, b) => b.total_rooms - a.total_rooms); break;
      case 'created_at_desc': default: 
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); 
        break;
    }

    return result;
  }, [initialHotels, searchTerm, sortBy]);

  // Handlers
  const handleCreate = () => { setEditingItem(null); setModalOpened(true); };
  const handleEdit = (item: HotelWithStats) => { setEditingItem(item); setModalOpened(true); };
  const handleDelete = (item: HotelWithStats) => { setDeleteTarget(item); setDeleteModalOpened(true); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    const res = await deleteHotel(deleteTarget.id);
    setIsSubmitting(false);
    
    if (res.error) {
        notifications.show({ title: 'Gagal', message: res.error, color: 'red' });
    } else {
        notifications.show({ title: 'Sukses', message: 'Hotel dihapus', color: 'green' });
        setDeleteModalOpened(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', padding: '2rem 0', marginBottom: '2rem' }}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <div>
              <Group mb="xs">
                <ActionIcon variant="transparent" color="white" size="lg">
                    <IconBuildingStore size={28} />
                </ActionIcon>
                <Title order={1} c="white">Daftar Hotel</Title>
              </Group>
              <Text c="white" opacity={0.9} pl={{ base: 0, xs: 48 }}>
                Kelola properti dalam jaringan hotel Anda
              </Text>
            </div>
            <Button leftSection={<IconPlus size={18} />} onClick={handleCreate} variant="white" color="indigo" size="md">
              Tambah Hotel
            </Button>
          </Group>
        </Container>
      </div>

      {/* Content */}
      <Container size="lg" pb="xl">
        <Paper shadow="xs" p="md" radius="md" withBorder mb="lg">
          <Grid align="flex-end">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <TextInput
                placeholder="Cari nama, kode, atau alamat..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select
                value={sortBy}
                onChange={(v) => setSortBy(v || 'created_at_desc')}
                data={[
                  { value: 'created_at_desc', label: 'Terbaru Ditambahkan' },
                  { value: 'name_asc', label: 'Nama (A-Z)' },
                  { value: 'rooms_desc', label: 'Kamar Terbanyak' },
                ]}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {filteredHotels.length === 0 ? (
            <Paper p="xl" withBorder ta="center">
                <Text c="dimmed">Belum ada data hotel.</Text>
            </Paper>
        ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                {filteredHotels.map(hotel => (
                    <HotelCard 
                        key={hotel.id} 
                        hotel={hotel} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete} 
                    />
                ))}
            </SimpleGrid>
        )}
      </Container>

      {/* Modals */}
      <HotelFormModal 
        opened={modalOpened} 
        onClose={() => setModalOpened(false)} 
        itemToEdit={editingItem} 
      />

      <Modal opened={deleteModalOpened} onClose={() => setDeleteModalOpened(false)} title="Konfirmasi Hapus" centered>
         <Stack>
            <Text>Apakah Anda yakin ingin menghapus hotel <strong>{deleteTarget?.name}</strong>?</Text>
            <Text size="xs" c="red">Perhatian: Menghapus hotel akan menghapus semua data kamar, reservasi, dan staf terkait jika database di-set cascade.</Text>
            <Group justify="flex-end">
                <Button variant="default" onClick={() => setDeleteModalOpened(false)}>Batal</Button>
                <Button color="red" loading={isSubmitting} onClick={confirmDelete}>Hapus</Button>
            </Group>
         </Stack>
      </Modal>
    </div>
  );
}