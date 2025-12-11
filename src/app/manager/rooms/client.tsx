'use client';

import { useState, useMemo } from 'react';
import {
  Container, Group, Paper, TextInput, Select, 
  Text, Grid, Stack, Box, Button, ScrollArea, Divider,
  ThemeIcon
} from '@mantine/core';
import { 
  IconPlus, IconSearch, IconBed, IconFilter, IconDoor
} from '@tabler/icons-react';
import { RoomType } from '@/core/types/database';
import { RoomWithDetails } from './page';
import { RoomListItem } from './components/RoomListItem';
import { RoomDetailPanel } from './components/RoomDetailPanel';
import { RoomFormModal } from './components/RoomFormModal';

interface ClientProps {
  initialRooms: RoomWithDetails[];
  roomTypes: RoomType[];
  hotelId: string;
}

export default function RoomsManagementClient({ initialRooms, roomTypes, hotelId }: ClientProps) {
  const MAX_WIDTH = 1800; // Wide layout for Split View

  // State
  const [selectedRoom, setSelectedRoom] = useState<RoomWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Modal State
  const [modalOpened, setModalOpened] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Options
  const roomTypeOptions = useMemo(() => roomTypes.map(rt => ({ value: rt.id, label: rt.name })), [roomTypes]);

  // Filter Logic
  const filteredRooms = useMemo(() => {
    let result = [...initialRooms];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => r.room_number.toLowerCase().includes(lower));
    }

    if (filterStatus) {
      result = result.filter(r => r.status === filterStatus);
    }

    if (filterType) {
      result = result.filter(r => r.room_type_id === filterType);
    }

    // Sort: Room Number Ascending
    result.sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));

    return result;
  }, [initialRooms, searchTerm, filterStatus, filterType]);

  // Handlers
  const handleCreateNew = () => {
    setSelectedRoom(null); // Reset selection
    setIsEditing(false);
    setModalOpened(true);
  };

  const handleEditCurrent = () => {
    if (selectedRoom) {
      setIsEditing(true);
      setModalOpened(true);
    }
  };

  return (
    <Box style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
      
      {/* Main Content - Split View */}
      <Box style={{ flex: 1, overflow: 'hidden' }}>
        <Container fluid px="md" py="md" style={{ height: '100%' }}>
          <Box maw={MAX_WIDTH} mx="auto" style={{ height: '100%' }}>
            <Grid gutter="md" style={{ height: '100%', margin: 0 }}>
              
              {/* LEFT: Room List (Sidebar) */}
              <Grid.Col span={{ base: 12, md: 4, lg: 3 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Stack gap="sm" style={{ height: '100%' }}>
                  
                  {/* Search & Actions */}
                  <Paper p="sm" radius="md" withBorder shadow="sm">
                    <Stack gap="xs">
                      <TextInput
                        placeholder="Search room number..."
                        leftSection={<IconSearch size={14} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.currentTarget.value)}
                        radius="md"
                      />
                      <Group grow>
                        <Select
                          placeholder="Status"
                          data={[
                            { value: 'available', label: 'Available' },
                            { value: 'occupied', label: 'Occupied' },
                            { value: 'maintenance', label: 'Maintenance' }
                          ]}
                          value={filterStatus}
                          onChange={setFilterStatus}
                          clearable
                          leftSection={<IconFilter size={14} />}
                          radius="md"
                        />
                        <Select
                          placeholder="Type"
                          data={roomTypeOptions}
                          value={filterType}
                          onChange={setFilterType}
                          clearable
                          radius="md"
                        />
                      </Group>
                      
                      <Divider my={4} />
                      
                      <Button 
                        leftSection={<IconPlus size={16} />} 
                        onClick={handleCreateNew}
                        fullWidth
                        variant="gradient"
                        gradient={{ from: '#3b82f6', to: '#2563eb', deg: 135 }} // Manager Blue
                        radius="md"
                      >
                        Add Room
                      </Button>
                    </Stack>
                  </Paper>

                  {/* Scrollable List */}
                  <Paper withBorder radius="md" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <Box p="xs" bg="gray.0" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                        <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                          Inventory ({filteredRooms.length})
                        </Text>
                      </Box>
                      <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
                        <Stack gap={0}>
                          {filteredRooms.map((room) => (
                            <RoomListItem 
                              key={room.id}
                              room={room}
                              selected={selectedRoom?.id === room.id}
                              onClick={() => setSelectedRoom(room)}
                            />
                          ))}
                          {filteredRooms.length === 0 && (
                             <Stack align="center" justify="center" py="xl" gap="xs" c="dimmed">
                                <IconDoor size={32} stroke={1.5} />
                                <Text size="sm">No rooms found</Text>
                             </Stack>
                          )}
                        </Stack>
                      </ScrollArea>
                  </Paper>
                </Stack>
              </Grid.Col>

              {/* RIGHT: Room Detail (Main) */}
              <Grid.Col span={{ base: 12, md: 8, lg: 9 }} style={{ height: '100%' }}>
                {selectedRoom ? (
                  <RoomDetailPanel 
                    room={selectedRoom} 
                    onEdit={handleEditCurrent}
                  />
                ) : (
                  <Paper h="100%" radius="md" withBorder bg="gray.0">
                    <Stack align="center" justify="center" h="100%" gap="xs">
                      <ThemeIcon size={80} radius="xl" variant="light" color="gray" style={{ background: 'white' }}>
                        <IconBed size={40} />
                      </ThemeIcon>
                      <Text size="lg" fw={600} c="dimmed">Select a room to view details</Text>
                    </Stack>
                  </Paper>
                )}
              </Grid.Col>

            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Form Modal */}
      <RoomFormModal 
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        hotelId={hotelId}
        itemToEdit={isEditing ? selectedRoom : null}
        roomTypes={roomTypes}
      />
    </Box>
  );
}