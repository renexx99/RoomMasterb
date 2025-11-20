'use client';

import { SimpleGrid, Card, Group, Text, ThemeIcon } from '@mantine/core';
import { IconBed, IconCalendarCheck, IconClock, IconUsers } from '@tabler/icons-react';

interface StatsProps {
  stats: {
    availableRooms: number;
    todayCheckIns: number;
    activeReservations: number;
    totalGuests: number;
  };
}

export function DashboardStats({ stats }: StatsProps) {
  const dashboardItems = [
    {
      title: 'Kamar Tersedia',
      value: stats.availableRooms.toString(),
      icon: <IconBed size={24} />,
      color: 'green',
    },
    {
      title: 'Check-in Hari Ini',
      value: stats.todayCheckIns.toString(),
      icon: <IconCalendarCheck size={24} />,
      color: 'blue',
    },
    {
      title: 'Tamu In-House',
      value: stats.activeReservations.toString(),
      icon: <IconClock size={24} />,
      color: 'orange',
    },
    {
      title: 'Total Tamu',
      value: stats.totalGuests.toString(),
      icon: <IconUsers size={24} />,
      color: 'violet',
    },
  ];

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
      {dashboardItems.map((item) => (
        <Card key={item.title} shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" align="flex-start">
            <div>
              <Text c="dimmed" size="sm" fw={500}>
                {item.title}
              </Text>
              <Text size="xl" fw={700} c={item.color}>
                {item.value}
              </Text>
            </div>
            <ThemeIcon color={item.color} variant="light" size={48} radius="md">
              {item.icon}
            </ThemeIcon>
          </Group>
        </Card>
      ))}
    </SimpleGrid>
  );
}