'use client';

import { Card, Group, Text, ThemeIcon, Box, Badge } from '@mantine/core';
import { IconServer, IconTrendingUp } from '@tabler/icons-react';

const healthMetrics = [
  { day: 'Mon', value: 98 },
  { day: 'Tue', value: 95 },
  { day: 'Wed', value: 99 },
  { day: 'Thu', value: 97 },
  { day: 'Fri', value: 98 },
  { day: 'Sat', value: 96 },
  { day: 'Sun', value: 98 },
];

export function SystemHealthChart() {
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder style={{ height: 280 }}>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>System Uptime</Text>
          <Text size="xs" c="dimmed">7-day health metrics</Text>
        </div>
        <ThemeIcon size={36} radius="md" variant="light" color="green">
          <IconServer size={18} />
        </ThemeIcon>
      </Group>

      <Box style={{ height: 140 }}>
        <Group gap={6} justify="space-between" align="flex-end" style={{ height: '100%' }}>
          {healthMetrics.map((day, idx) => (
            <Box key={idx} style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <Box
                style={{
                  height: `${day.value * 1.2}px`,
                  background: idx === healthMetrics.length - 1 
                    ? 'linear-gradient(180deg, #20c997 0%, #12b886 100%)'
                    : '#e9ecef',
                  borderRadius: '4px',
                  marginBottom: '6px',
                }}
              />
              <Text size="xs" fw={idx === healthMetrics.length - 1 ? 700 : 500} c={idx === healthMetrics.length - 1 ? 'teal' : 'dimmed'}>
                {day.day}
              </Text>
              <Text size="xs" c="dimmed">
                {day.value}%
              </Text>
            </Box>
          ))}
        </Group>
      </Box>

      <Group justify="space-between" pt="md" mt="md" style={{ borderTop: '1px solid #e9ecef' }}>
        <Text size="xs" c="dimmed">Average: 97.3%</Text>
        <Badge size="sm" variant="light" color="teal" leftSection={<IconTrendingUp size={12} />}>
          Excellent
        </Badge>
      </Group>
    </Card>
  );
}