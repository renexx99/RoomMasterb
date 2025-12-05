'use client';

import { SimpleGrid, Paper, Group, Text, Title, Badge, ThemeIcon, Progress } from '@mantine/core';
import { IconLogin, IconLogout, IconBed, IconSpray, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

interface Props {
  todayCheckIns: number;
  todayCheckOuts: number;
  availableRooms: number;
  dirtyRooms: number;
}

export function DashboardStats({ todayCheckIns, todayCheckOuts, availableRooms, dirtyRooms }: Props) {
  const stats = [
    {
      title: 'Expected Arrival', // Check-in
      value: todayCheckIns.toString(),
      change: '+2', // Mock
      trend: 'up',
      icon: IconLogin,
      color: 'teal',
      progress: 65,
    },
    {
      title: 'Expected Departure', // Check-out
      value: todayCheckOuts.toString(),
      change: 'On Time',
      trend: 'neutral',
      icon: IconLogout,
      color: 'orange',
      progress: 80,
    },
    {
      title: 'Vacant Ready', // Available
      value: availableRooms.toString(),
      change: '-5%',
      trend: 'down',
      icon: IconBed,
      color: 'blue',
      progress: 45,
    },
    {
      title: 'Vacant Dirty', // Dirty
      value: dirtyRooms.toString(),
      change: '+3',
      trend: 'up',
      icon: IconSpray,
      color: 'red',
      progress: 30,
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
                color={stat.trend === 'up' ? 'red' : stat.trend === 'down' ? 'teal' : 'gray'}
                leftSection={stat.trend !== 'neutral' ? (stat.trend === 'up' ? <IconTrendingUp size={12} /> : <IconTrendingDown size={12} />) : null}
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