'use client';

import { Card, Group, Text, RingProgress, Stack, Box, Badge, Progress } from '@mantine/core';

interface Props {
  totalHotels: number;
}

export function HotelDistributionChart({ totalHotels }: Props) {
  const distributionData = [
    { category: 'Active', count: Math.floor(totalHotels * 0.82), percentage: 82, color: 'teal' },
    { category: 'Pending', count: Math.floor(totalHotels * 0.12), percentage: 12, color: 'yellow' },
    { category: 'Inactive', count: Math.floor(totalHotels * 0.06), percentage: 6, color: 'red' },
  ];

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder style={{ height: 280 }}>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>Hotel Status</Text>
          <Text size="xs" c="dimmed">Distribution breakdown</Text>
        </div>
        <RingProgress
          size={70}
          thickness={8}
          sections={distributionData.map(item => ({
            value: item.percentage,
            color: item.color,
          }))}
          label={
            <Text size="xs" ta="center" fw={700}>
              {totalHotels}
            </Text>
          }
        />
      </Group>

      <Stack gap={8}>
        {distributionData.map((item) => (
          <Box key={item.category}>
            <Group justify="space-between" mb={4}>
              <Group gap={6}>
                <Box
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: item.color === 'teal' ? '#20c997' : item.color === 'yellow' ? '#fab005' : '#fa5252',
                  }}
                />
                <Text size="sm" fw={500}>
                  {item.category}
                </Text>
              </Group>
              <Text size="sm" fw={700}>
                {item.count} Hotels
              </Text>
            </Group>
            <Progress value={item.percentage} size="sm" radius="xl" color={item.color} />
          </Box>
        ))}
      </Stack>

      <Group justify="space-between" pt="md" mt="md" style={{ borderTop: '1px solid #e9ecef' }}>
        <Text size="xs" c="dimmed">Active Rate</Text>
        <Badge size="sm" variant="light" color="teal">
          {distributionData[0].percentage}%
        </Badge>
      </Group>
    </Card>
  );
}