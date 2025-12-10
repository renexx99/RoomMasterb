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
    <Card shadow="sm" padding="md" radius="md" withBorder style={{ height: 320 }}>
      <Group justify="space-between" mb="lg">
        <div>
          <Text size="sm" fw={700}>Pendapatan Global (Juta IDR)</Text>
          <Text size="xs" c="dimmed">Pertumbuhan 6 bulan terakhir</Text>
        </div>
        <ThemeIcon size={36} radius="md" variant="light" color="violet">
          <IconCash size={18} />
        </ThemeIcon>
      </Group>

      <Box style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
        <Group gap={12} justify="space-between" align="flex-end" style={{ width: '100%', height: '100%' }}>
          {revenueData.map((data, idx) => {
            const heightPercentage = (data.value / maxValue) * 100;
            const isLast = idx === revenueData.length - 1;
            
            return (
              <Box key={idx} style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                {/* Bar */}
                <Box
                  style={{
                    height: `${heightPercentage}%`,
                    width: '100%',
                    background: isLast 
                      ? 'linear-gradient(180deg, #8b5cf6 0%, #6366f1 100%)' // Gradient Ungu ke Biru
                      : '#f1f3f5', // Abu-abu lembut
                    borderRadius: '6px 6px 0 0',
                    marginBottom: '8px',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                  }}
                >
                    {/* Tooltip on Hover (Simple CSS logic) */}
                    {isLast && (
                        <Box style={{
                            position: 'absolute', top: -25, left: '50%', transform: 'translateX(-50%)',
                            fontSize: 10, fontWeight: 700, color: '#6366f1'
                        }}>
                            Rp {data.value}
                        </Box>
                    )}
                </Box>
                
                {/* Label */}
                <Text size="xs" fw={isLast ? 700 : 500} c={isLast ? 'indigo' : 'dimmed'}>
                  {data.month}
                </Text>
              </Box>
            );
          })}
        </Group>
      </Box>

      <Group justify="space-between" pt="md" style={{ borderTop: '1px solid #e9ecef' }}>
        <Text size="xs" c="dimmed">Total Bulan Ini: <Text span fw={700} c="dark">Rp 940 Juta</Text></Text>
        <Badge size="sm" variant="gradient" gradient={{ from: 'indigo', to: 'violet' }} leftSection={<IconTrendingUp size={12} />}>
          +14.6% Growth
        </Badge>
      </Group>
    </Card>
  );
}