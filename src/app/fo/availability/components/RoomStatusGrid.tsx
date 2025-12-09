// src/app/fo/availability/components/RoomStatusGrid.tsx
'use client';

import { SimpleGrid, Paper, Text, Group, Badge, ActionIcon, Menu, Stack } from '@mantine/core';
// Ganti IconBroom dengan IconSpray
import { IconDots, IconSpray, IconBed, IconTool, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { updateRoomStatus } from '../actions';
import { useState } from 'react';

interface Props {
  rooms: any[];
}

export function RoomStatusGrid({ rooms }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (roomId: string, status: string, cleaning: string) => {
    setLoadingId(roomId);
    try {
      await updateRoomStatus(roomId, status as any, cleaning as any);
      notifications.show({ title: 'Status Diupdate', message: 'Status kamar berhasil diubah', color: 'green' });
    } catch (e) {
      notifications.show({ title: 'Error', message: 'Gagal update status', color: 'red' });
    } finally {
      setLoadingId(null);
    }
  };

  // Helper untuk menentukan tampilan berdasarkan logika bisnis
  const getRoomState = (room: any) => {
    if (room.status === 'maintenance') return { label: 'Maintenance', color: 'gray', icon: IconTool, bg: 'gray.1' };
    if (room.status === 'occupied') return { label: 'Occupied', color: 'blue', icon: IconBed, bg: 'blue.0' };
    
    // Status Available
    // Gunakan IconSpray di sini menggantikan IconBroom
    if (room.cleaning_status === 'dirty') return { label: 'Vacant Dirty', color: 'red', icon: IconSpray, bg: 'red.0' };
    return { label: 'Vacant Ready', color: 'teal', icon: IconCheck, bg: 'teal.0' };
  };

  return (
    <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
      {rooms.map((room) => {
        const state = getRoomState(room);
        
        return (
          <Paper 
            key={room.id} 
            radius="md" 
            p="sm" 
            withBorder
            style={{ 
              borderTop: `4px solid var(--mantine-color-${state.color}-5)`,
              backgroundColor: `var(--mantine-color-${state.bg})`
            }}
          >
            <Group justify="space-between" align="flex-start" mb="xs">
              <Stack gap={0}>
                <Text fw={700} size="lg">{room.room_number}</Text>
                <Text size="xs" c="dimmed">{room.room_type?.name}</Text>
              </Stack>
              
              <Menu position="bottom-end">
                <Menu.Target>
                  <ActionIcon variant="transparent" color="gray" loading={loadingId === room.id}>
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Ubah Status</Menu.Label>
                  <Menu.Item 
                    leftSection={<IconCheck size={14}/>} 
                    onClick={() => handleStatusChange(room.id, 'available', 'clean')}
                  >
                    Mark as Ready (VR)
                  </Menu.Item>
                  <Menu.Item 
                    // Gunakan IconSpray juga di menu
                    leftSection={<IconSpray size={14}/>} 
                    onClick={() => handleStatusChange(room.id, 'available', 'dirty')}
                  >
                    Mark as Dirty (VD)
                  </Menu.Item>
                  <Menu.Item 
                    leftSection={<IconTool size={14}/>} 
                    color="orange"
                    onClick={() => handleStatusChange(room.id, 'maintenance', 'dirty')}
                  >
                    Maintenance (OOO)
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>

            <Group justify="space-between" align="center" mt="md">
               <Badge 
                 color={state.color} 
                 variant="light" 
                 size="sm"
                 leftSection={<state.icon size={12}/>}
               >
                 {state.label}
               </Badge>
            </Group>
          </Paper>
        );
      })}
    </SimpleGrid>
  );
}