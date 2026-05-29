'use client';

import { SimpleGrid, Paper, Group, Text, Title, Badge, ThemeIcon, Progress } from '@mantine/core';
import { IconBed, IconCash, IconBrandBooking, IconPercentage, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

interface Props {
  occupancyRate: number;
  adr: number;
  todayCheckIns: number;
  availableRooms: number;
  totalRooms: number;
  occupiedRooms: number;
}

export function DashboardStats({ occupancyRate, adr, todayCheckIns, availableRooms, totalRooms, occupiedRooms }: Props) {
  // Format ADR ke format Rupiah yang readable
  const formatAdr = (value: number) => {
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}K`;
    if (value === 0) return 'N/A';
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  const occupancyProgress = Math.min(occupancyRate, 100);
  const availableProgress = totalRooms > 0 ? (availableRooms / totalRooms) * 100 : 0;

  const kpiData = [
    {
      title: 'Occupancy Rate',
      value: `${occupancyRate}%`,
      change: `${occupiedRooms}/${totalRooms} rooms`,
      trend: 'neutral' as const,
      icon: IconBed,
      color: 'indigo',
      progress: occupancyProgress,
    },
    {
      title: 'ADR',
      value: formatAdr(adr),
      change: 'Avg. Daily Rate',
      trend: 'neutral' as const,
      icon: IconCash,
      color: 'teal',
      progress: Math.min((adr / 1_000_000) * 100, 100), // relative to 1M
    },
    {
      title: 'Realtime Check-in',
      value: todayCheckIns.toString(),
      change: 'Today',
      trend: 'neutral' as const,
      icon: IconBrandBooking,
      color: 'violet',
      progress: Math.min((todayCheckIns / Math.max(totalRooms * 0.3, 1)) * 100, 100),
    },
    {
      title: 'Rooms Available',
      value: availableRooms.toString(),
      change: `of ${totalRooms} total`,
      trend: 'neutral' as const,
      icon: IconPercentage,
      color: 'blue',
      progress: availableProgress,
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
                color="gray"
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