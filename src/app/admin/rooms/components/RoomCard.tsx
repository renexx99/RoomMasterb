'use client';

import { Card, Group, Stack, Text, Badge, Divider, ThemeIcon, ActionIcon, Menu } from '@mantine/core';
import { 
  IconEdit, IconTrash, IconBuildingWarehouse, IconMapPin, IconTool, 
  IconCalendar, IconNote, IconDotsVertical 
} from '@tabler/icons-react';
import { RoomWithDetails } from '../page';

interface Props {
  room: RoomWithDetails;
  onEdit: (room: RoomWithDetails) => void;
  onDelete: (room: RoomWithDetails) => void;
}

export function RoomCard({ room, onEdit, onDelete }: Props) {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'green';
      case 'occupied': return 'red';
      case 'maintenance': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Tersedia';
      case 'occupied': return 'Terisi';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };

  const getFurnitureColor = (condition?: string) => {
    switch (condition) {
      case 'excellent': return 'teal';
      case 'good': return 'blue';
      case 'fair': return 'yellow';
      case 'needs_replacement': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text fw={700} size="xl">{room.room_number}</Text>
            <Text size="sm" c="dimmed">{room.room_type?.name || 'N/A'}</Text>
          </div>
          
          <Menu position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => onEdit(room)}>
                Edit Kamar
              </Menu.Item>
              <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => onDelete(room)}>
                Hapus Kamar
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Badge color={getStatusColor(room.status)} variant="light" size="sm" fullWidth>
          {getStatusLabel(room.status)}
        </Badge>

        <Divider />

        <Stack gap={4}>
          {room.floor_number && (
            <Group gap={6}>
              <ThemeIcon size="xs" variant="light" color="indigo"><IconBuildingWarehouse size={12} /></ThemeIcon>
              <Text size="xs">Lantai {room.floor_number}</Text>
            </Group>
          )}
          {room.wing && (
            <Group gap={6}>
              <ThemeIcon size="xs" variant="light" color="cyan"><IconMapPin size={12} /></ThemeIcon>
              <Text size="xs">{room.wing}</Text>
            </Group>
          )}
          {room.furniture_condition && (
            <Group gap={6}>
              <ThemeIcon size="xs" variant="light" color={getFurnitureColor(room.furniture_condition)}>
                <IconTool size={12} />
              </ThemeIcon>
              <Text size="xs" tt="capitalize">{room.furniture_condition.replace('_', ' ')}</Text>
            </Group>
          )}
          {room.last_renovation_date && (
            <Group gap={6}>
              <ThemeIcon size="xs" variant="light" color="violet"><IconCalendar size={12} /></ThemeIcon>
              <Text size="xs">Renovasi: {new Date(room.last_renovation_date).toLocaleDateString('id-ID')}</Text>
            </Group>
          )}
          {room.special_notes && (
            <Group gap={6} align="flex-start">
              <ThemeIcon size="xs" variant="light" color="gray"><IconNote size={12} /></ThemeIcon>
              <Text size="xs" lineClamp={2}>{room.special_notes}</Text>
            </Group>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}