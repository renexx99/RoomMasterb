// src/app/ta/availability/components/RoomStatusList.tsx
'use client';

import { Paper, Text, Group, Badge, Stack, Box } from '@mantine/core';
import { IconSpray, IconBed, IconTool, IconCheck } from '@tabler/icons-react';

interface Props {
  rooms: any[];
}

export function RoomStatusList({ rooms }: Props) {

  const getStatusConfig = (room: any) => {
    if (room.status === 'maintenance') return { label: 'OOO', color: 'gray', icon: IconTool, bg: 'gray.0' };
    if (room.status === 'occupied') return { label: 'Occupied', color: 'dark', icon: IconBed, bg: 'gray.1' };
    if (room.cleaning_status === 'dirty') return { label: 'Dirty', color: 'red', icon: IconSpray, bg: 'red.0' };
    return { label: 'Ready', color: 'teal', icon: IconCheck, bg: 'teal.0' };
  };

  return (
    <Stack gap="xs">
      {rooms.map((room) => {
        const config = getStatusConfig(room);
        
        return (
          <Paper 
            key={room.id} 
            p="xs" 
            radius="md" 
            withBorder 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              backgroundColor: 'white'
            }}
          >
            {/* Room Info */}
            <Group gap="sm">
              <Box 
                style={{ 
                  width: 42, 
                  height: 42, 
                  borderRadius: 8, 
                  backgroundColor: `var(--mantine-color-${config.bg})`,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: `var(--mantine-color-${config.color}-7)`
                }}
              >
                <Text fw={700} size="sm">{room.room_number}</Text>
              </Box>
              <Stack gap={0}>
                <Text size="sm" fw={600} lineClamp={1}>{room.room_type?.name}</Text>
                {room.floor_number && <Text size="10px" c="dimmed">Floor {room.floor_number}</Text>}
              </Stack>
            </Group>

            {/* Status Badge */}
            <Badge 
                size="sm" 
                variant="light" 
                color={config.color}
                leftSection={<config.icon size={12}/>}
            >
                {config.label}
            </Badge>
          </Paper>
        );
      })}
    </Stack>
  );
}
