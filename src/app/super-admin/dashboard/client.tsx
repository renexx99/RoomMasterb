'use client';

import { Container, Grid, Paper, Text, Group, Title, ThemeIcon, SimpleGrid, RingProgress, Center } from '@mantine/core';
import { IconBuildingSkyscraper, IconUsers, IconActivity, IconServer, IconArrowUpRight } from '@tabler/icons-react';

interface DashboardProps {
  stats: {
    totalHotels: number;
    totalUsers: number;
    activeSessions: number;
    systemHealth: string;
  };
}

export default function SuperAdminDashboardClient({ stats }: DashboardProps) {
  const cards = [
    { title: 'Total Properti', value: stats.totalHotels, icon: IconBuildingSkyscraper, color: 'indigo', diff: 12 },
    { title: 'Total Pengguna', value: stats.totalUsers, icon: IconUsers, color: 'blue', diff: 5 },
    { title: 'Sesi Aktif', value: stats.activeSessions, icon: IconActivity, color: 'teal', diff: -2 },
    { title: 'Kesehatan Sistem', value: stats.systemHealth, icon: IconServer, color: 'green', diff: 0 },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Ramping */}
      <div style={{ 
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 
          padding: '0.75rem 0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <Container size="lg">
           <Group gap="xs">
                <ThemeIcon variant="light" color="white" size="lg" radius="md" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                    <IconBuildingSkyscraper size={20} stroke={1.5} />
                </ThemeIcon>
                <div style={{ lineHeight: 1 }}>
                    <Title order={4} c="white" style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.2 }}>
                        Dashboard Overview
                    </Title>
                    <Text c="white" opacity={0.8} size="xs" mt={2}>
                        Ringkasan aktivitas seluruh sistem RoomMaster
                    </Text>
                </div>
            </Group>
        </Container>
      </div>

      {/* Content */}
      <Container size="lg" py="md">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          {cards.map((stat) => (
            <Paper key={stat.title} p="md" radius="md" shadow="xs" withBorder>
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                    {stat.title}
                  </Text>
                  <Text fw={700} size="xl">
                    {stat.value}
                  </Text>
                </div>
                <ThemeIcon
                  color={stat.color}
                  variant="light"
                  size={38}
                  radius="md"
                >
                  <stat.icon size="1.1rem" stroke={1.5} />
                </ThemeIcon>
              </Group>
              <Text c="dimmed" size="xs" mt="sm">
                <Text component="span" c={stat.diff > 0 ? 'teal' : stat.diff < 0 ? 'red' : 'gray'} fw={500}>
                  {stat.diff > 0 ? '+' : ''}{stat.diff}%
                </Text>{' '}
                dari bulan lalu
              </Text>
            </Paper>
          ))}
        </SimpleGrid>

        <Grid mt="md">
            <Grid.Col span={{ base: 12, md: 8 }}>
                <Paper shadow="xs" radius="md" p="md" withBorder h="100%">
                    <Title order={5} mb="md">Aktivitas Sistem (Dummy Chart)</Title>
                    <div style={{ height: 200, background: '#f1f3f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text c="dimmed" size="sm">Area Grafik Analitik</Text>
                    </div>
                </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper shadow="xs" radius="md" p="md" withBorder h="100%">
                     <Title order={5} mb="md">Distribusi Server</Title>
                     <Center>
                        <RingProgress
                            size={180}
                            thickness={16}
                            roundCaps
                            sections={[
                                { value: 40, color: 'cyan', tooltip: 'Web Server' },
                                { value: 25, color: 'orange', tooltip: 'Database' },
                                { value: 15, color: 'grape', tooltip: 'Storage' },
                            ]}
                            label={
                                <Center>
                                    <IconServer size={24} style={{ opacity: 0.5 }} />
                                </Center>
                            }
                        />
                     </Center>
                </Paper>
            </Grid.Col>
        </Grid>
      </Container>
    </div>
  );
}