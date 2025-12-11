'use client';

import { useState, useMemo } from 'react';
import {
  Container, Group, Paper, TextInput, Select,
  Text, Grid, Stack, Box, Button, ScrollArea, Divider,
  ThemeIcon, Badge, ActionIcon, Menu, SimpleGrid, RingProgress, Center
} from '@mantine/core';
import { 
  IconPlus, IconSearch, IconFilter, IconCategory, 
  IconBed, IconUser, IconCoin, IconDotsVertical, IconEdit, IconTrash, 
  IconInfoCircle, IconSortAscending
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { RoomType } from '@/core/types/database';
import { RoomTypeFormModal } from './components/RoomTypeFormModal';
import { deleteRoomTypeAction } from './actions';

interface ClientProps {
  initialRoomTypes: RoomType[];
  hotelId: string;
}

export default function RoomTypesClient({ initialRoomTypes, hotelId }: ClientProps) {
  const MAX_WIDTH = 1800;

  // State
  const [selectedType, setSelectedType] = useState<RoomType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string | null>('price_asc');
  
  // Modal State
  const [modalOpened, setModalOpened] = useState(false);
  const [editingItem, setEditingItem] = useState<RoomType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Logic Filter & Sort ---
  const filteredRoomTypes = useMemo(() => {
    let result = [...initialRoomTypes];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(rt => rt.name.toLowerCase().includes(lower));
    }

    switch (sortBy) {
      case 'name_asc': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'price_asc': result.sort((a, b) => a.price_per_night - b.price_per_night); break;
      case 'price_desc': result.sort((a, b) => b.price_per_night - a.price_per_night); break;
      case 'capacity_desc': result.sort((a, b) => b.capacity - a.capacity); break;
      default: break;
    }
    return result;
  }, [initialRoomTypes, searchTerm, sortBy]);

  // --- Statistics ---
  const stats = useMemo(() => {
    const totalTypes = initialRoomTypes.length;
    const avgPrice = totalTypes > 0 
      ? initialRoomTypes.reduce((acc, curr) => acc + curr.price_per_night, 0) / totalTypes 
      : 0;
    const maxCapacity = totalTypes > 0
      ? Math.max(...initialRoomTypes.map(t => t.capacity))
      : 0;
    return { totalTypes, avgPrice, maxCapacity };
  }, [initialRoomTypes]);

  // --- Handlers ---
  const handleCreate = () => {
    setEditingItem(null);
    setModalOpened(true);
  };

  const handleEdit = (rt: RoomType) => {
    setEditingItem(rt);
    setModalOpened(true);
  };

  const handleDelete = async (id: string) => {
    if(!confirm('Are you sure you want to delete this room type? This action cannot be undone.')) return;
    
    setIsDeleting(true);
    const res = await deleteRoomTypeAction(id);
    setIsDeleting(false);

    if (res.error) {
      notifications.show({ title: 'Failed', message: res.error, color: 'red' });
    } else {
      notifications.show({ title: 'Success', message: 'Room type deleted successfully', color: 'green' });
      if (selectedType?.id === id) setSelectedType(null);
    }
  };

  const getAmenitiesList = (rt: RoomType): string[] => {
    if (Array.isArray(rt.amenities)) return rt.amenities;
    if (typeof rt.amenities === 'string') {
        try { return JSON.parse(rt.amenities); } catch { return []; }
    }
    return [];
  };

  return (
    <Box style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
      
      <Box style={{ flex: 1, overflow: 'hidden' }}>
        <Container fluid px="md" py="md" style={{ height: '100%' }}>
          <Box maw={MAX_WIDTH} mx="auto" style={{ height: '100%' }}>
            <Grid gutter="md" style={{ height: '100%', margin: 0 }}>
              
              {/* --- LEFT PANEL: LIST --- */}
              <Grid.Col span={{ base: 12, md: 4, lg: 3 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Stack gap="sm" style={{ height: '100%' }}>
                  
                  {/* Toolbar */}
                  <Paper p="sm" radius="md" withBorder shadow="sm">
                    <Stack gap="xs">
                      <TextInput
                        placeholder="Search room types..."
                        leftSection={<IconSearch size={14} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.currentTarget.value)}
                        radius="md"
                      />
                      <Group grow>
                        <Select
                          placeholder="Sort by"
                          data={[
                            { value: 'name_asc', label: 'Name (A-Z)' },
                            { value: 'price_asc', label: 'Lowest Price' },
                            { value: 'price_desc', label: 'Highest Price' },
                            { value: 'capacity_desc', label: 'Capacity' },
                          ]}
                          value={sortBy}
                          onChange={setSortBy}
                          leftSection={<IconSortAscending size={14} />}
                          radius="md"
                          allowDeselect={false}
                        />
                      </Group>
                      <Button 
                        leftSection={<IconPlus size={16} />} 
                        onClick={handleCreate}
                        fullWidth
                        variant="gradient"
                        gradient={{ from: '#3b82f6', to: '#2563eb', deg: 135 }}
                        radius="md"
                      >
                        New Type
                      </Button>
                    </Stack>
                  </Paper>

                  {/* List Items */}
                  <Paper withBorder radius="md" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <Box p="xs" bg="gray.0" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                        <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                          Catalog ({filteredRoomTypes.length})
                        </Text>
                      </Box>
                      <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
                        <Stack gap={0}>
                          {filteredRoomTypes.map((rt) => (
                            <Box
                              key={rt.id}
                              p="sm"
                              onClick={() => setSelectedType(rt)}
                              style={{
                                cursor: 'pointer',
                                backgroundColor: selectedType?.id === rt.id ? 'var(--mantine-color-blue-0)' : 'transparent',
                                borderLeft: selectedType?.id === rt.id ? '4px solid var(--mantine-color-blue-6)' : '4px solid transparent',
                                borderBottom: '1px solid var(--mantine-color-gray-1)',
                                transition: 'all 0.2s ease'
                              }}
                              className="hover:bg-gray-50"
                            >
                              <Group justify="space-between" align="flex-start" mb={4}>
                                <Text fw={600} size="sm" lineClamp={1}>{rt.name}</Text>
                                <Badge size="xs" variant="light" color="blue">
                                  {rt.capacity} Pax
                                </Badge>
                              </Group>
                              <Group justify="space-between" align="center">
                                <Text size="xs" c="dimmed">
                                  Rp {rt.price_per_night.toLocaleString('id-ID')}
                                </Text>
                                {rt.bed_type && (
                                  <Badge size="xs" variant="outline" color="gray" radius="sm">
                                    {rt.bed_type}
                                  </Badge>
                                )}
                              </Group>
                            </Box>
                          ))}
                          {filteredRoomTypes.length === 0 && (
                             <Stack align="center" justify="center" py="xl" gap="xs" c="dimmed">
                                <IconCategory size={32} stroke={1.5} />
                                <Text size="sm">No types found</Text>
                             </Stack>
                          )}
                        </Stack>
                      </ScrollArea>
                  </Paper>
                </Stack>
              </Grid.Col>

              {/* --- RIGHT PANEL: DETAIL --- */}
              <Grid.Col span={{ base: 12, md: 8, lg: 9 }} style={{ height: '100%' }}>
                {selectedType ? (
                  <Paper radius="md" withBorder h="100%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Header Detail */}
                    <Box p="lg" style={{ background: 'white', borderBottom: '1px solid #e9ecef' }}>
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Group align="center" gap="sm">
                            <Text fz={28} fw={700} lh={1.2} c="dark.8">{selectedType.name}</Text>
                            {selectedType.smoking_allowed ? 
                              <Badge color="orange" variant="light">Smoking</Badge> : 
                              <Badge color="teal" variant="light">Non-Smoking</Badge>
                            }
                          </Group>
                          <Text size="xl" fw={700} c="blue.7" mt={4}>
                            Rp {selectedType.price_per_night.toLocaleString('id-ID')} 
                            <Text span size="sm" c="dimmed" fw={500}> / night</Text>
                          </Text>
                        </div>
                        <Menu position="bottom-end" shadow="md">
                          <Menu.Target>
                            <ActionIcon variant="light" size="lg" color="gray">
                              <IconDotsVertical size={20} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item leftSection={<IconEdit size={14}/>} onClick={() => handleEdit(selectedType)}>Edit Type</Menu.Item>
                            <Menu.Item leftSection={<IconTrash size={14}/>} color="red" onClick={() => handleDelete(selectedType.id)}>Delete Type</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Box>

                    {/* Content Detail */}
                    <ScrollArea style={{ flex: 1 }} type="auto" bg="gray.0">
                      <Box p="lg">
                        <Grid gutter="lg">
                          {/* Main Info */}
                          <Grid.Col span={{ base: 12, md: 8 }}>
                            <Stack gap="lg">
                              {/* Spesifikasi Card */}
                              <Paper p="md" radius="md" withBorder>
                                <Text size="sm" fw={700} c="dimmed" mb="md" tt="uppercase">Room Specifications</Text>
                                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
                                  <Box>
                                    <Group gap={6} c="dimmed" mb={2}><IconCategory size={14}/><Text size="xs">Size</Text></Group>
                                    <Text fw={600}>{selectedType.size_sqm || '-'} m²</Text>
                                  </Box>
                                  <Box>
                                    <Group gap={6} c="dimmed" mb={2}><IconUser size={14}/><Text size="xs">Capacity</Text></Group>
                                    <Text fw={600}>{selectedType.capacity} Pax</Text>
                                  </Box>
                                  <Box>
                                    <Group gap={6} c="dimmed" mb={2}><IconBed size={14}/><Text size="xs">Bed</Text></Group>
                                    <Text fw={600}>{selectedType.bed_count}x {selectedType.bed_type}</Text>
                                  </Box>
                                  <Box>
                                    <Group gap={6} c="dimmed" mb={2}><IconInfoCircle size={14}/><Text size="xs">View</Text></Group>
                                    <Text fw={600}>{selectedType.view_type || '-'}</Text>
                                  </Box>
                                </SimpleGrid>
                              </Paper>

                              {/* Deskripsi & Fasilitas */}
                              <Paper p="md" radius="md" withBorder>
                                <Text size="sm" fw={700} c="dimmed" mb="sm" tt="uppercase">Description</Text>
                                <Text size="sm" c="dark.6" mb="lg" style={{ whiteSpace: 'pre-line' }}>
                                  {selectedType.description || 'No description available.'}
                                </Text>

                                <Divider mb="sm" />
                                
                                <Text size="sm" fw={700} c="dimmed" mb="sm" tt="uppercase">Amenities ({getAmenitiesList(selectedType).length})</Text>
                                <Group gap="xs">
                                  {getAmenitiesList(selectedType).map((am, i) => (
                                    <Badge key={i} size="lg" radius="sm" variant="dot" color="blue" bg="blue.0" style={{ textTransform: 'capitalize' }}>
                                      {am}
                                    </Badge>
                                  ))}
                                  {getAmenitiesList(selectedType).length === 0 && <Text size="sm" c="dimmed" fs="italic">No amenities listed.</Text>}
                                </Group>
                              </Paper>
                            </Stack>
                          </Grid.Col>

                          {/* Side Info */}
                          <Grid.Col span={{ base: 12, md: 4 }}>
                             <Paper p="md" radius="md" withBorder h="100%" bg="blue.0" style={{ borderColor: 'var(--mantine-color-blue-2)' }}>
                                <Stack align="center" justify="center" h="100%" gap="sm" py="xl">
                                   <ThemeIcon size={64} radius="xl" variant="white" color="blue">
                                      <IconCoin size={32} />
                                   </ThemeIcon>
                                   <Text size="sm" ta="center" c="blue.9" px="md">
                                      This type sets the base price standard. Ensure competitive pricing for your market.
                                   </Text>
                                   <Button variant="white" color="blue" size="xs" onClick={() => handleEdit(selectedType)}>
                                      Update Price
                                   </Button>
                                </Stack>
                             </Paper>
                          </Grid.Col>
                        </Grid>
                      </Box>
                    </ScrollArea>
                  </Paper>
                ) : (
                  // --- OVERVIEW MODE (No Selection) ---
                  <Stack gap="md" h="100%">
                    <Grid gutter="md">
                        {/* Summary Stats */}
                        <Grid.Col span={4}>
                            <Paper p="md" radius="md" withBorder>
                                <Text size="xs" c="dimmed" fw={700} tt="uppercase">Total Types</Text>
                                <Text size="xl" fw={700}>{stats.totalTypes}</Text>
                            </Paper>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Paper p="md" radius="md" withBorder>
                                <Text size="xs" c="dimmed" fw={700} tt="uppercase">Avg. Price</Text>
                                <Text size="xl" fw={700}>Rp {stats.avgPrice.toLocaleString('id-ID')}</Text>
                            </Paper>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Paper p="md" radius="md" withBorder>
                                <Text size="xs" c="dimmed" fw={700} tt="uppercase">Max Capacity</Text>
                                <Text size="xl" fw={700}>{stats.maxCapacity} Pax</Text>
                            </Paper>
                        </Grid.Col>
                    </Grid>

                    <Paper 
                      h="100%" 
                      radius="md" 
                      withBorder 
                      bg="gray.0" 
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Stack align="center" gap="lg" p="xl"> {/* Added padding and increased gap */}
                        <ThemeIcon size={120} radius="xl" variant="light" color="gray" style={{ background: 'white' }}>
                          <IconCategory size={60} stroke={1} />
                        </ThemeIcon>
                        <Box ta="center">
                            <Text size="lg" fw={600} c="dimmed">Select a room type to view details</Text>
                            <Text size="sm" c="dimmed">or create a new type to add inventory to your property</Text>
                        </Box>
                        {/* Added margin top for spacing from text */}
                        <Button mt="xl" size="md" leftSection={<IconPlus size={18}/>} onClick={handleCreate}>
                            Create New Type
                        </Button>
                      </Stack>
                    </Paper>
                  </Stack>
                )}
              </Grid.Col>

            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Modal */}
      <RoomTypeFormModal 
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        hotelId={hotelId}
        itemToEdit={editingItem}
      />
    </Box>
  );
}