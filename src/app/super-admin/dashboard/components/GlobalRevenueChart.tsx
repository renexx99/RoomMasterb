'use client';

import { Card, Group, Text, ThemeIcon, Box, Badge } from '@mantine/core';
import { IconCash, IconTrendingUp } from '@tabler/icons-react';
import { MonthlyRevenueItem } from '../page';

interface Props {
  data: MonthlyRevenueItem[];
}

export function GlobalRevenueChart({ data }: Props) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const latestMonth = data.length > 0 ? data[data.length - 1] : null;

  const formatRevenue = (value: number) => {
    if (value >= 1_000_000_000) return `IDR ${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `IDR ${(value / 1_000_000).toFixed(0)}M`;
    if (value >= 1_000) return `IDR ${(value / 1_000).toFixed(0)}K`;
    if (value === 0) return 'IDR 0';
    return `IDR ${value.toLocaleString('id-ID')}`;
  };

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder style={{ height: 280 }}>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>Global Revenue</Text>
          <Text size="xs" c="dimmed">Monthly Trends</Text>
        </div>
        <ThemeIcon size={36} radius="md" variant="light" color="violet">
          <IconCash size={18} />
        </ThemeIcon>
      </Group>

      <Box style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
        <Group gap={8} justify="space-between" align="flex-end" style={{ width: '100%', height: '100%' }}>
          {data.map((d, idx) => {
            const heightPercentage = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
            const isLast = idx === data.length - 1;
            
            return (
              <Box key={idx} style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                <Box
                  style={{
                    height: `${Math.max(heightPercentage, 3)}%`,
                    width: '100%',
                    background: isLast 
                      ? 'linear-gradient(180deg, #8b5cf6 0%, #6366f1 100%)'
                      : '#f1f3f5',
                    borderRadius: '4px 4px 0 0',
                    marginBottom: '6px',
                    transition: 'all 0.3s ease',
                  }}
                />
                <Text size="xs" fw={isLast ? 700 : 500} c={isLast ? 'indigo' : 'dimmed'}>
                  {d.month}
                </Text>
              </Box>
            );
          })}
        </Group>
      </Box>

      <Group justify="space-between" pt="sm" mt="xs" style={{ borderTop: '1px solid #e9ecef' }}>
        <Text size="xs" c="dimmed">
          This month: <Text span fw={700} c="dark">
            {latestMonth ? formatRevenue(latestMonth.value) : 'N/A'}
          </Text>
        </Text>
        <Badge size="sm" variant="light" color="violet" leftSection={<IconTrendingUp size={12} />}>
          Real-time
        </Badge>
      </Group>
    </Card>
  );
}