'use client';

import { Card, Group, Text, Button, Stack, Paper, Avatar, Badge, Box } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';

const recentActivities = [
  { id: 'SYS-001', hotel: 'Grand Hotel Surabaya', action: 'Upgrade to Enterprise', user: 'System', time: '2 mins ago', status: 'success', type: 'upgrade' },
  { id: 'USR-002', hotel: 'Bali Beach Resort', action: 'New Manager Added', user: 'Admin', time: '15 mins ago', status: 'info', type: 'user' },
  { id: 'PAY-003', hotel: 'Jakarta Plaza Hotel', action: 'Monthly Subscription Paid', user: 'System', time: '1 hour ago', status: 'success', type: 'payment' },
  { id: 'SYS-004', hotel: 'Yogya Heritage Inn', action: 'API Key Regenerated', user: 'Tech Team', time: '3 hours ago', status: 'warning', type: 'system' },
  { id: 'ACT-005', hotel: 'Bandung Mountain View', action: 'New User Registration', user: 'System', time: '5 hours ago', status: 'info', type: 'user' },
];

export function RecentActivities() {
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>System Activities</Text>
          <Text size="xs" c="dimmed">Log</Text>
        </div>
        <Button variant="light" color="violet" size="sm">
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
                <Avatar size={36} radius="md" color="indigo" variant="light">
                  {activity.hotel.charAt(0)}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>
                    {activity.hotel}
                  </Text>
                  <Group gap={6}>
                    <Text size="xs" c="dimmed">
                      {activity.action}
                    </Text>
                    <Text size="xs" c="dimmed">•</Text>
                    <Text size="xs" c="dimmed">
                      {activity.user}
                    </Text>
                  </Group>
                </div>
              </Group>

              <Box style={{ textAlign: 'right' }}>
                <Badge
                  size="sm"
                  variant="light"
                  color={
                    activity.type === 'payment' ? 'green' :
                    activity.type === 'upgrade' ? 'violet' :
                    activity.type === 'system' ? 'orange' : 'blue'
                  }
                  mb={4}
                >
                  {activity.type}
                </Badge>
                <Text size="xs" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    <IconClock size={12} />
                    {activity.time}
                </Text>
              </Box>
            </Group>
          </Paper>
        ))}
      </Stack>
    </Card>
  );
}