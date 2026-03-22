'use client';

import { Card, Group, Text, ThemeIcon, Box, Badge, RingProgress, Stack } from '@mantine/core';
import { IconChartBar, IconTrendingUp, IconChartPie } from '@tabler/icons-react';

// --- Grafik 1: Bar Chart Style (Untuk Tren Pendapatan Admin) ---
const trendData = [
  { label: 'Mon', value: 45 },
  { label: 'Tue', value: 52 },
  { label: 'Wed', value: 38 },
  { label: 'Thu', value: 65 },
  { label: 'Fri', value: 85 },
  { label: 'Sat', value: 90 },
  { label: 'Sun', value: 70 },
];

export function AdminRevenueTrend() {
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
          {trendData.map((d, idx) => (
            <Box key={idx} style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <Box
                style={{
                  height: `${d.value * 1.2}px`,
                  background: idx === trendData.length - 1 
                    ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' // Gradient Teal
                    : '#e9ecef',
                  borderRadius: '4px',
                  marginBottom: '6px',
                }}
              />
              <Text size="xs" fw={idx === trendData.length - 1 ? 700 : 500} c={idx === trendData.length - 1 ? 'teal' : 'dimmed'}>
                {d.label}
              </Text>
            </Box>
          ))}
        </Group>
      </Box>

      <Group justify="space-between" pt="md" mt="md" style={{ borderTop: '1px solid #e9ecef' }}>
        <Text size="xs" c="dimmed">Avg: IDR 4.2M</Text>
        <Badge size="sm" variant="light" color="teal" leftSection={<IconTrendingUp size={12} />}>
          +12.5%
        </Badge>
      </Group>
    </Card>
  );
}

// --- Grafik 2: Ring Chart Style (Untuk Okupansi Admin) ---
const occupancyData = [
  { label: 'Occupied', amount: 15, percentage: 45, color: 'teal' },
  { label: 'Available', amount: 12, percentage: 35, color: 'blue' },
  { label: 'Maintenance', amount: 3, percentage: 20, color: 'orange' },
];

export function AdminOccupancyRing() {
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
          sections={occupancyData.map(i => ({ value: i.percentage, color: i.color }))}
          label={
            <Text size="xs" ta="center" fw={700}>
              Total<br/>30
            </Text>
          }
        />
        
        <Stack gap={8} style={{ flex: 1 }}>
          {occupancyData.map((item) => (
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
          ))}
        </Stack>
      </Group>

      <Group justify="center" pt="md" mt="auto" style={{ borderTop: '1px solid #e9ecef' }}>
        <Text size="xs" c="dimmed">Current Occupancy: <Text span fw={700} c="dark">45%</Text></Text>
      </Group>
    </Card>
  );
}