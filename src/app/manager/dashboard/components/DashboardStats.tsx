'use client';

import { SimpleGrid, Paper, Group, Text, Title, Badge, ThemeIcon, Progress } from '@mantine/core';
import { IconBed, IconCash, IconBrandBooking, IconPercentage, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

interface Props {
  // Kita bisa map data dari server ke sini nanti
  availableRooms: number;
  todayCheckIns: number;
}

export function DashboardStats({ availableRooms, todayCheckIns }: Props) {
  // Data dummy yang diperkaya dengan data real dari props
  const kpiData = [
    {
      title: 'Occupancy Rate',
      value: '78.5%', // Nanti bisa dihitung dari (Total - Available) / Total
      change: '+5.2%',
      trend: 'up',
      icon: IconBed,
      color: 'indigo',
      progress: 78.5,
    },
    {
      title: 'ADR',
      value: 'Rp 850K',
      change: '+12.3%',
      trend: 'up',
      icon: IconCash,
      color: 'teal',
      progress: 68,
    },
    {
      title: 'Realtime Check-in',
      value: todayCheckIns.toString(), // Data Real
      change: 'Today',
      trend: 'neutral',
      icon: IconBrandBooking,
      color: 'violet',
      progress: (todayCheckIns / 50) * 100, // Asumsi target 50
    },
    {
      title: 'Rooms Available',
      value: availableRooms.toString(), // Data Real
      change: '-2.1%',
      trend: 'down',
      icon: IconPercentage,
      color: 'blue',
      progress: 45,
    },
  ];

  return (
    <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
      {kpiData.map((kpi) => (
        <Paper key={kpi.title} p="md" radius="md" withBorder style={{ borderColor: '#e9ecef' }}>
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.5px' }}>
                {kpi.title}
              </Text>
              <Title order={2} style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: 4 }}>
                {kpi.value}
              </Title>
              <Badge
                size="sm"
                variant="light"
                color={kpi.trend === 'up' ? 'teal' : kpi.trend === 'down' ? 'red' : 'gray'}
                leftSection={kpi.trend === 'up' ? <IconTrendingUp size={12} /> : kpi.trend === 'down' ? <IconTrendingDown size={12} /> : null}
                style={{ marginTop: 4 }}
              >
                {kpi.change}
              </Badge>
            </div>
            <ThemeIcon size={40} radius="md" variant="light" color={kpi.color}>
              <kpi.icon size={20} stroke={1.5} />
            </ThemeIcon>
          </Group>
          <Progress value={kpi.progress} size="sm" radius="xl" color={kpi.color} mt={8} />
        </Paper>
      ))}
    </SimpleGrid>
  );
}