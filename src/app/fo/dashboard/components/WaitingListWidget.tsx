'use client';

import { Card, Text, Group, Stack, Avatar, Badge, ActionIcon, Box } from '@mantine/core';
import { IconClock, IconDotsVertical, IconCheck } from '@tabler/icons-react';

const waitingData = [
  { id: 1, name: 'Mr. John Wick', type: 'VIP', waitTime: '15m', pax: 1, roomType: 'Suite' },
  { id: 2, name: 'Mrs. Lara Croft', type: 'Reg', waitTime: '10m', pax: 2, roomType: 'Deluxe' },
  { id: 3, name: 'Mr. Bruce Wayne', type: 'VIP', waitTime: '05m', pax: 1, roomType: 'Presidential' },
  { id: 4, name: 'Ms. Diana Prince', type: 'Reg', waitTime: '02m', pax: 2, roomType: 'Standard' },
];

export function WaitingListWidget() {
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>Waiting List</Text>
          <Text size="xs" c="dimmed">Guests waiting for check-in/rooms</Text>
        </div>
        <Badge color="orange" variant="light">{waitingData.length}</Badge>
      </Group>

      <Stack gap="sm">
        {waitingData.map((guest) => (
          <Box
            key={guest.id}
            p="xs"
            style={{ 
              border: '1px solid #f1f3f5', 
              borderRadius: '8px',
              backgroundColor: '#f8f9fa' 
            }}
          >
            <Group wrap="nowrap" align="center">
              <Avatar color={guest.type === 'VIP' ? 'violet' : 'blue'} radius="xl" size="sm">
                {guest.name.charAt(4)}
              </Avatar>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <Group gap="xs">
                  <Text size="sm" fw={600} truncate>{guest.name}</Text>
                  {guest.type === 'VIP' && <Badge size="xs" color="violet" variant="filled">VIP</Badge>}
                </Group>
                <Text size="xs" c="dimmed">
                  {guest.roomType} • {guest.pax} Pax
                </Text>
              </div>

              <div style={{ textAlign: 'right' }}>
                <Badge 
                  size="xs" 
                  variant="outline" 
                  color="orange" 
                  leftSection={<IconClock size={10} />}
                  style={{ marginBottom: 4 }}
                >
                  {guest.waitTime}
                </Badge>
                <Group gap={4} justify="flex-end">
                    <ActionIcon size="sm" color="teal" variant="light"><IconCheck size={12} /></ActionIcon>
                    <ActionIcon size="sm" color="gray" variant="subtle"><IconDotsVertical size={12} /></ActionIcon>
                </Group>
              </div>
            </Group>
          </Box>
        ))}
      </Stack>
    </Card>
  );
}