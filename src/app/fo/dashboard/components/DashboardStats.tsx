'use client';

import { SimpleGrid, Paper, Group, Text, Title, Badge, ThemeIcon, Progress } from '@mantine/core';
import { IconLogin, IconLogout, IconBed, IconSpray, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

interface Props {
  todayCheckIns: number;
  todayCheckOuts: number;
  availableRooms: number;
  dirtyRooms: number;
  totalRooms: number;
}

export function DashboardStats({ todayCheckIns, todayCheckOuts, availableRooms, dirtyRooms, totalRooms }: Props) {
  const availableProgress = totalRooms > 0 ? (availableRooms / totalRooms) * 100 : 0;
  const dirtyProgress = totalRooms > 0 ? (dirtyRooms / totalRooms) * 100 : 0;

  const stats = [
    {
      title: 'Expected Arrival',
      value: todayCheckIns.toString(),
      change: 'Today',
      trend: 'neutral',
      icon: IconLogin,
      color: 'teal',
      progress: Math.min((todayCheckIns / Math.max(totalRooms * 0.3, 1)) * 100, 100),
    },
    {
      title: 'Expected Departure',
      value: todayCheckOuts.toString(),
      change: 'Today',
      trend: 'neutral',
      icon: IconLogout,
      color: 'orange',
      progress: Math.min((todayCheckOuts / Math.max(totalRooms * 0.3, 1)) * 100, 100),
    },
    {
      title: 'Vacant Ready',
      value: availableRooms.toString(),
      change: `of ${totalRooms} rooms`,
      trend: 'neutral',
      icon: IconBed,
      color: 'blue',
      progress: availableProgress,
    },
    {
      title: 'Vacant Dirty',
      value: dirtyRooms.toString(),
      change: dirtyRooms > 0 ? 'Needs cleaning' : 'All clean',
      trend: 'neutral',
      icon: IconSpray,
      color: dirtyRooms > 0 ? 'red' : 'teal',
      progress: dirtyProgress,
    },
  ];

  return (
    <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
      {stats.map((stat) => (
        <Paper key={stat.title} p="md" radius="md" withBorder style={{ borderColor: '#e9ecef' }}>
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.5px' }}>
                {stat.title}
              </Text>
              <Title order={2} style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: 4 }}>
                {stat.value}
              </Title>
              <Badge
                size="sm"
                variant="light"
                color="gray"
                style={{ marginTop: 4 }}
              >
                {stat.change}
              </Badge>
            </div>
            <ThemeIcon size={40} radius="md" variant="light" color={stat.color}>
              <stat.icon size={20} stroke={1.5} />
            </ThemeIcon>
          </Group>
          <Progress value={stat.progress} size="sm" radius="xl" color={stat.color} mt={8} />
        </Paper>
      ))}
    </SimpleGrid>
  );
}