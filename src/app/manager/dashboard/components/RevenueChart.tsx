'use client';

import { Card, Group, Text, RingProgress, Stack, Box, Badge } from '@mantine/core';

const revenueBreakdown = [
  { category: 'Room', amount: 12.5, percentage: 67, color: 'indigo' },
  { category: 'F&B', amount: 4.2, percentage: 23, color: 'teal' },
  { category: 'Services', amount: 1.8, percentage: 10, color: 'violet' },
];

export function RevenueChart() {
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder style={{ height: 280 }}>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>Revenue Split</Text>
          <Text size="xs" c="dimmed">Today's breakdown</Text>
        </div>
        <RingProgress
          size={70}
          thickness={8}
          sections={revenueBreakdown.map(item => ({
            value: item.percentage,
            color: item.color,
          }))}
          label={
            <Text size="xs" ta="center" fw={700}>
              18.5M
            </Text>
          }
        />
      </Group>

      <Stack gap={8}>
        {revenueBreakdown.map((item) => (
          <Box key={item.category}>
            <Group justify="space-between" mb={4}>
              <Group gap={6}>
                <Box
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: item.color === 'indigo' ? '#4c6ef5' : item.color === 'teal' ? '#20c997' : '#7950f2',
                  }}
                />
                <Text size="sm" fw={500}>
                  {item.category}
                </Text>
              </Group>
              <Text size="sm" fw={700}>
                Rp {item.amount}M
              </Text>
            </Group>
            <Progress value={item.percentage} size="sm" radius="xl" color={item.color} />
          </Box>
        ))}
      </Stack>

      <Group justify="space-between" pt="md" mt="md" style={{ borderTop: '1px solid #e9ecef' }}>
        <Text size="xs" c="dimmed">Total Revenue</Text>
        <Badge size="sm" variant="light" color="indigo">
          +12.5%
        </Badge>
      </Group>
    </Card>
  );
}

// Helper component for Progress bar inside this file
import { Progress } from '@mantine/core';