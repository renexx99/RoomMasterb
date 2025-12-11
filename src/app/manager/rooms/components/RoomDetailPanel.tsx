'use client';

import { useEffect, useState } from 'react';
import {
  Paper, Group, Text, Badge, Stack, ThemeIcon, Button, ScrollArea, Timeline, Box,
  Card, Grid, Divider
} from '@mantine/core';
import { 
  IconPencil, IconBuildingSkyscraper, IconMapPin, 
  IconCalendar, IconNote, IconUser, IconClock, IconMaximize, IconArmchair,
  IconHistory, IconWifi, IconAirConditioning, IconBed
} from '@tabler/icons-react';
import { RoomWithDetails } from '../page';
import { getRoomHistory } from '../actions';

interface Props {
  room: RoomWithDetails;
  onEdit: () => void;
}

export function RoomDetailPanel({ room, onEdit }: Props) {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (room.id) {
      setHistory([]);
      getRoomHistory(room.id).then(setHistory);
    }
  }, [room.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'teal';
      case 'occupied': return 'blue';
      case 'maintenance': return 'orange';
      default: return 'gray';
    }
  };

  const getAmenities = () => {
    const am = room.room_type?.amenities;
    if (Array.isArray(am)) return am;
    if (typeof am === 'string') {
      try { return JSON.parse(am); } catch { return []; }
    }
    return [];
  };

  const amenities = getAmenities();

  return (
    <Paper 
      radius="md" 
      withBorder 
      h="100%" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        backgroundColor: 'white'
      }}
    >
      {/* ScrollArea dengan flex: 1 agar mengisi sisa ruang dan memungkinkan scrolling */}
      <ScrollArea style={{ flex: 1 }} type="auto">
        
        {/* Header - Gradient Blue */}
        <Box p="xl" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' }}>
          <Group justify="space-between" align="flex-start">
            <div>
              <Group align="center" gap="md">
                <Text fz={32} fw={700} lh={1}>{room.room_number}</Text>
                <Badge size="lg" color="white" c="blue.9" variant="white">
                  {room.room_type?.name}
                </Badge>
              </Group>
              
              <Group mt="md" gap="lg">
                <Group gap={6} style={{ opacity: 0.9 }}>
                  <IconBuildingSkyscraper size={18} />
                  <Text size="sm">Floor {room.floor_number || '-'}</Text>
                </Group>
                <Group gap={6} style={{ opacity: 0.9 }}>
                  <IconMapPin size={18} />
                  <Text size="sm">{room.wing || 'Main Building'}</Text>
                </Group>
                <Group gap={6} style={{ opacity: 0.9 }}>
                  <IconMaximize size={18} />
                  <Text size="sm">{room.room_type?.size_sqm || '-'} m²</Text>
                </Group>
              </Group>
            </div>

            <Button 
              variant="white" 
              color="blue" 
              leftSection={<IconPencil size={16}/>}
              onClick={onEdit}
            >
              Edit Room
            </Button>
          </Group>
        </Box>

        {/* Body Content */}
        <Box p="lg">
          <Grid gutter="lg">
            
            {/* Left Col: Info, Details & Amenities */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Stack gap="md">
                
                {/* Status Card */}
                <Card withBorder radius="md" padding="md">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={700} c="dimmed">CURRENT STATUS</Text>
                    <ThemeIcon color={getStatusColor(room.status)} variant="light"><IconClock size={16}/></ThemeIcon>
                  </Group>
                  <Text size="xl" fw={700} c={getStatusColor(room.status)} tt="capitalize">
                    {room.status}
                  </Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    Cleaning: <Text span fw={500} c="dark">{room.cleaning_status?.toUpperCase() || 'N/A'}</Text>
                  </Text>
                </Card>

                {/* Physical Details Card */}
                <Card withBorder radius="md" padding="md">
                  <Text size="sm" fw={700} mb="md" c="dimmed">PHYSICAL DETAILS</Text>
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconBed size={16} color="gray" />
                        <Text size="sm">Bed Type</Text>
                      </Group>
                      <Text size="sm" fw={500}>
                         {room.room_type?.bed_count}x {room.room_type?.bed_type || 'Bed'}
                      </Text>
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconArmchair size={16} color="gray" />
                        <Text size="sm">Furniture</Text>
                      </Group>
                      <Badge variant="light" color="gray">{room.furniture_condition?.replace('_', ' ') || 'Good'}</Badge>
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconAirConditioning size={16} color="gray" />
                        <Text size="sm">Smoking</Text>
                      </Group>
                      <Text size="sm" fw={500}>
                        {room.room_type?.smoking_allowed ? 'Allowed' : 'Non-Smoking'}
                      </Text>
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconCalendar size={16} color="gray" />
                        <Text size="sm">Last Renovation</Text>
                      </Group>
                      <Text size="sm" fw={500}>
                        {room.last_renovation_date ? new Date(room.last_renovation_date).toLocaleDateString() : 'N/A'}
                      </Text>
                    </Group>
                    
                    {room.special_notes && (
                      <>
                        <Divider />
                        <Stack gap={4}>
                          <Group gap="xs">
                            <IconNote size={16} color="gray" />
                            <Text size="sm">Notes</Text>
                          </Group>
                          <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                            {room.special_notes}
                          </Text>
                        </Stack>
                      </>
                    )}
                  </Stack>
                </Card>

                {/* Amenities Card */}
                <Card withBorder radius="md" padding="md">
                    <Group justify="space-between" mb="sm">
                        <Text size="sm" fw={700} c="dimmed">AMENITIES & FEATURES</Text>
                        <ThemeIcon color="cyan" variant="light"><IconWifi size={16}/></ThemeIcon>
                    </Group>
                    
                    {amenities.length > 0 ? (
                        <Group gap={6}>
                            {amenities.map((item: string, idx: number) => (
                                <Badge key={idx} variant="outline" color="blue" radius="sm" tt="capitalize">
                                    {item}
                                </Badge>
                            ))}
                        </Group>
                    ) : (
                        <Text size="sm" c="dimmed" fs="italic">No specific amenities listed.</Text>
                    )}
                </Card>

              </Stack>
            </Grid.Col>

            {/* Right Col: History */}
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Card withBorder radius="md" h="100%" padding="md">
                 <Group justify="space-between" mb="lg">
                    <Group gap="xs">
                        <ThemeIcon color="indigo" variant="light"><IconHistory size={18}/></ThemeIcon>
                        <Text fw={700} size="sm">Reservation History</Text>
                    </Group>
                 </Group>

                 {history.length > 0 ? (
                    <Timeline active={-1} bulletSize={30} lineWidth={2} color="indigo">
                        {history.map((h) => (
                            <Timeline.Item 
                                key={h.id} 
                                bullet={<IconUser size={14}/>}
                                title={
                                    <Text size="sm" fw={600}>{h.guest?.full_name || 'Unknown Guest'}</Text>
                                }
                            >
                                <Text size="xs" c="dimmed" mt={4}>
                                    {new Date(h.check_in_date).toLocaleDateString()} — {new Date(h.check_out_date).toLocaleDateString()}
                                </Text>
                                <Badge 
                                  size="xs" 
                                  color={h.payment_status === 'paid' ? 'teal' : 'yellow'} 
                                  variant="light" 
                                  mt={4}
                                >
                                    {h.payment_status}
                                </Badge>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                 ) : (
                    <Stack align="center" justify="center" py="xl" gap="xs">
                        <IconClock size={40} color="var(--mantine-color-gray-4)" />
                        <Text c="dimmed" size="sm">No history available.</Text>
                    </Stack>
                 )}
              </Card>
            </Grid.Col>

          </Grid>
        </Box>
        <Box pb="xl" />
      </ScrollArea>
    </Paper>
  );
}