'use client';

import { useState, useMemo } from 'react';
import {
  Container, Title, Button, Group, Paper, TextInput,
  Select, ActionIcon, Text, Grid, Modal, Stack, SimpleGrid, Box
} from '@mantine/core';
import { IconPlus, IconSearch, IconBuildingStore } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { HotelWithStats } from '@/core/types/database';
import { HotelFormModal } from './components/HotelFormModal';
import { HotelCard } from './components/HotelCard';
import { HotelDetailsModal } from './components/HotelDetailsModal';
import { deleteHotel } from './actions';

interface ClientProps {
  initialHotels: HotelWithStats[];
}

export default function HotelsManagementClient({ initialHotels }: ClientProps) {
  const [formModalOpened, setFormModalOpened] = useState(false);
  const [detailsModalOpened, setDetailsModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  
  const [selectedHotel, setSelectedHotel] = useState<HotelWithStats | null>(null);
  const [editingItem, setEditingItem] = useState<HotelWithStats | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HotelWithStats | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      case 'created_at_desc': default: result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }
    return result;
  }, [initialHotels, searchTerm, sortBy]);

  // Handlers
  const handleCreate = () => { setEditingItem(null); setFormModalOpened(true); };
  
  const handleCardClick = (hotel: HotelWithStats) => {
    setSelectedHotel(hotel);
    setDetailsModalOpened(true);
  };

  const handleEdit = (hotel: HotelWithStats) => {
    // Tutup modal detail jika sedang terbuka
    setDetailsModalOpened(false);
    setEditingItem(hotel);
    setFormModalOpened(true);
  };

  const handleDelete = (hotel: HotelWithStats) => {
    // Tutup modal detail jika sedang terbuka
    setDetailsModalOpened(false);
    setDeleteTarget(hotel);
    setDeleteModalOpened(true);
  };

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
      {/* Header - Dibuat Lebih Tipis (Sama seperti User Management) */}
      <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', padding: '1.25rem 0' }}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <div>
              <Group mb="xs">
                <ActionIcon variant="transparent" color="white">
                    <IconBuildingStore size={24} />
                </ActionIcon>
                <Title order={2} c="white">Manajemen Hotel</Title>
              </Group>
              <Text c="white" opacity={0.9} pl={{ base: 0, xs: 40 }} size="sm">
                Kelola properti dan unit dalam jaringan hotel
              </Text>
            </div>
            <Button leftSection={<IconPlus size={18} />} onClick={handleCreate} variant="white" color="indigo" size="sm">
              Tambah Hotel
            </Button>
          </Group>
        </Container>
      </div>

      {/* Content */}
      <Container size="lg" py="xl">
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
                        onClick={handleCardClick}
                    />
                ))}
            </SimpleGrid>
        )}
      </Container>

      {/* Modals */}
      <HotelFormModal 
        opened={formModalOpened} 
        onClose={() => setFormModalOpened(false)} 
        itemToEdit={editingItem} 
      />

      <HotelDetailsModal
        opened={detailsModalOpened}
        onClose={() => setDetailsModalOpened(false)}
        hotel={selectedHotel}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal opened={deleteModalOpened} onClose={() => setDeleteModalOpened(false)} title="Konfirmasi Hapus" centered>
         <Stack>
            <Text>Apakah Anda yakin ingin menghapus hotel <strong>{deleteTarget?.name}</strong>?</Text>
            <Text size="xs" c="red">Perhatian: Menghapus hotel akan menghapus semua data kamar, reservasi, dan staf terkait.</Text>
            <Group justify="flex-end">
                <Button variant="default" onClick={() => setDeleteModalOpened(false)}>Batal</Button>
                <Button color="red" loading={isSubmitting} onClick={confirmDelete}>Hapus</Button>
            </Group>
         </Stack>
      </Modal>
    </div>
  );
}