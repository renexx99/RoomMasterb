'use client';

import { useState, useMemo } from 'react';
import {
  Container, Button, Group, Paper, TextInput,
  Select, Text, Grid, Modal, Stack, SimpleGrid, ThemeIcon, Box, ActionIcon
} from '@mantine/core';
import { IconPlus, IconSearch, IconBuildingStore, IconSortAscending, IconSortDescending, IconRefresh } from '@tabler/icons-react';
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
        notifications.show({ title: 'Failed', message: res.error, color: 'red' });
    } else {
        notifications.show({ title: 'Success', message: 'Hotel deleted successfully', color: 'teal' });
        setDeleteModalOpened(false);
    }
  };

  return (
    <Box style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '2rem' }}>
      <Container size="xl" py="lg">
        
        {/* Single Toolbar Bar (No Header Text) */}
        <Paper p="md" radius="md" withBorder mb="lg" shadow="sm">
          <Grid align="center" gutter="sm">
            {/* Search Input */}
            <Grid.Col span={{ base: 12, sm: 5 }}>
              <TextInput
                placeholder="Search hotels..."
                leftSection={<IconSearch size={16} stroke={1.5} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                radius="md"
              />
            </Grid.Col>

            {/* Sort Select */}
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Select
                value={sortBy}
                onChange={(v) => setSortBy(v || 'created_at_desc')}
                radius="md"
                leftSection={sortBy === 'name_asc' ? <IconSortAscending size={16}/> : <IconSortDescending size={16}/>}
                data={[
                  { value: 'created_at_desc', label: 'Newest' },
                  { value: 'name_asc', label: 'Name (A-Z)' },
                  { value: 'rooms_desc', label: 'Capacity' },
                ]}
              />
            </Grid.Col>

            {/* Actions (Add Button + Count) */}
            <Grid.Col span={{ base: 6, sm: 4 }}>
                <Group justify="flex-end" gap="sm">
                     <Text size="sm" c="dimmed" visibleFrom="md" style={{ whiteSpace: 'nowrap' }}>
                        <Text span fw={700} c="dark">{filteredHotels.length}</Text> Properties
                    </Text>
                    <Button 
                        leftSection={<IconPlus size={18} />} 
                        onClick={handleCreate} 
                        color="indigo" 
                        radius="md"
                    >
                        Add Hotel
                    </Button>
                </Group>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Content Grid */}
        {filteredHotels.length === 0 ? (
            <Paper p="xl" withBorder ta="center" bg="white" radius="md" mt="xl">
                <ThemeIcon size={60} radius="xl" color="gray" variant="light" mb="md">
                    <IconBuildingStore size={30} />
                </ThemeIcon>
                <Text size="lg" fw={500} c="dark">No hotels found</Text>
                <Text c="dimmed" size="sm" mt="xs">Try changing search keywords or add a new hotel.</Text>
            </Paper>
        ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 3 }} spacing="lg">
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

      <Modal 
        opened={deleteModalOpened} 
        onClose={() => setDeleteModalOpened(false)} 
        title="Confirm Deletion" 
        centered 
        radius="md"
      >
         <Stack gap="sm">
            <Text size="sm">Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?</Text>
            <Paper p="xs" bg="red.0" c="red.9" withBorder style={{ borderColor: 'var(--mantine-color-red-2)' }}>
                <Text size="xs">⚠️ This action is permanent. All related room, reservation, and staff data will be deleted.</Text>
            </Paper>
            <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={() => setDeleteModalOpened(false)}>Cancel</Button>
                <Button color="red" loading={isSubmitting} onClick={confirmDelete}>Delete Hotel</Button>
            </Group>
         </Stack>
      </Modal>
    </Box>
  );
}