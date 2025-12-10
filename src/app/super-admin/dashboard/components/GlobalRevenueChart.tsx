'use client';

import { Card, Group, Text, ThemeIcon, Box, Badge } from '@mantine/core';
import { IconCash, IconTrendingUp } from '@tabler/icons-react';

const revenueData = [
  { month: 'Mei', value: 450 },
  { month: 'Jun', value: 520 },
  { month: 'Jul', value: 480 },
  { month: 'Agu', value: 610 },
  { month: 'Sep', value: 750 },
  { month: 'Okt', value: 820 },
  { month: 'Nov', value: 940 },
];

export function GlobalRevenueChart() {
  const maxValue = Math.max(...revenueData.map(d => d.value));

  return (
    // Height disesuaikan menjadi 280 agar sama dengan dashboard manager
    <Card shadow="sm" padding="md" radius="md" withBorder style={{ height: 280 }}>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>Global Revenue</Text>
          <Text size="xs" c="dimmed">Last Trends</Text>
        </div>
        <ThemeIcon size={36} radius="md" variant="light" color="violet">
          <IconCash size={18} />
        </ThemeIcon>
      </Group>

      <Box style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
        <Group gap={8} justify="space-between" align="flex-end" style={{ width: '100%', height: '100%' }}>
          {revenueData.map((data, idx) => {
            const heightPercentage = (data.value / maxValue) * 100;
            const isLast = idx === revenueData.length - 1;
            
            return (
              <Box key={idx} style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                <Box
                  style={{
                    height: `${heightPercentage}%`,
                    width: '100%',
                    background: isLast 
                      ? 'linear-gradient(180deg, #8b5cf6 0%, #6366f1 100%)' // Gradient Ungu
                      : '#f1f3f5',
                    borderRadius: '4px 4px 0 0',
                    marginBottom: '6px',
                    transition: 'all 0.3s ease',
                  }}
                />
                <Text size="xs" fw={isLast ? 700 : 500} c={isLast ? 'indigo' : 'dimmed'}>
                  {data.month}
                </Text>
              </Box>
            );
          })}
        </Group>
      </Box>

      <Group justify="space-between" pt="sm" mt="xs" style={{ borderTop: '1px solid #e9ecef' }}>
        <Text size="xs" c="dimmed">This month: <Text span fw={700} c="dark">IDR 940.000.000</Text></Text>
        <Badge size="sm" variant="light" color="violet" leftSection={<IconTrendingUp size={12} />}>
          +14.6%
        </Badge>
      </Group>
    </Card>
  );
}