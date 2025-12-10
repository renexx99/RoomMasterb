'use client';

import { Card, Group, Text, Button, Stack, Paper, Avatar, Badge, Box } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';

// Data Mock Baru
const recentActivities = [
  { id: 'SYS-001', hotel: 'Grand Hotel Surabaya', action: 'Upgrade to Enterprise', user: 'System', time: '2 mins ago', status: 'success', type: 'upgrade' },
  { id: 'USR-002', hotel: 'Bali Beach Resort', action: 'New Manager Added', user: 'Admin', time: '15 mins ago', status: 'info', type: 'user' },
  { id: 'PAY-003', hotel: 'Jakarta Plaza Hotel', action: 'Monthly Subscription Paid', user: 'System', time: '1 hour ago', status: 'success', type: 'payment' },
  { id: 'SYS-004', hotel: 'Yogya Heritage Inn', action: 'API Key Regenerated', user: 'Tech Team', time: '3 hours ago', status: 'warning', type: 'system' },
];

export function RecentActivities() {
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>Aktivitas Sistem Terbaru</Text>
          <Text size="xs" c="dimmed">Log aktivitas lintas properti</Text>
        </div>
        <Button variant="subtle" color="violet" size="sm">
          Lihat Semua
        </Button>
      </Group>

      <Stack gap={8}>
        {recentActivities.map((activity) => (
          <Paper
            key={activity.id}
            p="xs"
            radius="md"
            style={{ 
                background: 'white', 
                border: '1px solid #f1f3f5',
                transition: 'all 0.2s'
            }}
            className="hover:bg-gray-50"
          >
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                {/* Avatar dengan warna Indigo */}
                <Avatar size={36} radius="md" color="indigo" variant="light">
                  {activity.hotel.charAt(0)}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>
                    {activity.hotel}
                  </Text>
                  <Group gap={6}>
                    <Text size="xs" c="violet.7" fw={500}>
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
                  size="xs"
                  variant="light"
                  color={
                    activity.type === 'payment' ? 'green' :
                    activity.type === 'upgrade' ? 'violet' :
                    activity.type === 'system' ? 'orange' : 'blue'
                  }
                  mb={4}
                >
                  {activity.type.toUpperCase()}
                </Badge>
                <Text size="xs" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    <IconClock size={10} />
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