'use client';

import { Card, Group, Text, Button, Stack, Paper, Avatar, Badge } from '@mantine/core';
import { IconClockHour4 } from '@tabler/icons-react';

const recentReservations = [
  { id: 'RES-2401', guest: 'Andi Wijaya', room: '205', checkIn: 'Today 14:00', status: 'confirmed', amount: 'Rp 950K' },
  { id: 'RES-2402', guest: 'Sarah Chen', room: '312', checkIn: 'Today 16:30', status: 'checked-in', amount: 'Rp 1.5M' },
  { id: 'RES-2403', guest: 'Budi Hartono', room: '401', checkIn: 'Tomorrow 15:00', status: 'confirmed', amount: 'Rp 3.2M' },
  { id: 'RES-2404', guest: 'Linda Kusuma', room: '108', checkIn: 'Tomorrow 12:00', status: 'pending', amount: 'Rp 650K' },
  { id: 'RES-2405', guest: 'David Tan', room: '220', checkIn: 'Dec 03 14:00', status: 'confirmed', amount: 'Rp 900K' },
];

export function RecentReservations() {
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>Recent Reservations</Text>
          <Text size="xs" c="dimmed">Latest bookings and check-ins</Text>
        </div>
        <Button variant="light" color="indigo" size="sm">
          View All
        </Button>
      </Group>

      <Stack gap={6}>
        {recentReservations.map((res) => (
          <Paper
            key={res.id}
            p="sm"
            radius="md"
            style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}
          >
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                <Avatar size={36} radius="md" color="indigo">
                  {res.guest.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>
                    {res.guest}
                  </Text>
                  <Group gap={6}>
                    <Text size="xs" c="dimmed">
                      {res.id}
                    </Text>
                    <Text size="xs" c="dimmed">•</Text>
                    <Text size="xs" c="dimmed">
                      Room {res.room}
                    </Text>
                  </Group>
                </div>
              </Group>

              <Group gap="sm" wrap="nowrap">
                <div style={{ textAlign: 'right' }}>
                  <Text size="xs" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    <IconClockHour4 size={12} />
                    {res.checkIn}
                  </Text>
                  <Text size="sm" fw={700}>
                    {res.amount}
                  </Text>
                </div>
                <Badge
                  size="sm"
                  variant="light"
                  color={
                    res.status === 'checked-in' ? 'teal' :
                    res.status === 'confirmed' ? 'blue' :
                    'yellow'
                  }
                >
                  {res.status}
                </Badge>
              </Group>
            </Group>
          </Paper>
        ))}
      </Stack>
    </Card>
  );
}