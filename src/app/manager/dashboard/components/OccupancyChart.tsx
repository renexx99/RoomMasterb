'use client';

import { Card, Group, Text, ThemeIcon, Box, Badge } from '@mantine/core';
import { IconChartBar, IconTrendingUp } from '@tabler/icons-react';

const occupancyTrend = [
  { day: 'Mon', value: 72 },
  { day: 'Tue', value: 68 },
  { day: 'Wed', value: 75 },
  { day: 'Thu', value: 71 },
  { day: 'Fri', value: 82 },
  { day: 'Sat', value: 88 },
  { day: 'Sun', value: 78 },
];

export function OccupancyChart() {
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder style={{ height: 280 }}>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>7-Day Occupancy</Text>
          <Text size="xs" c="dimmed">Weekly trend analysis</Text>
        </div>
        <ThemeIcon size={36} radius="md" variant="light" color="indigo">
          <IconChartBar size={18} />
        </ThemeIcon>
      </Group>

      <Box style={{ height: 140 }}>
        <Group gap={6} justify="space-between" align="flex-end" style={{ height: '100%' }}>
          {occupancyTrend.map((day, idx) => (
            <Box key={idx} style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <Box
                style={{
                  height: `${day.value * 1.2}px`,
                  background: idx === occupancyTrend.length - 1 
                    ? 'linear-gradient(180deg, #4c6ef5 0%, #364fc7 100%)'
                    : '#e9ecef',
                  borderRadius: '4px',
                  marginBottom: '6px',
                }}
              />
              <Text size="xs" fw={idx === occupancyTrend.length - 1 ? 700 : 500} c={idx === occupancyTrend.length - 1 ? 'indigo' : 'dimmed'}>
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
        <Text size="xs" c="dimmed">Average: 76.3%</Text>
        <Badge size="sm" variant="light" color="teal" leftSection={<IconTrendingUp size={12} />}>
          +8.2%
        </Badge>
      </Group>
    </Card>
  );
}