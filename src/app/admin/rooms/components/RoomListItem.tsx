'use client';

import { Box, Group, Text, Badge, ThemeIcon } from '@mantine/core';
import { IconBed, IconTool, IconLock } from '@tabler/icons-react';
import { RoomWithDetails } from '../page';

interface Props {
  room: RoomWithDetails;
  selected: boolean;
  onClick: () => void;
}

export function RoomListItem({ room, selected, onClick }: Props) {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'teal';
      case 'occupied': return 'blue';
      case 'maintenance': return 'orange';
      default: return 'gray';
    }
  };

  const StatusIcon = () => {
    if (room.status === 'occupied') return <IconLock size={14} />;
    if (room.status === 'maintenance') return <IconTool size={14} />;
    return <IconBed size={14} />;
  };

  return (
    <Box
      p="sm"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        backgroundColor: selected ? 'var(--mantine-color-blue-0)' : 'transparent',
        borderLeft: selected ? '4px solid var(--mantine-color-blue-6)' : '4px solid transparent',
        borderBottom: '1px solid var(--mantine-color-gray-1)',
        transition: 'all 0.2s ease'
      }}
      className="hover:bg-gray-50"
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon 
            variant="light" 
            color={getStatusColor(room.status)} 
            size="md" 
            radius="md"
          >
            <StatusIcon />
          </ThemeIcon>
          <div style={{ minWidth: 0 }}>
            <Text fw={600} size="sm" truncate>{room.room_number}</Text>
            <Text size="xs" c="dimmed" truncate>{room.room_type?.name}</Text>
          </div>
        </Group>
        
        <Badge 
          size="xs" 
          variant="dot" 
          color={getStatusColor(room.status)}
        >
          {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
        </Badge>
      </Group>
    </Box>
  );
}