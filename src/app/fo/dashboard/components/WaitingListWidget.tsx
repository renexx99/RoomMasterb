'use client';

import { Card, Text, Group, Stack, Avatar, Badge, ActionIcon, Box } from '@mantine/core';
import { IconClock, IconDotsVertical, IconCheck } from '@tabler/icons-react';
import { WaitingGuest } from '../page';

interface Props {
  data: WaitingGuest[];
}

export function WaitingListWidget({ data }: Props) {
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0].charAt(0)}${parts[1].charAt(0)}`;
    return name.charAt(0);
  };

  const isVIP = (tier: string) => ['gold', 'platinum', 'diamond'].includes(tier);

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>Waiting List</Text>
          <Text size="xs" c="dimmed">Guests waiting for check-in</Text>
        </div>
        <Badge color={data.length > 0 ? 'orange' : 'gray'} variant="light">{data.length}</Badge>
      </Group>

      {data.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          No guests waiting for check-in today
        </Text>
      ) : (
        <Stack gap="sm">
          {data.map((guest) => (
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
                <Avatar color={isVIP(guest.loyaltyTier) ? 'violet' : 'blue'} radius="xl" size="sm">
                  {getInitials(guest.guestName)}
                </Avatar>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs">
                    <Text size="sm" fw={600} truncate>{guest.guestName}</Text>
                    {isVIP(guest.loyaltyTier) && <Badge size="xs" color="violet" variant="filled">VIP</Badge>}
                  </Group>
                  <Text size="xs" c="dimmed">
                    {guest.roomType} • Room {guest.roomNumber} • {guest.pax} Pax
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
                    Waiting
                  </Badge>
                </div>
              </Group>
            </Box>
          ))}
        </Stack>
      )}
    </Card>
  );
}