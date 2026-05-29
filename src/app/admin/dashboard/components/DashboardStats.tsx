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
    totalRooms: number;
  };
}

export function DashboardStats({ stats }: StatsProps) {
  const availableProgress = stats.totalRooms > 0 ? (stats.availableRooms / stats.totalRooms) * 100 : 0;
  const occupancyProgress = stats.totalRooms > 0 ? ((stats.totalRooms - stats.availableRooms) / stats.totalRooms) * 100 : 0;

  const statData = [
    {
      title: 'Available Rooms',
      value: stats.availableRooms.toString(),
      change: `of ${stats.totalRooms} total`,
      trend: 'neutral',
      icon: IconBed,
      color: 'teal',
      progress: availableProgress,
    },
    {
      title: "Today's Arrivals",
      value: stats.todayCheckIns.toString(),
      change: 'Today',
      trend: 'neutral',
      icon: IconCalendarCheck,
      color: 'blue',
      progress: Math.min((stats.todayCheckIns / Math.max(stats.totalRooms * 0.3, 1)) * 100, 100),
    },
    {
      title: 'In-House Guests',
      value: stats.activeReservations.toString(),
      change: `${Math.round(occupancyProgress)}% occupancy`,
      trend: 'neutral',
      icon: IconClock,
      color: 'indigo',
      progress: occupancyProgress,
    },
    {
      title: 'Total Guest Database',
      value: stats.totalGuests.toString(),
      change: 'All-time',
      trend: 'neutral',
      icon: IconUsers,
      color: 'violet',
      progress: Math.min((stats.totalGuests / 100) * 100, 100), // relative to 100 guests
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
                color="gray"
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