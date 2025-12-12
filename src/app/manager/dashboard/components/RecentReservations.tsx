// src/app/manager/dashboard/components/RecentReservations.tsx
'use client';

import { Card, Group, Text, Button, Stack, Paper, Avatar, Badge } from '@mantine/core';
import { IconClockHour4 } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

// Interface untuk data yang masuk
interface RecentReservationItem {
  id: string;
  guest_name: string;
  room_number: string;
  check_in_date: string;
  status: string;
  total_price: number;
}

interface Props {
  data: RecentReservationItem[];
}

export function RecentReservations({ data }: Props) {
  const router = useRouter();

  if (data.length === 0) {
    return (
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Text c="dimmed" ta="center" size="sm">Belum ada reservasi terbaru.</Text>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>Recent Reservations</Text>
          <Text size="xs" c="dimmed">Latest bookings and check-ins</Text>
        </div>
        <Button 
          variant="light" 
          color="indigo" 
          size="sm"
          onClick={() => router.push('/manager/reservations')}
        >
          View All
        </Button>
      </Group>

      <Stack gap={6}>
        {data.map((res) => (
          <Paper
            key={res.id}
            p="sm"
            radius="md"
            style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}
          >
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                <Avatar size={36} radius="md" color="indigo">
                  {res.guest_name.charAt(0).toUpperCase()}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>
                    {res.guest_name}
                  </Text>
                  <Group gap={6}>
                    <Text size="xs" c="dimmed">
                      #{res.id.substring(0, 8)}
                    </Text>
                    <Text size="xs" c="dimmed">•</Text>
                    <Text size="xs" c="dimmed">
                      Room {res.room_number}
                    </Text>
                  </Group>
                </div>
              </Group>

              <Group gap="sm" wrap="nowrap">
                <div style={{ textAlign: 'right' }}>
                  <Text size="xs" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    <IconClockHour4 size={12} />
                    {new Date(res.check_in_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </Text>
                  <Text size="sm" fw={700}>
                    Rp {res.total_price.toLocaleString('id-ID')}
                  </Text>
                </div>
                <Badge
                  size="sm"
                  variant="light"
                  color={
                    res.status === 'paid' ? 'teal' :
                    res.status === 'confirmed' ? 'blue' :
                    res.status === 'cancelled' ? 'red' :
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