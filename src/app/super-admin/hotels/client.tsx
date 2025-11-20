'use client';

import { useState, useMemo } from 'react';
import {
  Container, Title, Button, Group, Paper, TextInput,
  Select, ActionIcon, Text, Grid, Modal, Stack, SimpleGrid, ThemeIcon
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
    setDetailsModalOpened(false);
    setEditingItem(hotel);
    setFormModalOpened(true);
  };

  const handleDelete = (hotel: HotelWithStats) => {
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
      {/* Header - Ramping & Efisien */}
      <div style={{ 
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 
          padding: '0.75rem 0', // Padding lebih kecil
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <Group gap="xs">
                <ThemeIcon 
                    variant="light" 
                    color="white" 
                    size="lg" 
                    radius="md"
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
                >
                    <IconBuildingStore size={20} stroke={1.5} />
                </ThemeIcon>
                
                <div style={{ lineHeight: 1 }}>
                    <Title order={4} c="white" style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.2 }}>
                        Manajemen Hotel
                    </Title>
                    <Text c="white" opacity={0.8} size="xs" mt={2}>
                        {filteredHotels.length} properti terdaftar
                    </Text>
                </div>
            </Group>
            
            <Button 
                leftSection={<IconPlus size={16} />} 
                onClick={handleCreate} 
                variant="white" 
                color="indigo" 
                size="xs" // Ukuran tombol lebih kecil
                fw={600}
            >
              Tambah
            </Button>
          </Group>
        </Container>
      </div>

      {/* Content */}
      <Container size="lg" py="md"> {/* Padding Y diperkecil */}
        <Paper shadow="xs" p="sm" radius="md" withBorder mb="md"> {/* Paper lebih compact */}
          <Grid align="center" gutter="xs">
            <Grid.Col span={{ base: 12, sm: 8 }}>
              <TextInput
                placeholder="Cari nama, kode, atau alamat..."
                leftSection={<IconSearch size={14} />}
                size="xs" // Input lebih kecil
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Select
                value={sortBy}
                size="xs" // Input lebih kecil
                onChange={(v) => setSortBy(v || 'created_at_desc')}
                data={[
                  { value: 'created_at_desc', label: 'Terbaru' },
                  { value: 'name_asc', label: 'Nama (A-Z)' },
                  { value: 'rooms_desc', label: 'Kapasitas' },
                ]}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {filteredHotels.length === 0 ? (
            <Paper p="xl" withBorder ta="center" bg="gray.0">
                <Text c="dimmed" size="sm">Belum ada data hotel.</Text>
            </Paper>
        ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
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

      <Modal opened={deleteModalOpened} onClose={() => setDeleteModalOpened(false)} title="Konfirmasi Hapus" centered size="sm">
         <Stack gap="sm">
            <Text size="sm">Apakah Anda yakin ingin menghapus hotel <strong>{deleteTarget?.name}</strong>?</Text>
            <Text size="xs" c="red">Tindakan ini permanen dan akan menghapus seluruh data terkait hotel ini.</Text>
            <Group justify="flex-end" mt="sm">
                <Button variant="default" size="xs" onClick={() => setDeleteModalOpened(false)}>Batal</Button>
                <Button color="red" size="xs" loading={isSubmitting} onClick={confirmDelete}>Hapus</Button>
            </Group>
         </Stack>
      </Modal>
    </div>
  );
}