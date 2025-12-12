'use client';

import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  ThemeIcon,
  SimpleGrid,
  Card,
  RingProgress,
  Box,
  Button,
  Grid,
  Badge,
  Progress,
  ActionIcon
} from '@mantine/core';
import {
  IconReportAnalytics,
  IconBed,
  IconCalendarEvent,
  IconCash,
  IconDownload,
  IconPrinter,
  IconHotelService,
  IconLogin,
  IconLogout,
  IconTools
} from '@tabler/icons-react';
import { ReportStats } from './page';

interface ClientProps {
  stats: ReportStats;
}

export default function ManagerReportsClient({ stats }: ClientProps) {
  const MAX_WIDTH = 1200;

  // --- Derived Data for Charts ---
  const roomStatusData = [
    { value: stats.availableRooms, color: 'teal', label: 'Available' },
    { value: stats.occupiedRooms, color: 'blue', label: 'Occupied' },
    { value: stats.maintenanceRooms, color: 'orange', label: 'Maintenance' },
  ];
  
  // Normalize for RingProgress (total 100%)
  const ringSections = stats.totalRooms > 0 
    ? roomStatusData.map(item => ({ 
        value: (item.value / stats.totalRooms) * 100, 
        color: item.color, 
        tooltip: `${item.label}: ${item.value}` 
      }))
    : [{ value: 100, color: 'gray', tooltip: 'No Data' }];

  return (
    <Box style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '2rem' }}>
      
      {/* 1. CLEAN TOOLBAR */}
      <Box style={{ background: 'white', borderBottom: '1px solid #e9ecef', padding: '1rem 0' }}>
        <Container fluid px="lg">
          <Box maw={MAX_WIDTH} mx="auto">
            <Group justify="space-between" align="center">
              <Group gap="sm">
                <ThemeIcon variant="light" color="violet" size="lg" radius="md">
                  <IconReportAnalytics size={20} stroke={1.5} />
                </ThemeIcon>
                <div>
                  <Title order={4} c="dark.8">Operational Report</Title>
                  <Text size="xs" c="dimmed">{stats.hotelName} • {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</Text>
                </div>
              </Group>

              <Group gap="xs">
                <Button 
                  variant="default" 
                  size="sm" 
                  leftSection={<IconPrinter size={16} />}
                >
                  Print
                </Button>
                <Button 
                  variant="filled" 
                  color="violet" 
                  size="sm" 
                  leftSection={<IconDownload size={16} />}
                >
                  Export
                </Button>
              </Group>
            </Group>
          </Box>
        </Container>
      </Box>

      {/* 2. MAIN CONTENT */}
      <Container fluid px="lg" py="lg">
        <Box maw={MAX_WIDTH} mx="auto">
          <Stack gap="lg">
            
            {/* KPI CARDS ROW */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
              {/* Revenue Card */}
              <Paper p="md" radius="md" withBorder shadow="sm">
                <Group justify="space-between" align="flex-start">
                    <Stack gap={0}>
                        <Text size="xs" c="dimmed" fw={700} tt="uppercase">Daily Revenue</Text>
                        <Title order={3} c="violet.7">
                            Rp {stats.revenueToday.toLocaleString('id-ID')}
                        </Title>
                    </Stack>
                    <ThemeIcon variant="light" color="violet" radius="md">
                        <IconCash size={18} />
                    </ThemeIcon>
                </Group>
                <Text size="xs" c="teal" fw={500} mt="xs">
                    +12.5% <Text span c="dimmed" fw={400}>vs yesterday</Text>
                </Text>
              </Paper>

              {/* Occupancy Card */}
              <Paper p="md" radius="md" withBorder shadow="sm">
                <Group justify="space-between" align="flex-start">
                    <Stack gap={0}>
                        <Text size="xs" c="dimmed" fw={700} tt="uppercase">Occupancy</Text>
                        <Title order={3} c="blue.7">
                            {stats.occupancyRate.toFixed(1)}%
                        </Title>
                    </Stack>
                    <ThemeIcon variant="light" color="blue" radius="md">
                        <IconHotelService size={18} />
                    </ThemeIcon>
                </Group>
                <Progress value={stats.occupancyRate} size="sm" mt="sm" color="blue" radius="xl" />
              </Paper>

              {/* Arrivals Card */}
              <Paper p="md" radius="md" withBorder shadow="sm">
                <Group justify="space-between" align="flex-start">
                    <Stack gap={0}>
                        <Text size="xs" c="dimmed" fw={700} tt="uppercase">Expected Arrivals</Text>
                        <Title order={3} c="teal.7">
                            {stats.todayCheckIns}
                        </Title>
                    </Stack>
                    <ThemeIcon variant="light" color="teal" radius="md">
                        <IconLogin size={18} />
                    </ThemeIcon>
                </Group>
                <Text size="xs" c="dimmed" mt="xs">Guests checking in today</Text>
              </Paper>

              {/* Departures Card */}
              <Paper p="md" radius="md" withBorder shadow="sm">
                 <Group justify="space-between" align="flex-start">
                    <Stack gap={0}>
                        <Text size="xs" c="dimmed" fw={700} tt="uppercase">Expected Departures</Text>
                        <Title order={3} c="orange.7">
                            {stats.todayCheckOuts}
                        </Title>
                    </Stack>
                    <ThemeIcon variant="light" color="orange" radius="md">
                        <IconLogout size={18} />
                    </ThemeIcon>
                </Group>
                <Text size="xs" c="dimmed" mt="xs">Guests checking out today</Text>
              </Paper>
            </SimpleGrid>

            {/* DETAILED SECTIONS */}
            <Grid gutter="md">
                {/* Left: Room Status Distribution */}
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Card radius="md" withBorder padding="lg">
                        <Group justify="space-between" mb="lg">
                            <Group gap="xs">
                                <IconBed size={20} stroke={1.5} color="gray" />
                                <Text fw={600} size="lg">Room Status Distribution</Text>
                            </Group>
                            <Badge variant="light" color="gray" size="lg">{stats.totalRooms} Total Rooms</Badge>
                        </Group>

                        <Grid align="center">
                            <Grid.Col span={{ base: 12, sm: 4 }}>
                                <Group justify="center">
                                    <RingProgress 
                                        size={160} 
                                        thickness={12} 
                                        roundCaps 
                                        sections={ringSections} 
                                        label={
                                            <Stack align="center" gap={0}>
                                                <Text fw={700} size="xl">{stats.occupiedRooms}</Text>
                                                <Text size="xs" c="dimmed">Sold</Text>
                                            </Stack>
                                        }
                                    />
                                </Group>
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, sm: 8 }}>
                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                                    <Box p="sm" style={{ border: '1px solid #f1f3f5', borderRadius: 8 }}>
                                        <Group justify="space-between" mb={4}>
                                            <Group gap="xs">
                                                <Badge size="xs" circle color="teal" />
                                                <Text size="sm" c="dimmed">Available</Text>
                                            </Group>
                                            <Text fw={600}>{stats.availableRooms}</Text>
                                        </Group>
                                        <Progress value={(stats.availableRooms / stats.totalRooms) * 100} size="xs" color="teal" />
                                    </Box>

                                    <Box p="sm" style={{ border: '1px solid #f1f3f5', borderRadius: 8 }}>
                                        <Group justify="space-between" mb={4}>
                                            <Group gap="xs">
                                                <Badge size="xs" circle color="blue" />
                                                <Text size="sm" c="dimmed">Occupied</Text>
                                            </Group>
                                            <Text fw={600}>{stats.occupiedRooms}</Text>
                                        </Group>
                                        <Progress value={(stats.occupiedRooms / stats.totalRooms) * 100} size="xs" color="blue" />
                                    </Box>

                                    <Box p="sm" style={{ border: '1px solid #f1f3f5', borderRadius: 8 }}>
                                        <Group justify="space-between" mb={4}>
                                            <Group gap="xs">
                                                <Badge size="xs" circle color="orange" />
                                                <Text size="sm" c="dimmed">Maintenance</Text>
                                            </Group>
                                            <Text fw={600}>{stats.maintenanceRooms}</Text>
                                        </Group>
                                        <Progress value={(stats.maintenanceRooms / stats.totalRooms) * 100} size="xs" color="orange" />
                                    </Box>
                                </SimpleGrid>
                            </Grid.Col>
                        </Grid>
                    </Card>
                </Grid.Col>

                {/* Right: Quick Activity Summary */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Card radius="md" withBorder padding="lg" h="100%">
                        <Group gap="xs" mb="lg">
                            <IconCalendarEvent size={20} stroke={1.5} color="gray" />
                            <Text fw={600} size="lg">Today's Activity</Text>
                        </Group>
                        
                        <Stack gap="sm">
                            <Group justify="space-between" p="sm" bg="gray.0" style={{ borderRadius: 8 }}>
                                <Group gap="sm">
                                    <ThemeIcon color="teal" variant="white" size="md"><IconLogin size={16}/></ThemeIcon>
                                    <Text size="sm" fw={500}>Check-ins</Text>
                                </Group>
                                <Text fw={700}>{stats.todayCheckIns}</Text>
                            </Group>

                            <Group justify="space-between" p="sm" bg="gray.0" style={{ borderRadius: 8 }}>
                                <Group gap="sm">
                                    <ThemeIcon color="orange" variant="white" size="md"><IconLogout size={16}/></ThemeIcon>
                                    <Text size="sm" fw={500}>Check-outs</Text>
                                </Group>
                                <Text fw={700}>{stats.todayCheckOuts}</Text>
                            </Group>

                             <Group justify="space-between" p="sm" bg="gray.0" style={{ borderRadius: 8 }}>
                                <Group gap="sm">
                                    <ThemeIcon color="gray" variant="white" size="md"><IconTools size={16}/></ThemeIcon>
                                    <Text size="sm" fw={500}>OOO Rooms</Text>
                                </Group>
                                <Text fw={700}>{stats.maintenanceRooms}</Text>
                            </Group>

                            <Button variant="light" color="violet" fullWidth mt="md">
                                View Detailed Logs
                            </Button>
                        </Stack>
                    </Card>
                </Grid.Col>
            </Grid>

          </Stack>
        </Box>
      </Container>
    </Box>
  );
}