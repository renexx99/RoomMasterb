// src/app/manager/dashboard/client.tsx
'use client';

import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Stack,
  Group,
  Paper,
  ThemeIcon,
  Box,
  Badge,
  Progress,
  RingProgress,
  Button,
  Avatar,
  Grid,
  Card,
  ScrollArea,
} from '@mantine/core';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconCash,
  IconBed,
  IconSparkles,
  IconChartBar,
  IconAlertCircle,
  IconArrowUpRight,
  IconClockHour4,
  IconGift,
  IconBrandBooking,
  IconPercentage,
} from '@tabler/icons-react';
import { useState } from 'react';

interface ClientProps {
  data?: any;
}

export default function ManagerDashboardClient({ data }: ClientProps) {
  const [activeInsights, setActiveInsights] = useState([true, true, true, true, true]);

  // KPI Metrics (4 cards - RevPAR diganti Direct Booking Ratio)
  const kpiData = [
    {
      title: 'Occupancy Rate',
      value: '78.5%',
      change: '+5.2%',
      trend: 'up',
      icon: IconBed,
      color: 'indigo',
      progress: 78.5,
    },
    {
      title: 'ADR',
      value: 'Rp 850K',
      change: '+12.3%',
      trend: 'up',
      icon: IconCash,
      color: 'teal',
      progress: 68,
    },
    {
      title: 'Direct Booking',
      value: '64.2%',
      change: '+18.5%',
      trend: 'up',
      icon: IconBrandBooking,
      color: 'violet',
      progress: 64.2,
    },
    {
      title: 'Today Revenue',
      value: 'Rp 18.5M',
      change: '-2.1%',
      trend: 'down',
      icon: IconPercentage,
      color: 'blue',
      progress: 85,
    },
  ];

  // Extended AI Insights (5 items untuk scroll demo)
  const aiInsights = [
    {
      id: 1,
      type: 'pricing',
      priority: 'high',
      title: 'Dynamic Pricing Alert',
      description: 'Weekend demand surge predicted (+42%). Optimize Deluxe pricing.',
      impact: '+Rp 3.2M',
      icon: IconSparkles,
      color: 'yellow',
      actionLabel: 'Apply',
    },
    {
      id: 2,
      type: 'loyalty',
      priority: 'medium',
      title: 'VIP Guest Incoming',
      description: 'Budi Hartono (Rp 12M LTV) arrives tomorrow. Prepare perks.',
      impact: '94% retention',
      icon: IconGift,
      color: 'pink',
      actionLabel: 'Approve',
    },
    {
      id: 3,
      type: 'maintenance',
      priority: 'urgent',
      title: 'Room 303 Alert',
      description: 'Maintenance exceeds 72h. Contact housekeeping now.',
      impact: '-Rp 850K/day',
      icon: IconAlertCircle,
      color: 'red',
      actionLabel: 'Escalate',
    },
    {
      id: 4,
      type: 'booking',
      priority: 'low',
      title: 'Direct Booking Trend',
      description: 'Website bookings up 18% vs OTA. Continue SEO investment.',
      impact: '-12% commission',
      icon: IconBrandBooking,
      color: 'teal',
      actionLabel: 'Review',
    },
    {
      id: 5,
      type: 'analytics',
      priority: 'medium',
      title: 'Cancellation Pattern',
      description: 'Unusual spike in same-day cancellations. Investigate policy.',
      impact: 'Risk: -Rp 1.8M',
      icon: IconChartBar,
      color: 'orange',
      actionLabel: 'Analyze',
    },
  ];

  // Occupancy Trend (7 days)
  const occupancyTrend = [
    { day: 'Mon', value: 72 },
    { day: 'Tue', value: 68 },
    { day: 'Wed', value: 75 },
    { day: 'Thu', value: 71 },
    { day: 'Fri', value: 82 },
    { day: 'Sat', value: 88 },
    { day: 'Sun', value: 78 },
  ];

  // Revenue Breakdown
  const revenueBreakdown = [
    { category: 'Room', amount: 12.5, percentage: 67, color: 'indigo' },
    { category: 'F&B', amount: 4.2, percentage: 23, color: 'teal' },
    { category: 'Services', amount: 1.8, percentage: 10, color: 'violet' },
  ];

  // Recent Reservations (kompak)
  const recentReservations = [
    { id: 'RES-2401', guest: 'Andi Wijaya', room: '205', checkIn: 'Today 14:00', status: 'confirmed', amount: 'Rp 950K' },
    { id: 'RES-2402', guest: 'Sarah Chen', room: '312', checkIn: 'Today 16:30', status: 'checked-in', amount: 'Rp 1.5M' },
    { id: 'RES-2403', guest: 'Budi Hartono', room: '401', checkIn: 'Tomorrow 15:00', status: 'confirmed', amount: 'Rp 3.2M' },
    { id: 'RES-2404', guest: 'Linda Kusuma', room: '108', checkIn: 'Tomorrow 12:00', status: 'pending', amount: 'Rp 650K' },
    { id: 'RES-2405', guest: 'David Tan', room: '220', checkIn: 'Dec 03 14:00', status: 'confirmed', amount: 'Rp 900K' },
  ];

  const handleInsightAction = (id: number) => {
    setActiveInsights(prev => {
      const updated = [...prev];
      updated[id - 1] = false;
      return updated;
    });
  };

  return (
    <Box style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      
      {/* Header lama DIHAPUS. Konten langsung mulai di sini. */}

      {/* Main 2-Column Layout */}
      <Container fluid px="md" py="lg">
        <Grid gutter="sm">
          
          {/* LEFT COLUMN - Main Dashboard (75%) */}
          <Grid.Col span={{ base: 12, lg: 9 }}>
            <Stack gap="sm">
              
              {/* KPI Cards - Compact */}
              <SimpleGrid cols={{ base: 2, md: 4 }} spacing="xs">
                {kpiData.map((kpi) => (
                  <Paper key={kpi.title} p="xs" radius="md" withBorder style={{ borderColor: '#e9ecef' }}>
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text size="9px" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.3px' }}>
                          {kpi.title}
                        </Text>
                        <Title order={3} style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 2 }}>
                          {kpi.value}
                        </Title>
                        <Badge
                          size="xs"
                          variant="light"
                          color={kpi.trend === 'up' ? 'teal' : 'red'}
                          leftSection={kpi.trend === 'up' ? <IconTrendingUp size={10} /> : <IconTrendingDown size={10} />}
                          style={{ marginTop: 2 }}
                        >
                          {kpi.change}
                        </Badge>
                      </div>
                      <ThemeIcon size={32} radius="md" variant="light" color={kpi.color}>
                        <kpi.icon size={16} stroke={1.5} />
                      </ThemeIcon>
                    </Group>
                    <Progress value={kpi.progress} size="xs" radius="xl" color={kpi.color} mt={6} />
                  </Paper>
                ))}
              </SimpleGrid>

              {/* Charts Row */}
              <Grid gutter="xs">
                {/* Occupancy Trend */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card shadow="xs" padding="sm" radius="md" withBorder style={{ height: 220 }}>
                    <Group justify="space-between" mb="xs">
                      <div>
                        <Text size="xs" fw={700}>7-Day Occupancy</Text>
                        <Text size="9px" c="dimmed">Weekly trend</Text>
                      </div>
                      <ThemeIcon size={28} radius="md" variant="light" color="indigo">
                        <IconChartBar size={14} />
                      </ThemeIcon>
                    </Group>

                    <Box style={{ height: 100 }}>
                      <Group gap={4} justify="space-between" align="flex-end" style={{ height: '100%' }}>
                        {occupancyTrend.map((day, idx) => (
                          <Box key={idx} style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                            <Box
                              style={{
                                height: `${day.value * 0.9}px`,
                                background: idx === occupancyTrend.length - 1 
                                  ? 'linear-gradient(180deg, #4c6ef5 0%, #364fc7 100%)'
                                  : '#e9ecef',
                                borderRadius: '3px',
                                marginBottom: '4px',
                              }}
                            />
                            <Text size="9px" fw={idx === occupancyTrend.length - 1 ? 700 : 500} c={idx === occupancyTrend.length - 1 ? 'indigo' : 'dimmed'}>
                              {day.day}
                            </Text>
                            <Text size="8px" c="dimmed">
                              {day.value}%
                            </Text>
                          </Box>
                        ))}
                      </Group>
                    </Box>

                    <Group justify="space-between" pt="xs" mt="xs" style={{ borderTop: '1px solid #e9ecef' }}>
                      <Text size="9px" c="dimmed">Avg: 76.3%</Text>
                      <Badge size="xs" variant="light" color="teal" leftSection={<IconTrendingUp size={10} />}>
                        +8.2%
                      </Badge>
                    </Group>
                  </Card>
                </Grid.Col>

                {/* Revenue Breakdown */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card shadow="xs" padding="sm" radius="md" withBorder style={{ height: 220 }}>
                    <Group justify="space-between" mb="xs">
                      <div>
                        <Text size="xs" fw={700}>Revenue Split</Text>
                        <Text size="9px" c="dimmed">Today breakdown</Text>
                      </div>
                      <RingProgress
                        size={60}
                        thickness={6}
                        sections={revenueBreakdown.map(item => ({
                          value: item.percentage,
                          color: item.color,
                        }))}
                        label={
                          <Text size="9px" ta="center" fw={700}>
                            18.5M
                          </Text>
                        }
                      />
                    </Group>

                    <Stack gap={6}>
                      {revenueBreakdown.map((item) => (
                        <Box key={item.category}>
                          <Group justify="space-between" mb={2}>
                            <Group gap={4}>
                              <Box
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  background: item.color === 'indigo' ? '#4c6ef5' : item.color === 'teal' ? '#20c997' : '#7950f2',
                                }}
                              />
                              <Text size="10px" fw={500}>
                                {item.category}
                              </Text>
                            </Group>
                            <Text size="10px" fw={700}>
                              Rp {item.amount}M
                            </Text>
                          </Group>
                          <Progress value={item.percentage} size="xs" radius="xl" color={item.color} />
                        </Box>
                      ))}
                    </Stack>

                    <Group justify="space-between" pt="xs" mt="xs" style={{ borderTop: '1px solid #e9ecef' }}>
                      <Text size="9px" c="dimmed">Total</Text>
                      <Badge size="xs" variant="light" color="indigo">
                        +12.5%
                      </Badge>
                    </Group>
                  </Card>
                </Grid.Col>
              </Grid>

              {/* Recent Reservations - Compact Table */}
              <Card shadow="xs" padding="sm" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                  <div>
                    <Text size="xs" fw={700}>Recent Reservations</Text>
                    <Text size="9px" c="dimmed">Latest bookings</Text>
                  </div>
                  <Button variant="light" color="indigo" size="xs">
                    View All
                  </Button>
                </Group>

                <Stack gap={4}>
                  {recentReservations.map((res) => (
                    <Paper
                      key={res.id}
                      p="xs"
                      radius="sm"
                      style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                          <Avatar size={28} radius="md" color="indigo">
                            {res.guest.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text size="xs" fw={600} truncate>
                              {res.guest}
                            </Text>
                            <Group gap={4}>
                              <Text size="9px" c="dimmed">
                                {res.id}
                              </Text>
                              <Text size="9px" c="dimmed">•</Text>
                              <Text size="9px" c="dimmed">
                                Room {res.room}
                              </Text>
                            </Group>
                          </div>
                        </Group>

                        <Group gap="xs" wrap="nowrap">
                          <div style={{ textAlign: 'right' }}>
                            <Text size="9px" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                              <IconClockHour4 size={10} />
                              {res.checkIn}
                            </Text>
                            <Text size="xs" fw={700}>
                              {res.amount}
                            </Text>
                          </div>
                          <Badge
                            size="xs"
                            variant="light"
                            color={
                              res.status === 'checked-in' ? 'teal' :
                              res.status === 'confirmed' ? 'blue' :
                              'yellow'
                            }
                          >
                            {res.status}
                          </Badge>
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Card>

            </Stack>
          </Grid.Col>

          {/* RIGHT COLUMN - AI Strategic Advisor (25%) */}
          <Grid.Col span={{ base: 12, lg: 3 }}>
            <Card
              shadow="md"
              padding="sm"
              radius="md"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                border: '2px solid #818cf8',
                position: 'sticky',
                top: 10,
              }}
            >
              <Stack gap="xs">
                {/* Header */}
                <Group justify="space-between" mb="xs">
                  <Group gap="xs">
                    <ThemeIcon size={32} radius="md" variant="gradient" gradient={{ from: 'indigo', to: 'violet' }}>
                      <IconSparkles size={16} stroke={2} />
                    </ThemeIcon>
                    <div>
                      <Text size="xs" fw={700}>AI Co-Pilot</Text>
                      <Badge size="xs" variant="gradient" gradient={{ from: 'indigo', to: 'violet' }}>
                        LIVE
                      </Badge>
                    </div>
                  </Group>
                </Group>

                <Text size="9px" c="dimmed" mb="xs">
                  Real-time prescriptive insights
                </Text>

                {/* Scrollable Insights Feed */}
                <ScrollArea h={520} offsetScrollbars>
                  <Stack gap="xs" pr="xs">
                    {aiInsights.map((insight, index) => (
                      activeInsights[index] && (
                        <Paper
                          key={insight.id}
                          p="xs"
                          radius="sm"
                          withBorder
                          style={{
                            borderColor: insight.priority === 'urgent' ? '#fa5252' : insight.priority === 'high' ? '#fab005' : '#e9ecef',
                            borderWidth: insight.priority === 'urgent' ? 2 : 1,
                            background: 'white',
                          }}
                        >
                          <Stack gap={6}>
                            <Group justify="space-between" align="flex-start">
                              <ThemeIcon size={24} radius="sm" variant="light" color={insight.color}>
                                <insight.icon size={14} stroke={1.5} />
                              </ThemeIcon>
                              <Badge
                                size="xs"
                                variant="dot"
                                color={insight.priority === 'urgent' ? 'red' : insight.priority === 'high' ? 'yellow' : 'blue'}
                              >
                                {insight.priority}
                              </Badge>
                            </Group>

                            <div>
                              <Text size="10px" fw={700} style={{ lineHeight: 1.3 }}>
                                {insight.title}
                              </Text>
                              <Text size="9px" c="dimmed" mt={2} style={{ lineHeight: 1.4 }}>
                                {insight.description}
                              </Text>
                            </div>

                            <Paper p={4} radius="xs" style={{ background: '#f8f9fa' }}>
                              <Text size="9px" fw={600} c="indigo">
                                💡 {insight.impact}
                              </Text>
                            </Paper>

                            <Button
                              size="xs"
                              variant="light"
                              color={insight.color}
                              fullWidth
                              rightSection={<IconArrowUpRight size={12} />}
                              onClick={() => handleInsightAction(insight.id)}
                            >
                              {insight.actionLabel}
                            </Button>
                          </Stack>
                        </Paper>
                      )
                    ))}
                  </Stack>
                </ScrollArea>

                <Button
                  variant="subtle"
                  color="indigo"
                  size="xs"
                  fullWidth
                  mt="xs"
                >
                  View All Insights
                </Button>
              </Stack>
            </Card>
          </Grid.Col>

        </Grid>
      </Container>
    </Box>
  );
}