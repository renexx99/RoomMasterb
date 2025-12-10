'use client';

import { Card, Group, Text, Button, Stack, Paper, Avatar, Badge } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';

const recentActivities = [
  { id: 'ACT-001', hotel: 'Grand Hotel Surabaya', action: 'New Property Added', user: 'System', time: '2 mins ago', status: 'success', type: 'hotel' },
  { id: 'ACT-002', hotel: 'Bali Beach Resort', action: 'Manager Role Assigned', user: 'Admin', time: '15 mins ago', status: 'info', type: 'user' },
  { id: 'ACT-003', hotel: 'Jakarta Plaza Hotel', action: 'System Maintenance', user: 'System', time: '1 hour ago', status: 'warning', type: 'system' },
  { id: 'ACT-004', hotel: 'Yogya Heritage Inn', action: 'Payment Gateway Updated', user: 'Tech Team', time: '3 hours ago', status: 'success', type: 'payment' },
  { id: 'ACT-005', hotel: 'Bandung Mountain View', action: 'New User Registration', user: 'System', time: '5 hours ago', status: 'info', type: 'user' },
];

export function RecentActivities() {
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>Recent System Activities</Text>
          <Text size="xs" c="dimmed">Latest actions across all properties</Text>
        </div>
        <Button variant="light" color="indigo" size="sm">
          View All
        </Button>
      </Group>

      <Stack gap={6}>
        {recentActivities.map((activity) => (
          <Paper
            key={activity.id}
            p="sm"
            radius="md"
            style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}
          >
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                <Avatar size={36} radius="md" color="indigo">
                  {activity.hotel.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>
                    {activity.hotel}
                  </Text>
                  <Group gap={6}>
                    <Text size="xs" c="dimmed">
                      {activity.id}
                    </Text>
                    <Text size="xs" c="dimmed">•</Text>
                    <Text size="xs" c="dimmed">
                      {activity.action}
                    </Text>
                  </Group>
                </div>
              </Group>

              <Group gap="sm" wrap="nowrap">
                <div style={{ textAlign: 'right' }}>
                  <Text size="xs" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    <IconClock size={12} />
                    {activity.time}
                  </Text>
                  <Text size="xs" fw={600} c="dimmed">
                    by {activity.user}
                  </Text>
                </div>
                <Badge
                  size="sm"
                  variant="light"
                  color={
                    activity.status === 'success' ? 'teal' :
                    activity.status === 'info' ? 'blue' :
                    'yellow'
                  }
                >
                  {activity.type}
                </Badge>
              </Group>
            </Group>
          </Paper>
        ))}
      </Stack>
    </Card>
  );
}