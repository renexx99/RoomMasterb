'use client';

import { SimpleGrid, Paper, Group, Text, Title, Badge, ThemeIcon, Progress } from '@mantine/core';
import { 
  IconBed, 
  IconCalendarCheck, 
  IconClock, 
  IconUsers, 
  IconTrendingUp, 
  IconTrendingDown,
  IconMinus
} from '@tabler/icons-react';

interface StatsProps {
  stats: {
    availableRooms: number;
    todayCheckIns: number;
    activeReservations: number;
    totalGuests: number;
  };
}

export function DashboardStats({ stats }: StatsProps) {
  // Data admin dipetakan ke format visual Manajer
  const statData = [
    {
      title: 'Kamar Tersedia',
      value: stats.availableRooms.toString(),
      change: '-2 Kamar', // Dummy trend
      trend: 'down',
      icon: IconBed,
      color: 'teal',
      progress: 45, // Dummy progress visual
    },
    {
      title: 'Check-in Hari Ini',
      value: stats.todayCheckIns.toString(),
      change: 'On Track',
      trend: 'neutral',
      icon: IconCalendarCheck,
      color: 'blue',
      progress: 75,
    },
    {
      title: 'Tamu In-House',
      value: stats.activeReservations.toString(),
      change: '+12%',
      trend: 'up',
      icon: IconClock,
      color: 'indigo',
      progress: 62,
    },
    {
      title: 'Total Database Tamu',
      value: stats.totalGuests.toString(),
      change: '+5 Baru',
      trend: 'up',
      icon: IconUsers,
      color: 'violet',
      progress: 88,
    },
  ];

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm">
      {statData.map((item) => (
        <Paper key={item.title} p="md" radius="md" withBorder style={{ borderColor: '#e9ecef' }}>
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.5px' }}>
                {item.title}
              </Text>
              <Title order={2} style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: 4 }}>
                {item.value}
              </Title>
              <Badge
                size="sm"
                variant="light"
                color={item.trend === 'up' ? 'teal' : item.trend === 'down' ? 'red' : 'gray'}
                leftSection={
                  item.trend === 'up' ? <IconTrendingUp size={12} /> : 
                  item.trend === 'down' ? <IconTrendingDown size={12} /> : 
                  <IconMinus size={12} />
                }
                style={{ marginTop: 4 }}
              >
                {item.change}
              </Badge>
            </div>
            <ThemeIcon size={40} radius="md" variant="light" color={item.color}>
              <item.icon size={20} stroke={1.5} />
            </ThemeIcon>
          </Group>
          <Progress value={item.progress} size="sm" radius="xl" color={item.color} mt={8} />
        </Paper>
      ))}
    </SimpleGrid>
  );
}