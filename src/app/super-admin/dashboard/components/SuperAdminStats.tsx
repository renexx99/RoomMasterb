'use client';

import { SimpleGrid, Paper, Group, Text, Title, Badge, ThemeIcon, Progress } from '@mantine/core';
import { IconBuildingSkyscraper, IconUsers, IconActivity, IconServer, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

interface Props {
  totalHotels: number;
  totalUsers: number;
  activeSessions: number;
  systemHealth: string;
}

export function SuperAdminStats({ totalHotels, totalUsers, activeSessions, systemHealth }: Props) {
  const kpiData = [
    {
      title: 'Total Properti',
      value: totalHotels.toString(),
      change: '+12.0%',
      trend: 'up',
      icon: IconBuildingSkyscraper,
      color: 'indigo',
      progress: 85,
    },
    {
      title: 'Total Pengguna',
      value: totalUsers.toString(),
      change: '+5.3%',
      trend: 'up',
      icon: IconUsers,
      color: 'teal',
      progress: 72,
    },
    {
      title: 'Sesi Aktif',
      value: activeSessions.toString(),
      change: '-2.1%',
      trend: 'down',
      icon: IconActivity,
      color: 'violet',
      progress: 58,
    },
    {
      title: 'Kesehatan Sistem',
      value: systemHealth,
      change: 'Optimal',
      trend: 'neutral',
      icon: IconServer,
      color: 'green',
      progress: 98,
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