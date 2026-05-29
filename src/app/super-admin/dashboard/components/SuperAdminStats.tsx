'use client';

import { SimpleGrid, Paper, Group, Text, Title, Badge, ThemeIcon, Progress } from '@mantine/core';
import { IconBuildingSkyscraper, IconUsers, IconCash, IconCalendarStats, IconTrendingUp } from '@tabler/icons-react';

interface Props {
  totalHotels: number;
  totalUsers: number;
  totalRevenue: number;
  totalReservations: number;
}

export function SuperAdminStats({ totalHotels, totalUsers, totalRevenue, totalReservations }: Props) {
  const formatRevenue = (value: number) => {
    if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}K`;
    if (value === 0) return 'Rp 0';
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  const kpiData = [
    {
      title: 'Properties',
      value: totalHotels.toString(),
      change: 'Active Hotels',
      icon: IconBuildingSkyscraper,
      color: 'violet',
      progress: Math.min((totalHotels / 20) * 100, 100),
    },
    {
      title: 'Users',
      value: totalUsers.toString(),
      change: 'Total Accounts',
      icon: IconUsers,
      color: 'indigo',
      progress: Math.min((totalUsers / 100) * 100, 100),
    },
    {
      title: 'Total Revenue',
      value: formatRevenue(totalRevenue),
      change: 'All-time',
      icon: IconCash,
      color: 'grape',
      progress: Math.min((totalRevenue / 1_000_000_000) * 100, 100),
    },
    {
      title: 'Reservations',
      value: totalReservations.toString(),
      change: 'All-time',
      icon: IconCalendarStats,
      color: 'blue',
      progress: Math.min((totalReservations / 500) * 100, 100),
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