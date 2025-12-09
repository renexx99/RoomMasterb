// src/app/fo/availability/components/RoomStatusList.tsx
'use client';

import { Paper, Text, Group, Badge, ActionIcon, Menu, Stack, Box, ScrollArea } from '@mantine/core';
import { IconDots, IconSpray, IconBed, IconTool, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { updateRoomStatus } from '../actions';
import { useState } from 'react';

interface Props {
  rooms: any[];
}

export function RoomStatusList({ rooms }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (roomId: string, status: string, cleaning: string) => {
    setLoadingId(roomId);
    try {
      await updateRoomStatus(roomId, status as any, cleaning as any);
      notifications.show({ title: 'Success', message: 'Status updated', color: 'green' });
    } catch (e) {
      notifications.show({ title: 'Error', message: 'Failed to update', color: 'red' });
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusConfig = (room: any) => {
    if (room.status === 'maintenance') return { label: 'OOO', color: 'gray', icon: IconTool, bg: 'gray.0' };
    if (room.status === 'occupied') return { label: 'Occupied', color: 'blue', icon: IconBed, bg: 'blue.0' };
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
            {/* Bagian Kiri: Nomor & Tipe */}
            <Group gap="sm">
              <Box 
                style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 8, 
                  backgroundColor: `var(--mantine-color-${config.bg})`,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: `var(--mantine-color-${config.color}-7)`
                }}
              >
                <Text fw={700}>{room.room_number}</Text>
              </Box>
              <Stack gap={0}>
                <Text size="sm" fw={600} lineClamp={1}>{room.room_type?.name}</Text>
                <Group gap={4}>
                    <Badge size="xs" variant="dot" color={config.color}>{config.label}</Badge>
                    {room.floor_number && <Text size="xs" c="dimmed">Lantai {room.floor_number}</Text>}
                </Group>
              </Stack>
            </Group>

            {/* Bagian Kanan: Aksi */}
            <Menu position="bottom-end" shadow="sm">
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" loading={loadingId === room.id}>
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Set Status</Menu.Label>
                <Menu.Item leftSection={<IconCheck size={14} />} onClick={() => handleStatusChange(room.id, 'available', 'clean')}>
                  Vacant Ready
                </Menu.Item>
                <Menu.Item leftSection={<IconSpray size={14} />} onClick={() => handleStatusChange(room.id, 'available', 'dirty')}>
                  Vacant Dirty
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<IconTool size={14} />} color="orange" onClick={() => handleStatusChange(room.id, 'maintenance', 'dirty')}>
                  Maintenance
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Paper>
        );
      })}
    </Stack>
  );
}