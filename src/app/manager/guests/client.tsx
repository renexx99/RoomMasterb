// src/app/manager/guests/client.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Container, Group, Paper, TextInput, Select, 
  Text, Grid, Stack, Box, Button, 
  ScrollArea, Avatar, Badge, ThemeIcon, Divider
} from '@mantine/core';
import { 
  IconPlus, IconSearch, IconUserStar, IconFilter, IconUserOff
} from '@tabler/icons-react';
import { Guest } from '@/core/types/database';
import { GuestDetailPanel } from './components/GuestDetailPanel';
import { GuestFormModal } from './components/GuestFormModal';

interface ClientProps {
  initialGuests: Guest[];
  hotelId: string;
}

export default function ManagerGuestsClient({ initialGuests, hotelId }: ClientProps) {
  const MAX_WIDTH = 1800;

  // State
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string | null>(null);
  
  // Modal State
  const [modalOpened, setModalOpened] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Filtered guests logic
  const filteredGuests = useMemo(() => {
    let result = [...initialGuests];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(g => 
        g.full_name.toLowerCase().includes(lower) ||
        g.email.toLowerCase().includes(lower) ||
        (g.phone_number && g.phone_number.includes(searchTerm))
      );
    }

    if (filterTier) {
      result = result.filter(g => g.loyalty_tier === filterTier);
    }

    return result;
  }, [initialGuests, searchTerm, filterTier]);

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'diamond': return 'violet';
      case 'platinum': return 'cyan';
      case 'gold': return 'yellow';
      case 'silver': return 'gray';
      default: return 'blue'; // Bronze defaults to Blue in manager theme
    }
  };

  const handleCreateNew = () => {
    setSelectedGuest(null);
    setIsEditing(false);
    setModalOpened(true);
  };

  const handleEditCurrent = () => {
    if(selectedGuest) {
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
              
              {/* LEFT: Guest List (30%) */}
              <Grid.Col span={{ base: 12, md: 4, lg: 3 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Stack gap="sm" style={{ height: '100%' }}>
                  
                  {/* Search & Action Panel */}
                  <Paper p="sm" radius="md" withBorder shadow="sm">
                    <Stack gap="xs">
                      <TextInput
                        placeholder="Search name, email, phone..."
                        leftSection={<IconSearch size={14} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.currentTarget.value)}
                        radius="md"
                      />
                      <Group grow>
                        <Select
                            placeholder="Filter Tier"
                            data={['Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze']}
                            value={filterTier}
                            onChange={setFilterTier}
                            clearable
                            leftSection={<IconFilter size={14} />}
                            radius="md"
                        />
                      </Group>
                      
                      <Divider my={4} />
                      
                      <Button 
                        leftSection={<IconPlus size={16} />} 
                        onClick={handleCreateNew}
                        fullWidth
                        variant="gradient"
                        // Manager Theme Gradient
                        gradient={{ from: '#3b82f6', to: '#2563eb', deg: 135 }}
                        radius="md"
                      >
                        New Guest
                      </Button>
                    </Stack>
                  </Paper>

                  {/* List Scrollable */}
                  <Paper withBorder radius="md" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <Box p="xs" bg="gray.0" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                        <Text size="xs" fw={700} c="dimmed" tt="uppercase">Guest List ({filteredGuests.length})</Text>
                      </Box>
                      <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
                        <Stack gap={0}>
                          {filteredGuests.map((guest) => (
                            <Box
                              key={guest.id}
                              p="sm"
                              style={{
                                cursor: 'pointer',
                                // Blue Tint for Active State
                                backgroundColor: selectedGuest?.id === guest.id ? 'var(--mantine-color-blue-0)' : 'transparent',
                                borderBottom: '1px solid var(--mantine-color-gray-2)',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => setSelectedGuest(guest)}
                              className="hover:bg-gray-50"
                            >
                              <Group gap="sm" wrap="nowrap">
                                <Avatar color={getTierColor(guest.loyalty_tier)} radius="xl" size="md">
                                  {guest.full_name?.charAt(0)}
                                </Avatar>
                                <Box style={{ flex: 1, minWidth: 0 }}>
                                  <Group justify="space-between" align="center" wrap="nowrap" mb={2}>
                                      <Text fw={600} size="sm" truncate>{guest.full_name}</Text>
                                      {guest.loyalty_tier !== 'Bronze' && (
                                        <Badge size="xs" color={getTierColor(guest.loyalty_tier)} variant="light">
                                            {guest.loyalty_tier}
                                        </Badge>
                                      )}
                                  </Group>
                                  <Text size="xs" c="dimmed" truncate>{guest.email}</Text>
                                </Box>
                              </Group>
                            </Box>
                          ))}
                          {filteredGuests.length === 0 && (
                              <Stack align="center" justify="center" py="xl" gap="xs" c="dimmed">
                                  <IconUserOff size={32} stroke={1.5} />
                                  <Text size="sm">No guests found</Text>
                              </Stack>
                          )}
                        </Stack>
                      </ScrollArea>
                  </Paper>
                </Stack>
              </Grid.Col>

              {/* RIGHT: Detail View (70%) */}
              <Grid.Col span={{ base: 12, md: 8, lg: 9 }} style={{ height: '100%' }}>
                {selectedGuest ? (
                  <GuestDetailPanel 
                    guest={selectedGuest} 
                    onEdit={handleEditCurrent}
                  />
                ) : (
                  <Paper h="100%" radius="md" withBorder bg="gray.0">
                    <Stack align="center" justify="center" h="100%" gap="xs">
                      <ThemeIcon size={80} radius="xl" variant="light" color="gray" style={{ background: 'white' }}>
                        <IconUserStar size={40} />
                      </ThemeIcon>
                      <Text size="lg" fw={600} c="dimmed">Select a guest to view details</Text>
                    </Stack>
                  </Paper>
                )}
              </Grid.Col>
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Modal */}
      <GuestFormModal 
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        guest={isEditing ? selectedGuest : null}
        hotelId={hotelId}
      />
    </Box>
  );
}