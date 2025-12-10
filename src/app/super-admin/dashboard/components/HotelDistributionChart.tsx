'use client';

import { Card, Group, Text, RingProgress, Stack, Box, Badge, Progress } from '@mantine/core';

interface Props {
  totalHotels: number;
}

export function HotelDistributionChart({ totalHotels }: Props) {
  // Simulasi data distribusi paket langganan
  const distributionData = [
    { category: 'Enterprise', count: Math.floor(totalHotels * 0.25), percentage: 25, color: 'violet' },
    { category: 'Pro Plan', count: Math.floor(totalHotels * 0.45), percentage: 45, color: 'indigo' },
    { category: 'Basic', count: Math.floor(totalHotels * 0.20), percentage: 20, color: 'blue' },
    { category: 'Trial', count: Math.floor(totalHotels * 0.10), percentage: 10, color: 'gray' },
  ];

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder style={{ height: 320 }}>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>Paket Langganan</Text>
          <Text size="xs" c="dimmed">Distribusi tipe akun hotel</Text>
        </div>
        <RingProgress
          size={80}
          thickness={8}
          roundCaps
          sections={distributionData.map(item => ({
            value: item.percentage,
            color: item.color,
            tooltip: `${item.category}: ${item.count}`
          }))}
          label={
            <Text size="xs" ta="center" fw={700} c="dimmed">
              Total<br/>{totalHotels}
            </Text>
          }
        />
      </Group>

      <Stack gap={10}>
        {distributionData.map((item) => (
          <Box key={item.category}>
            <Group justify="space-between" mb={4}>
              <Group gap={6}>
                <Box
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: `var(--mantine-color-${item.color}-6)`,
                  }}
                />
                <Text size="sm" fw={500} c="dark.6">
                  {item.category}
                </Text>
              </Group>
              <Text size="sm" fw={700} c="dimmed">
                {item.count}
              </Text>
            </Group>
            <Progress 
                value={item.percentage} 
                size="sm" 
                radius="xl" 
                color={item.color} 
                style={{ opacity: 0.8 }}
            />
          </Box>
        ))}
      </Stack>

      <Group justify="center" pt="md" mt="auto" style={{ borderTop: '1px solid #e9ecef' }}>
        <Text size="xs" c="indigo" fw={600} style={{ cursor: 'pointer' }}>
            Lihat Laporan Langganan →
        </Text>
      </Group>
    </Card>
  );
}