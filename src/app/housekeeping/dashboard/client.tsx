// src/app/housekeeping/dashboard/client.tsx
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
  SegmentedControl,
  UnstyledButton,
  Modal,
  Button,
  Stack,
  Select,
  Textarea,
  ThemeIcon,
  Transition,
  Title,
  Progress,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconSpray,
  IconCheck,
  IconBed,
  IconTool,
  IconDroplet,
  IconAlertTriangle,
  IconArrowRight,
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

// Status icon mapping
const STATUS_ICONS: Record<CombinedRoomStatus, React.ComponentType<any>> = {
  VD: IconSpray,
  VC: IconCheck,
  OC: IconBed,
  OD: IconDroplet,
  OOO: IconTool,
};

export default function HousekeepingDashboardClient({ data }: ClientProps) {
  const { stats, rooms } = data;
  const [filter, setFilter] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
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
    return roomsWithStatus.filter((r) => r.combinedStatus === filter);
  }, [roomsWithStatus, filter]);

  // Count by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: roomsWithStatus.length };
    roomsWithStatus.forEach((r) => {
      counts[r.combinedStatus] = (counts[r.combinedStatus] || 0) + 1;
    });
    return counts;
  }, [roomsWithStatus]);

  const handleRoomTap = (room: any) => {
    setSelectedRoom(room);
    openModal();
  };

  const handleStatusUpdate = async (newCleaningStatus: 'clean' | 'dirty' | 'cleaning' | 'inspected') => {
    if (!selectedRoom) return;
    setUpdating(true);
    try {
      const result = await updateRoomCleaningStatus(selectedRoom.id, newCleaningStatus);
      if (result.error) throw new Error(result.error);
      notifications.show({
        title: 'Status Updated',
        message: `Room ${selectedRoom.room_number} → ${newCleaningStatus.toUpperCase()}`,
        color: 'green',
      });
      closeModal();
      // Force page refresh
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

  return (
    <Container fluid px="md" py="md">
      {/* ====== KPI STATS ====== */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm" mb="md">
        <StatCard
          label="Needs Cleaning"
          value={stats.dirtyRooms}
          icon={IconFlame}
          color="red"
          total={stats.totalRooms}
        />
        <StatCard
          label="In Progress"
          value={stats.cleaningRooms}
          icon={IconSpray}
          color="orange"
          total={stats.totalRooms}
        />
        <StatCard
          label="Done Today"
          value={stats.completedToday}
          icon={IconSparkles}
          color="teal"
          total={stats.totalRooms}
        />
        <StatCard
          label="Issues Open"
          value={stats.openReports}
          icon={IconAlertTriangle}
          color="violet"
          total={stats.totalRooms}
        />
      </SimpleGrid>

      {/* ====== FILTER TABS ====== */}
      <Paper radius="lg" p="xs" mb="md" withBorder style={{ background: 'white' }}>
        <Group gap="xs" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          <FilterChip
            label={`All (${statusCounts['all'] || 0})`}
            active={filter === 'all'}
            color="gray"
            onClick={() => setFilter('all')}
          />
          {(['VD', 'VC', 'OC', 'OD', 'OOO'] as CombinedRoomStatus[]).map((s) => (
            <FilterChip
              key={s}
              label={`${s} (${statusCounts[s] || 0})`}
              active={filter === s}
              color={COMBINED_STATUS_CONFIG[s].color}
              onClick={() => setFilter(s)}
            />
          ))}
        </Group>
      </Paper>

      {/* ====== ROOM GRID ====== */}
      <SimpleGrid cols={{ base: 3, xs: 4, sm: 5, md: 6, lg: 8 }} spacing="sm">
        {filteredRooms.map((room) => {
          const config = COMBINED_STATUS_CONFIG[room.combinedStatus as CombinedRoomStatus];
          const StatusIcon = STATUS_ICONS[room.combinedStatus as CombinedRoomStatus] || IconBed;
          return (
            <UnstyledButton
              key={room.id}
              onClick={() => handleRoomTap(room)}
              style={{ width: '100%' }}
            >
              <Paper
                radius="lg"
                p="sm"
                style={{
                  background: 'white',
                  border: `2px solid var(--mantine-color-${config.color}-2)`,
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                className="room-card"
              >
                {/* Status indicator dot */}
                <Box
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: `var(--mantine-color-${config.color}-5)`,
                  }}
                />
                
                {/* Room Number */}
                <Text size="lg" fw={800} c={`${config.color}.7`} style={{ lineHeight: 1 }}>
                  {room.room_number}
                </Text>

                {/* Status Badge */}
                <Badge
                  size="xs"
                  variant="light"
                  color={config.color}
                  mt={6}
                  style={{ fontSize: '9px', padding: '2px 6px' }}
                >
                  {room.combinedStatus}
                </Badge>

                {/* Room Type (truncated) */}
                <Text size="9px" c="dimmed" mt={2} lineClamp={1}>
                  {room.room_type?.name}
                </Text>
              </Paper>
            </UnstyledButton>
          );
        })}
      </SimpleGrid>

      {/* ====== ROOM ACTION MODAL ====== */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={null}
        size="sm"
        radius="lg"
        centered
        overlayProps={{ backgroundOpacity: 0.4, blur: 4 }}
        styles={{
          header: { display: 'none' },
          body: { padding: 0 },
        }}
      >
        {selectedRoom && (
          <RoomActionSheet
            room={selectedRoom}
            onClose={closeModal}
            onUpdate={handleStatusUpdate}
            updating={updating}
          />
        )}
      </Modal>

      {/* Hover styles */}
      <style>{`
        .room-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .room-card:active {
          transform: scale(0.97);
        }
      `}</style>
    </Container>
  );
}

// ============ Sub-Components ============

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  total,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<any>;
  color: string;
  total: number;
}) {
  const progress = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  
  return (
    <Paper p="md" radius="md" withBorder style={{ borderColor: '#e9ecef', background: 'white' }}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.5px' }}>
            {label}
          </Text>
          <Title order={2} style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: 4 }}>
            {value}
          </Title>
        </div>
        <ThemeIcon size={40} radius="md" variant="light" color={color}>
          <Icon size={20} stroke={1.5} />
        </ThemeIcon>
      </Group>
      <Progress value={progress} size="sm" radius="xl" color={color} mt={8} />
    </Paper>
  );
}

function FilterChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <UnstyledButton onClick={onClick}>
      <Badge
        size="lg"
        variant={active ? 'filled' : 'light'}
        color={color}
        radius="lg"
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontWeight: active ? 700 : 500,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Badge>
    </UnstyledButton>
  );
}

function RoomActionSheet({
  room,
  onClose,
  onUpdate,
  updating,
}: {
  room: any;
  onClose: () => void;
  onUpdate: (status: 'clean' | 'dirty' | 'cleaning' | 'inspected') => void;
  updating: boolean;
}) {
  const combinedStatus = getCombinedRoomStatus(room.status, room.cleaning_status);
  const config = COMBINED_STATUS_CONFIG[combinedStatus];
  const StatusIcon = STATUS_ICONS[combinedStatus] || IconBed;

  // Determine available actions based on current status
  const getActions = (): { label: string; value: 'clean' | 'dirty' | 'cleaning' | 'inspected'; color: string; icon: React.ComponentType<any> }[] => {
    switch (room.cleaning_status) {
      case 'dirty':
        return [
          { label: 'Start Cleaning', value: 'cleaning', color: 'orange', icon: IconSpray },
          { label: 'Mark as Clean', value: 'clean', color: 'teal', icon: IconCheck },
        ];
      case 'cleaning':
        return [
          { label: 'Mark as Clean', value: 'clean', color: 'teal', icon: IconCheck },
          { label: 'Mark for Inspection', value: 'inspected', color: 'blue', icon: IconCheck },
        ];
      case 'inspected':
        return [
          { label: 'Approve (Mark Clean)', value: 'clean', color: 'teal', icon: IconCheck },
          { label: 'Reject (Mark Dirty)', value: 'dirty', color: 'red', icon: IconSpray },
        ];
      case 'clean':
        return [
          { label: 'Mark as Dirty', value: 'dirty', color: 'red', icon: IconDroplet },
        ];
      default:
        return [
          { label: 'Mark as Clean', value: 'clean', color: 'teal', icon: IconCheck },
          { label: 'Mark as Dirty', value: 'dirty', color: 'red', icon: IconSpray },
        ];
    }
  };

  const actions = getActions();

  return (
    <Box>
      {/* Header */}
      <Box
        p="lg"
        style={{
          background: `linear-gradient(135deg, var(--mantine-color-${config.color}-5), var(--mantine-color-${config.color}-7))`,
          borderRadius: '16px 16px 0 0',
          textAlign: 'center',
        }}
      >
        <Text size="sm" c="white" fw={500} style={{ opacity: 0.8 }}>
          Room
        </Text>
        <Text size="2rem" fw={800} c="white" style={{ lineHeight: 1.2 }}>
          {room.room_number}
        </Text>
        <Badge size="lg" variant="white" color={config.color} mt="xs" radius="md">
          {config.label}
        </Badge>
      </Box>

      {/* Room Info */}
      <Box px="lg" py="sm">
        <Group justify="space-between" mb="xs">
          <Text size="xs" c="dimmed">Type</Text>
          <Text size="sm" fw={600}>{room.room_type?.name || '-'}</Text>
        </Group>
        <Group justify="space-between" mb="xs">
          <Text size="xs" c="dimmed">Floor</Text>
          <Text size="sm" fw={600}>{room.floor_number || '-'}</Text>
        </Group>
        <Group justify="space-between" mb="xs">
          <Text size="xs" c="dimmed">Occupancy</Text>
          <Badge size="sm" variant="light" color={room.status === 'occupied' ? 'blue' : 'gray'}>
            {room.status === 'occupied' ? 'Occupied' : 'Vacant'}
          </Badge>
        </Group>
        {room.special_notes && (
          <Box mt="xs" p="xs" style={{ background: '#fffbeb', borderRadius: 8, border: '1px solid #fcd34d' }}>
            <Text size="xs" c="orange.8">
              📝 {room.special_notes}
            </Text>
          </Box>
        )}
      </Box>

      {/* Action Buttons */}
      <Box px="lg" pb="lg">
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="sm">
          Quick Actions
        </Text>
        <Stack gap="xs">
          {actions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={action.value}
                fullWidth
                size="md"
                radius="lg"
                color={action.color}
                variant="light"
                leftSection={<ActionIcon size={18} />}
                rightSection={<IconArrowRight size={14} />}
                loading={updating}
                onClick={() => onUpdate(action.value)}
                styles={{
                  root: {
                    height: 48,
                    fontWeight: 600,
                    fontSize: '14px',
                  },
                  inner: {
                    justifyContent: 'space-between',
                  },
                }}
              >
                {action.label}
              </Button>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
