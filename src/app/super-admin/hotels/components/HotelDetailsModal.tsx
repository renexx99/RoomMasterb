'use client';

import { useState } from 'react';
import { Modal, Group, Text, Button, Stack, Image, Grid, Paper, Badge, ThemeIcon, Divider, NumberFormatter, Select, Box } from '@mantine/core';
import { IconBed, IconUsers, IconMapPin, IconCash, IconUserCheck, IconEdit, IconTrash, IconLogin, IconBuildingSkyscraper } from '@tabler/icons-react';
import { HotelWithStats, HotelWithDetails } from '@/core/types/database';
import { startImpersonation } from '@/features/auth/hooks/useAuth';

interface Props {
  opened: boolean;
  onClose: () => void;
  hotel: HotelWithDetails | null;
  onEdit: (hotel: HotelWithDetails) => void;
  onDelete: (hotel: HotelWithDetails) => void;
}

export function HotelDetailsModal({ opened, onClose, hotel, onEdit, onDelete }: Props) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [impersonateLoading, setImpersonateLoading] = useState(false);

  if (!hotel) return null;

  const handleImpersonate = () => {
    if (!selectedRole) return;
    setImpersonateLoading(true);
    startImpersonation(hotel.id, selectedRole);
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={<Text fw={700} size="lg">Hotel Details</Text>} 
      size="xl" 
      centered
      radius="md"
    >
      <Grid gutter="lg">
        {/* Left Column: Basic Info */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack>
            <Image
              src={hotel.image_url || "https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-8.png"}
              radius="md"
              alt={hotel.name}
              h={200}
              fit="cover"
            />
            <div>
                <Text fw={700} size="xl" style={{ lineHeight: 1.2 }}>{hotel.name}</Text>
                <Group gap={8} mt={8}>
                    <Badge size="sm" variant="outline" color="gray" radius="sm">{hotel.code}</Badge>
                    <Badge size="sm" color={hotel.status === 'active' ? 'teal' : 'red'} radius="sm">{hotel.status}</Badge>
                </Group>
            </div>
            
            <Group gap={8} align="flex-start" bg="gray.0" p="xs" style={{ borderRadius: 8 }}>
              <IconMapPin size={18} style={{ marginTop: 3 }} color="gray" />
              <Text size="sm" c="dimmed" style={{ flex: 1 }}>{hotel.address}</Text>
            </Group>

            <Paper withBorder p="md" radius="md">
              <Text size="sm" fw={700} mb="xs" c="dimmed" tt="uppercase">Operational Policies</Text>
              <Grid>
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">Check-in Time</Text>
                  <Text fw={600}>{hotel.check_in_time?.substring(0, 5) || '14:00'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">Check-out Time</Text>
                  <Text fw={600}>{hotel.check_out_time?.substring(0, 5) || '12:00'}</Text>
                </Grid.Col>
              </Grid>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Text size="sm" fw={700} mb="sm" c="dimmed" tt="uppercase">Room Types & Pricing</Text>
              {hotel.room_types && hotel.room_types.length > 0 ? (
                <Stack gap="xs">
                  {hotel.room_types.map(rt => (
                    <Paper key={rt.id} withBorder p="sm" radius="md" bg="gray.0">
                      <Group justify="space-between" mb="xs">
                        <Text fw={600} size="sm">{rt.name}</Text>
                        <Badge size="sm" color="indigo" variant="light">
                          <NumberFormatter prefix="Rp " value={rt.price_per_night} thousandSeparator="." decimalSeparator="," /> / night
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">Base Price: <NumberFormatter prefix="Rp " value={rt.base_price || 0} thousandSeparator="." decimalSeparator="," /></Text>
                      {rt.rooms && rt.rooms.length > 0 ? (
                        <Text size="xs" c="dimmed" mt={4}>
                          <b>Rooms:</b> {rt.rooms.map(r => r.room_number).join(', ')}
                        </Text>
                      ) : (
                        <Text size="xs" c="dimmed" mt={4} fs="italic">No rooms available</Text>
                      )}
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed" fs="italic">No room types configured.</Text>
              )}
            </Paper>

          </Stack>
        </Grid.Col>

        {/* Right Column: Stats & Actions */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="md">
             {/* --- STATS --- */}
             <Paper withBorder p="md" radius="md">
                <Text size="sm" fw={700} mb="md" c="dimmed" tt="uppercase">Performance Summary</Text>
                <Grid gutter="sm">
                    <Grid.Col span={6}>
                        <Group gap={10}>
                            <ThemeIcon variant="light" color="indigo" size="lg" radius="md"><IconBed size={20}/></ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed">Total Rooms</Text>
                                <Text fw={700} size="lg">{hotel.total_rooms}</Text>
                            </div>
                        </Group>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Group gap={10}>
                            <ThemeIcon variant="light" color="pink" size="lg" radius="md"><IconUsers size={20}/></ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed">Total Staff</Text>
                                <Text fw={700} size="lg">{hotel.total_staff}</Text>
                            </div>
                        </Group>
                    </Grid.Col>
                    <Grid.Col span={6}>
                         <Group gap={10}>
                            <ThemeIcon variant="light" color="blue" size="lg" radius="md"><IconUserCheck size={20}/></ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed">Active Guests</Text>
                                <Text fw={700} size="lg">{hotel.active_residents}</Text>
                            </div>
                        </Group>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Group gap={10}>
                            <ThemeIcon variant="light" color="teal" size="lg" radius="md"><IconCash size={20}/></ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed">Revenue</Text>
                                <Text fw={700} size="lg" c="teal.7">
                                    <NumberFormatter prefix="Rp " value={hotel.total_revenue} thousandSeparator="." decimalSeparator="," />
                                </Text>
                            </div>
                        </Group>
                    </Grid.Col>
                </Grid>
             </Paper>

            {/* --- LOGIN AS --- */}
            <Paper withBorder p="sm" radius="md" style={{ borderColor: 'var(--mantine-color-violet-2)', background: 'var(--mantine-color-violet-0)' }}>
                <Stack gap="xs">
                    <Group gap="xs">
                        <ThemeIcon color="violet" variant="filled" size="sm" radius="xl"><IconBuildingSkyscraper size={12}/></ThemeIcon>
                        <Text size="sm" fw={600} c="violet.9">Access Hotel System</Text>
                    </Group>
                    <Text size="xs" c="dimmed">Temporarily login as staff to perform checks.</Text>
                    
                    <Group align="flex-end" gap="xs">
                        <Select 
                            placeholder="Select Role"
                            data={[
                                { value: 'Hotel Manager', label: 'Hotel Manager (Full Access)' },
                                { value: 'Front Office', label: 'Front Office' },
                                { value: 'Hotel Admin', label: 'Hotel Admin' },
                            ]}
                            value={selectedRole}
                            onChange={setSelectedRole}
                            style={{ flex: 1 }}
                            size="sm"
                            radius="md"
                        />
                        <Button 
                            color="violet" 
                            size="sm" 
                            radius="md"
                            leftSection={<IconLogin size={16} />}
                            disabled={!selectedRole}
                            loading={impersonateLoading}
                            onClick={handleImpersonate}
                        >
                            Login
                        </Button>
                    </Group>
                </Stack>
            </Paper>

            <Divider />

            {/* --- CRUD ACTIONS --- */}
            <Group grow>
                <Button leftSection={<IconEdit size={16} />} variant="default" radius="md" onClick={() => { onClose(); onEdit(hotel); }}>
                    Edit Data
                </Button>
                <Button leftSection={<IconTrash size={16} />} color="red" variant="light" radius="md" onClick={() => { onClose(); onDelete(hotel); }}>
                    Delete
                </Button>
            </Group>
          </Stack>
        </Grid.Col>
      </Grid>
    </Modal>
  );
}