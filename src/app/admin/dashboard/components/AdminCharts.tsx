'use client';

import { Card, Group, Text, ThemeIcon, Box, Badge, RingProgress, Stack } from '@mantine/core';
import { IconChartBar, IconTrendingUp, IconChartPie } from '@tabler/icons-react';
import { OccupancyItem, RevenueTrendItem } from '../page';

// --- Grafik 1: Bar Chart Style (Revenue Trend - Real Data) ---
interface RevenueTrendProps {
  data: RevenueTrendItem[];
  avgRevenue: number;
}

export function AdminRevenueTrend({ data, avgRevenue }: RevenueTrendProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  const formatRevenue = (value: number) => {
    if (value >= 1_000_000) return `IDR ${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `IDR ${(value / 1_000).toFixed(0)}K`;
    if (value === 0) return 'IDR 0';
    return `IDR ${value.toLocaleString('id-ID')}`;
  };

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder style={{ height: 280 }}>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>Revenue Trend (7 Days)</Text>
          <Text size="xs" c="dimmed">Weekly analysis</Text>
        </div>
        <ThemeIcon size={36} radius="md" variant="light" color="teal">
          <IconChartBar size={18} />
        </ThemeIcon>
      </Group>

      <Box style={{ height: 140 }}>
        <Group gap={6} justify="space-between" align="flex-end" style={{ height: '100%' }}>
          {data.map((d, idx) => {
            const barHeight = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
            return (
              <Box key={idx} style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <Box
                  style={{
                    height: `${Math.max(barHeight * 1.2, 4)}px`,
                    background: idx === data.length - 1 
                      ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
                      : '#e9ecef',
                    borderRadius: '4px',
                    marginBottom: '6px',
                  }}
                />
                <Text size="xs" fw={idx === data.length - 1 ? 700 : 500} c={idx === data.length - 1 ? 'teal' : 'dimmed'}>
                  {d.label}
                </Text>
              </Box>
            );
          })}
        </Group>
      </Box>

      <Group justify="space-between" pt="md" mt="md" style={{ borderTop: '1px solid #e9ecef' }}>
        <Text size="xs" c="dimmed">Avg: {formatRevenue(avgRevenue)}</Text>
        <Badge size="sm" variant="light" color="teal" leftSection={<IconTrendingUp size={12} />}>
          Real-time
        </Badge>
      </Group>
    </Card>
  );
}

// --- Grafik 2: Ring Chart Style (Occupancy - Real Data) ---
interface OccupancyRingProps {
  data: OccupancyItem[];
  totalRooms: number;
}

export function AdminOccupancyRing({ data, totalRooms }: OccupancyRingProps) {
  const occupied = data.find(d => d.label === 'Occupied');
  const occupancyPercentage = totalRooms > 0 && occupied
    ? Math.round((occupied.amount / totalRooms) * 100)
    : 0;

  const hasData = data.length > 0;
  const sections = hasData
    ? data.map(i => ({ value: i.percentage, color: i.color }))
    : [{ value: 100, color: 'gray' }];

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder style={{ height: 280 }}>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>Occupancy Status</Text>
          <Text size="xs" c="dimmed">Current room distribution</Text>
        </div>
        <ThemeIcon size={36} radius="md" variant="light" color="indigo">
          <IconChartPie size={18} />
        </ThemeIcon>
      </Group>

      <Group>
        <RingProgress
          size={120}
          thickness={12}
          roundCaps
          sections={sections}
          label={
            <Text size="xs" ta="center" fw={700}>
              Total<br/>{totalRooms}
            </Text>
          }
        />
        
        <Stack gap={8} style={{ flex: 1 }}>
          {hasData ? (
            data.map((item) => (
              <Group key={item.label} justify="space-between">
                <Group gap={6}>
                  <Box
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: `var(--mantine-color-${item.color}-6)`,
                    }}
                  />
                  <Text size="xs" c="dimmed" fw={500}>{item.label}</Text>
                </Group>
                <Text size="xs" fw={700}>{item.amount}</Text>
              </Group>
            ))
          ) : (
            <Text size="xs" c="dimmed">No room data</Text>
          )}
        </Stack>
      </Group>

      <Group justify="center" pt="md" mt="auto" style={{ borderTop: '1px solid #e9ecef' }}>
        <Text size="xs" c="dimmed">Current Occupancy: <Text span fw={700} c="dark">{occupancyPercentage}%</Text></Text>
      </Group>
    </Card>
  );
}