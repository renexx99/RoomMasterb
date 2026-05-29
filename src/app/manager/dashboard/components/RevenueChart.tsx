'use client';

import { Card, Group, Text, RingProgress, Stack, Box, Badge, Progress } from '@mantine/core';
import { RevenueCategoryItem } from '../page';

interface Props {
  data: RevenueCategoryItem[];
  totalRevenue: number;
}

const COLOR_MAP: Record<string, string> = {
  indigo: '#4c6ef5',
  teal: '#20c997',
  violet: '#7950f2',
  blue: '#339af0',
  orange: '#ff922b',
  pink: '#e64980',
};

export function RevenueChart({ data, totalRevenue }: Props) {
  // Format revenue ke string readable
  const formatRevenue = (value: number) => {
    if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}K`;
    if (value === 0) return 'Rp 0';
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  const formatCategoryRevenue = (value: number) => {
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}K`;
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  // If no data, show empty state
  const hasData = data.length > 0 && totalRevenue > 0;

  const ringSections = hasData
    ? data.map(item => ({
        value: item.percentage,
        color: item.color,
      }))
    : [{ value: 100, color: 'gray' }];

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder style={{ height: 280 }}>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>Revenue Split</Text>
          <Text size="xs" c="dimmed">Current in-house breakdown</Text>
        </div>
        <RingProgress
          size={70}
          thickness={8}
          sections={ringSections}
          label={
            <Text size="xs" ta="center" fw={700}>
              {formatRevenue(totalRevenue)}
            </Text>
          }
        />
      </Group>

      <Stack gap={8}>
        {hasData ? (
          data.map((item) => (
            <Box key={item.category}>
              <Group justify="space-between" mb={4}>
                <Group gap={6}>
                  <Box
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: COLOR_MAP[item.color] || `var(--mantine-color-${item.color}-6)`,
                    }}
                  />
                  <Text size="sm" fw={500}>
                    {item.category}
                  </Text>
                </Group>
                <Text size="sm" fw={700}>
                  {formatCategoryRevenue(item.amount)}
                </Text>
              </Group>
              <Progress value={item.percentage} size="sm" radius="xl" color={item.color} />
            </Box>
          ))
        ) : (
          <Text size="sm" c="dimmed" ta="center" py="md">
            No in-house revenue data available
          </Text>
        )}
      </Stack>

      <Group justify="space-between" pt="md" mt="md" style={{ borderTop: '1px solid #e9ecef' }}>
        <Text size="xs" c="dimmed">Total Revenue</Text>
        <Badge size="sm" variant="light" color="indigo">
          Real-time
        </Badge>
      </Group>
    </Card>
  );
}