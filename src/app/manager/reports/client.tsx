// src/app/manager/reports/client.tsx
'use client';

import {
  Container, Title, Text, Paper, Stack, Grid, Group,
  ThemeIcon, SimpleGrid, Card, RingProgress, Box, Divider,
  Center
} from '@mantine/core';
import {
  IconReportAnalytics, IconPercentage, IconBed, IconBedOff,
  IconCalendarCheck, IconCalendarEvent, IconCash, IconTools
} from '@tabler/icons-react';
import { ReportStats } from './page';

interface ClientProps {
  stats: ReportStats;
}

export default function ManagerReportsClient({ stats }: ClientProps) {
  const MAX_WIDTH = 1200;

  // Konfigurasi Ring Chart
  const roomStatusData = [
    { value: stats.availableRooms, color: 'teal', tooltip: 'Tersedia' },
    { value: stats.occupiedRooms, color: 'blue', tooltip: 'Terisi' },
    { value: stats.maintenanceRooms, color: 'orange', tooltip: 'Maintenance' },
  ];
  
  // Normalisasi data untuk RingProgress (total harus 100%)
  const ringSections = stats.totalRooms > 0 
    ? roomStatusData.map(item => ({ 
        value: (item.value / stats.totalRooms) * 100, 
        color: item.color, 
        tooltip: `${item.tooltip}: ${item.value}` 
      }))
    : [{ value: 100, color: 'gray', tooltip: 'No Data' }];

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Ramping */}
      <div style={{ 
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
        padding: '0.75rem 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
      }}>
        <Container fluid px="lg">
          <Box maw={MAX_WIDTH} mx="auto">
            <Group gap="xs">
              <ThemeIcon variant="light" color="white" size={34} radius="md" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                <IconReportAnalytics size={18} stroke={1.5} />
              </ThemeIcon>
              <div style={{ lineHeight: 1 }}>
                <Title order={3} c="white" style={{ fontSize: '1rem', fontWeight: 700 }}>Laporan Operasional</Title>
                <Text c="white" opacity={0.9} size="xs" mt={2} style={{ fontSize: '0.75rem' }}>
                  {stats.hotelName} &bull; Ringkasan Performa
                </Text>
              </div>
            </Group>
          </Box>
        </Container>
      </div>

      {/* Konten Utama */}
      <Container fluid px="lg" py="md">
        <Box maw={MAX_WIDTH} mx="auto">
          <Stack gap="lg">
            
            {/* Summary Cards */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
              {/* Okupansi */}
              <Card padding="md" radius="md" shadow="xs" withBorder>
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">Okupansi</Text>
                  <IconPercentage size={18} stroke={1.5} color="var(--mantine-color-blue-6)" />
                </Group>
                <Group align="flex-end" gap="xs">
                  <Text size="xl" fw={700} c="blue">{stats.occupancyRate.toFixed(1)}%</Text>
                  <Text size="xs" c="dimmed" mb={4}>
                    ({stats.occupiedRooms}/{stats.totalRooms} Kamar)
                  </Text>
                </Group>
              </Card>

              {/* Check-in */}
              <Card padding="md" radius="md" shadow="xs" withBorder>
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">Check-in Hari Ini</Text>
                  <IconCalendarCheck size={18} stroke={1.5} color="var(--mantine-color-teal-6)" />
                </Group>
                <Text size="xl" fw={700} c="teal">{stats.todayCheckIns}</Text>
              </Card>

              {/* Check-out */}
              <Card padding="md" radius="md" shadow="xs" withBorder>
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">Check-out Hari Ini</Text>
                  <IconCalendarEvent size={18} stroke={1.5} color="var(--mantine-color-orange-6)" />
                </Group>
                <Text size="xl" fw={700} c="orange">{stats.todayCheckOuts}</Text>
              </Card>

              {/* Revenue */}
              <Card padding="md" radius="md" shadow="xs" withBorder>
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">Pendapatan Hari Ini</Text>
                  <IconCash size={18} stroke={1.5} color="var(--mantine-color-violet-6)" />
                </Group>
                <Text size="xl" fw={700} c="violet">Rp {stats.revenueToday.toLocaleString('id-ID')}</Text>
              </Card>
            </SimpleGrid>

            {/* Detail Status Kamar */}
            <Paper shadow="sm" radius="md" withBorder p="md">
              <Title order={5} mb="md">Distribusi Status Kamar</Title>
              <Grid align="center" gutter="xl">
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <Center>
                    <RingProgress
                      size={160}
                      thickness={16}
                      sections={ringSections}
                      label={
                        <Stack align="center" gap={0}>
                          <Text size="xs" c="dimmed" ta="center">Total</Text>
                          <Text fw={700} size="xl" ta="center">{stats.totalRooms}</Text>
                        </Stack>
                      }
                    />
                  </Center>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, sm: 8 }}>
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                    <Paper withBorder p="xs" radius="sm" bg="teal.0">
                      <Group gap="xs">
                        <ThemeIcon color="teal" variant="light" size="md"><IconBed size={16}/></ThemeIcon>
                        <Box>
                          <Text size="xs" c="dimmed">Tersedia</Text>
                          <Text fw={700} c="teal.9">{stats.availableRooms}</Text>
                        </Box>
                      </Group>
                    </Paper>
                    
                    <Paper withBorder p="xs" radius="sm" bg="blue.0">
                      <Group gap="xs">
                        <ThemeIcon color="blue" variant="light" size="md"><IconBedOff size={16}/></ThemeIcon>
                        <Box>
                          <Text size="xs" c="dimmed">Terisi</Text>
                          <Text fw={700} c="blue.9">{stats.occupiedRooms}</Text>
                        </Box>
                      </Group>
                    </Paper>

                    <Paper withBorder p="xs" radius="sm" bg="orange.0">
                      <Group gap="xs">
                        <ThemeIcon color="orange" variant="light" size="md"><IconTools size={16}/></ThemeIcon>
                        <Box>
                          <Text size="xs" c="dimmed">Maintenance</Text>
                          <Text fw={700} c="orange.9">{stats.maintenanceRooms}</Text>
                        </Box>
                      </Group>
                    </Paper>
                  </SimpleGrid>
                </Grid.Col>
              </Grid>
            </Paper>

          </Stack>
        </Box>
      </Container>
    </div>
  );
}