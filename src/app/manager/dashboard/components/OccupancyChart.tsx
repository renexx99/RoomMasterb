'use client';

import { Card, Group, Text, ThemeIcon, Box, Badge } from '@mantine/core';
import { IconChartBar, IconTrendingUp } from '@tabler/icons-react';
import { OccupancyTrendItem } from '../page';

interface Props {
  data: OccupancyTrendItem[];
}

export function OccupancyChart({ data }: Props) {
  const maxValue = Math.max(...data.map(d => d.value), 1); // avoid 0
  const avgOccupancy = data.length > 0
    ? (data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(1)
    : '0';

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
          {data.map((day, idx) => {
            const barHeight = maxValue > 0 ? (day.value / maxValue) * 100 : 0;
            const isLast = idx === data.length - 1;
            return (
              <Box key={idx} style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <Box
                  style={{
                    height: `${Math.max(barHeight * 1.2, 4)}px`,
                    background: isLast
                      ? 'linear-gradient(180deg, #4c6ef5 0%, #364fc7 100%)'
                      : '#e9ecef',
                    borderRadius: '4px',
                    marginBottom: '6px',
                  }}
                />
                <Text size="xs" fw={isLast ? 700 : 500} c={isLast ? 'indigo' : 'dimmed'}>
                  {day.day}
                </Text>
                <Text size="xs" c="dimmed">
                  {day.value}%
                </Text>
              </Box>
            );
          })}
        </Group>
      </Box>

      <Group justify="space-between" pt="md" mt="md" style={{ borderTop: '1px solid #e9ecef' }}>
        <Text size="xs" c="dimmed">Average: {avgOccupancy}%</Text>
        <Badge size="sm" variant="light" color="teal" leftSection={<IconTrendingUp size={12} />}>
          Real-time
        </Badge>
      </Group>
    </Card>
  );
}