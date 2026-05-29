'use client';

import { Card, Group, Text, Button, Stack, Paper, Avatar, Badge, Box } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { RecentActivityItem } from '../page';

interface Props {
  data: RecentActivityItem[];
}

export function RecentActivities({ data }: Props) {
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>System Activities</Text>
          <Text size="xs" c="dimmed">Recent operations</Text>
        </div>
        <Button variant="light" color="violet" size="sm">
          View All
        </Button>
      </Group>

      {data.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          No recent activities found
        </Text>
      ) : (
        <Stack gap={6}>
          {data.map((activity) => (
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
      )}
    </Card>
  );
}