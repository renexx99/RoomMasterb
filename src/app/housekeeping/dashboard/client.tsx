'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Text,
  Group,
  Badge,
  Paper,
  SimpleGrid,
  Menu,
  ActionIcon,
  Card,
  Table,
  Grid,
  Button,
  Stack,
  ThemeIcon,
  Modal,
  Title,
  Select,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconSpray,
  IconCheck,
  IconBed,
  IconTool,
  IconDroplet,
  IconDots,
  IconFlame,
  IconSparkles,
} from '@tabler/icons-react';
import { HousekeepingDashboardData } from './page';
import { updateRoomCleaningStatus } from './actions';
import {
  getCombinedRoomStatus,
  CombinedRoomStatus,
  COMBINED_STATUS_CONFIG,
} from '@/core/types/database';

interface ClientProps {
  data: HousekeepingDashboardData;
}

export default function HousekeepingDashboardClient({ data }: ClientProps) {
  const { stats, rooms } = data;
  const [filter, setFilter] = useState<string>('all');
  const [updating, setUpdating] = useState(false);

  // Derive combined statuses for all rooms
  const roomsWithStatus = useMemo(() =>
    rooms.map((room) => ({
      ...room,
      combinedStatus: getCombinedRoomStatus(room.status, room.cleaning_status),
    })),
    [rooms]
  );

  // Filter rooms
  const filteredRooms = useMemo(() => {
    if (filter === 'all') return roomsWithStatus;
    if (['VD', 'VC', 'OC', 'OD', 'OOO'].includes(filter)) {
      return roomsWithStatus.filter((r) => r.combinedStatus === filter);
    }
    // Also allow filtering by base cleaning status if needed
    return roomsWithStatus.filter((r) => r.cleaning_status === filter);
  }, [roomsWithStatus, filter]);

  const handleStatusUpdate = async (roomId: string, newCleaningStatus: 'clean' | 'dirty' | 'cleaning' | 'inspected') => {
    setUpdating(true);
    try {
      const result = await updateRoomCleaningStatus(roomId, newCleaningStatus);
      if (result.error) throw new Error(result.error);
      notifications.show({
        title: 'Status Updated',
        message: `Room status successfully updated to ${newCleaningStatus.toUpperCase()}`,
        color: 'green',
      });
      window.location.reload();
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to update status',
        color: 'red',
      });
    } finally {
      setUpdating(false);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Rooms' },
    { value: 'VD', label: 'Vacant Dirty (VD)' },
    { value: 'VC', label: 'Vacant Clean (VC)' },
    { value: 'OD', label: 'Occupied Dirty (OD)' },
    { value: 'OC', label: 'Occupied Clean (OC)' },
    { value: 'dirty', label: 'All Dirty Status' },
    { value: 'cleaning', label: 'Currently Cleaning' },
  ];

  return (
    <Box style={{ background: '#f8f9fa', minHeight: '100%', padding: '1rem' }}>
      <Container fluid px={0} py={0}>
        {/* ====== COMPACT KPI STATS ====== */}
        <SimpleGrid cols={{ base: 3, sm: 3 }} spacing="sm" mb="lg">
          <StatCard
            label="Dirty"
            value={stats.dirtyRooms}
            icon={IconFlame}
            color="red"
          />
          <StatCard
            label="Cleaning"
            value={stats.cleaningRooms}
            icon={IconSpray}
            color="orange"
          />
          <StatCard
            label="Done"
            value={stats.completedToday}
            icon={IconSparkles}
            color="teal"
          />
        </SimpleGrid>

        {/* Clean Toolbar */}
        <Paper p="sm" radius="md" withBorder mb="lg" shadow="sm">
          <Grid align="center" gutter="sm">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Text fw={600} size="md">Room Status Overview</Text>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group justify="flex-end">
                <Select
                  placeholder="Filter by Status"
                  value={filter}
                  onChange={(val) => setFilter(val || 'all')}
                  data={statusOptions}
                  size="sm"
                  style={{ width: '100%', maxWidth: 250 }}
                  radius="md"
                />
              </Group>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* ====== ROOMS TABLE ====== */}
        <Paper shadow="sm" radius="md" withBorder style={{ overflow: 'hidden' }}>
          <Box style={{ overflowX: 'auto' }}>
            <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead bg="gray.0">
                <Table.Tr>
                  <Table.Th style={{ whiteSpace: 'nowrap' }}>Room</Table.Th>
                  <Table.Th style={{ whiteSpace: 'nowrap' }}>Type / Floor</Table.Th>
                  <Table.Th style={{ whiteSpace: 'nowrap' }}>Occupancy</Table.Th>
                  <Table.Th style={{ whiteSpace: 'nowrap' }}>Condition</Table.Th>
                  <Table.Th style={{ whiteSpace: 'nowrap' }}>Notes</Table.Th>
                  <Table.Th ta="right" style={{ whiteSpace: 'nowrap' }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredRooms.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6} ta="center" py="xl" c="dimmed">
                      No rooms found for the selected filter.
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredRooms.map((room) => {
                    const combinedConfig = COMBINED_STATUS_CONFIG[room.combinedStatus as CombinedRoomStatus];
                    const isClean = room.cleaning_status === 'clean' || room.cleaning_status === 'inspected';
                    const isCleaning = room.cleaning_status === 'cleaning';

                    return (
                      <Table.Tr key={room.id}>
                        {/* Room Number */}
                        <Table.Td>
                          <Group gap="sm" wrap="nowrap">
                            <ThemeIcon
                              color={combinedConfig.color}
                              variant="light"
                              radius="md"
                              size="md"
                            >
                              <IconBed size={16} />
                            </ThemeIcon>
                            <Text fw={600} size="sm" style={{ whiteSpace: 'nowrap' }}>{room.room_number}</Text>
                          </Group>
                        </Table.Td>

                        {/* Type and Floor */}
                        <Table.Td>
                          <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>{room.room_type?.name || 'Standard'}</Text>
                          <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>Floor {room.floor_number || '-'}</Text>
                        </Table.Td>

                        {/* Occupancy */}
                        <Table.Td>
                          <Badge
                            variant="light"
                            color={room.status === 'occupied' ? 'blue' : 'gray'}
                            size="sm"
                            radius="sm"
                          >
                            {room.status === 'occupied' ? 'Occupied' : 'Vacant'}
                          </Badge>
                        </Table.Td>

                        {/* Combined Status Condition */}
                        <Table.Td>
                          <Badge
                            variant="outline"
                            color={combinedConfig.color}
                            size="sm"
                            radius="sm"
                          >
                            {combinedConfig.label} ({room.combinedStatus})
                          </Badge>
                        </Table.Td>

                        {/* Notes */}
                        <Table.Td>
                          {room.special_notes ? (
                            <Text size="xs" c="dimmed" lineClamp={2} style={{ minWidth: 150 }}>
                              {room.special_notes}
                            </Text>
                          ) : (
                            <Text size="xs" c="dimmed" fs="italic" style={{ whiteSpace: 'nowrap' }}>No notes</Text>
                          )}
                        </Table.Td>

                        {/* Actions */}
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Menu position="bottom-end" shadow="md" width={200} withArrow>
                            <Menu.Target>
                              <ActionIcon variant="subtle" color="gray" loading={updating}>
                                <IconDots size={18} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Label>Update Status</Menu.Label>
                              {!isCleaning && !isClean && (
                                <Menu.Item
                                  leftSection={<IconSpray size={14} />}
                                  color="orange"
                                  onClick={() => handleStatusUpdate(room.id, 'cleaning')}
                                >
                                  Start Cleaning
                                </Menu.Item>
                              )}
                              {(isCleaning || !isClean) && (
                                <Menu.Item
                                  leftSection={<IconCheck size={14} />}
                                  color="teal"
                                  onClick={() => handleStatusUpdate(room.id, 'clean')}
                                >
                                  Mark as Clean
                                </Menu.Item>
                              )}
                              {isClean && (
                                <Menu.Item
                                  leftSection={<IconDroplet size={14} />}
                                  color="red"
                                  onClick={() => handleStatusUpdate(room.id, 'dirty')}
                                >
                                  Mark as Dirty
                                </Menu.Item>
                              )}
                            </Menu.Dropdown>
                          </Menu>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })
                )}
              </Table.Tbody>
            </Table>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

// ============ Sub-Components ============

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<any>;
  color: string;
}) {
  return (
    <Card p="sm" radius="md" withBorder shadow="sm" style={{ backgroundColor: 'white' }}>
      <Group justify="space-between" align="center" wrap="nowrap">
        <Box>
          <Text size="10px" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.5px' }} lineClamp={1}>
            {label}
          </Text>
          <Title order={3} style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2 }}>
            {value}
          </Title>
        </Box>
        <ThemeIcon size={32} radius="md" variant="light" color={color}>
          <Icon size={16} stroke={2} />
        </ThemeIcon>
      </Group>
    </Card>
  );
}
