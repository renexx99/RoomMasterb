'use client';

import { SimpleGrid, Paper, Group, Text, Title, Badge, ThemeIcon, Progress } from '@mantine/core';
import { IconBuildingSkyscraper, IconUsers, IconCash, IconTrendingUp, IconChartBar } from '@tabler/icons-react';

interface Props {
  totalHotels: number;
  totalUsers: number;
  totalRevenue: string;
  growthRate: string;
}

export function SuperAdminStats({ totalHotels, totalUsers, totalRevenue, growthRate }: Props) {
  const kpiData = [
    {
      title: 'Total Properti',
      value: totalHotels.toString(),
      change: '+3.2%',
      trend: 'up',
      icon: IconBuildingSkyscraper,
      color: 'violet', // Tema Ungu
      progress: 85,
    },
    {
      title: 'Total Pengguna',
      value: totalUsers.toString(),
      change: '+12%',
      trend: 'up',
      icon: IconUsers,
      color: 'indigo', // Tema Indigo
      progress: 72,
    },
    {
      title: 'Total Pendapatan',
      value: totalRevenue,
      change: '+24%',
      trend: 'up',
      icon: IconCash,
      color: 'grape', // Tema Anggur/Ungu Tua
      progress: 92,
    },
    {
      title: 'Pertumbuhan Bisnis',
      value: growthRate,
      change: 'MoM',
      trend: 'up',
      icon: IconChartBar,
      color: 'blue', // Aksen Biru
      progress: 68,
    },
  ];

  return (
    <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
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
                color={kpi.color}
                leftSection={<IconTrendingUp size={12} />}
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