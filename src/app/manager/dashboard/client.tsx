'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Textarea,
  ActionIcon,
  Transition,
  Tooltip,
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
  IconX,
  IconSend,
  IconMaximize,
  IconMinimize,
} from '@tabler/icons-react';

interface ChatMessage {
  type: 'ai' | 'user' | 'system';
  content: string;
  timestamp: Date;
}

export default function ManagerDashboardClient() {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activeInsights, setActiveInsights] = useState([true, true, true, true, true]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // KPI Metrics
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

  // AI Insights
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

  // Occupancy Trend
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

  // Recent Reservations
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
    
    // Add to chat
    const insight = aiInsights.find(i => i.id === id);
    if (insight) {
      setChatHistory(prev => [...prev, {
        type: 'system',
        content: `Action "${insight.actionLabel}" applied for: ${insight.title}`,
        timestamp: new Date(),
      }]);
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    // Add user message
    setChatHistory(prev => [...prev, {
      type: 'user',
      content: chatMessage,
      timestamp: new Date(),
    }]);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        'Based on current occupancy trends, I recommend increasing weekend rates by 15% for premium rooms.',
        'I\'ve analyzed the data. Your direct booking ratio is excellent! Consider allocating more budget to your website SEO.',
        'Room 303 maintenance issue has been flagged. I\'ve notified the housekeeping team automatically.',
        'Your F&B revenue is performing well. Consider a promotional package to boost it further during low seasons.',
        'I notice Budi Hartono is a VIP guest. Would you like me to prepare a personalized welcome package?',
      ];
      
      setChatHistory(prev => [...prev, {
        type: 'ai',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      }]);
    }, 1000);

    setChatMessage('');
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <Box style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Container fluid px="md" py="lg">
        <Stack gap="sm">
          
          {/* KPI Cards - Full Width */}
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
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
                      color={kpi.trend === 'up' ? 'teal' : 'red'}
                      leftSection={kpi.trend === 'up' ? <IconTrendingUp size={12} /> : <IconTrendingDown size={12} />}
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

          {/* Charts Row */}
          <Grid gutter="sm">
            {/* Occupancy Trend */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="sm" padding="md" radius="md" withBorder style={{ height: 280 }}>
                <Group justify="space-between" mb="md">
                  <div>
                    <Text size="sm" fw={700}>7-Day Occupancy</Text>
                    <Text size="xs" c="dimmed">Weekly trend analysis</Text>
                  </div>
                  <ThemeIcon size={36} radius="md" variant="light" color="indigo">
                    <IconChartBar size={18} />
                  </ThemeIcon>
                </Group>

                <Box style={{ height: 140 }}>
                  <Group gap={6} justify="space-between" align="flex-end" style={{ height: '100%' }}>
                    {occupancyTrend.map((day, idx) => (
                      <Box key={idx} style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <Box
                          style={{
                            height: `${day.value * 1.2}px`,
                            background: idx === occupancyTrend.length - 1 
                              ? 'linear-gradient(180deg, #4c6ef5 0%, #364fc7 100%)'
                              : '#e9ecef',
                            borderRadius: '4px',
                            marginBottom: '6px',
                          }}
                        />
                        <Text size="xs" fw={idx === occupancyTrend.length - 1 ? 700 : 500} c={idx === occupancyTrend.length - 1 ? 'indigo' : 'dimmed'}>
                          {day.day}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {day.value}%
                        </Text>
                      </Box>
                    ))}
                  </Group>
                </Box>

                <Group justify="space-between" pt="md" mt="md" style={{ borderTop: '1px solid #e9ecef' }}>
                  <Text size="xs" c="dimmed">Average: 76.3%</Text>
                  <Badge size="sm" variant="light" color="teal" leftSection={<IconTrendingUp size={12} />}>
                    +8.2%
                  </Badge>
                </Group>
              </Card>
            </Grid.Col>

            {/* Revenue Breakdown */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="sm" padding="md" radius="md" withBorder style={{ height: 280 }}>
                <Group justify="space-between" mb="md">
                  <div>
                    <Text size="sm" fw={700}>Revenue Split</Text>
                    <Text size="xs" c="dimmed">Today's breakdown</Text>
                  </div>
                  <RingProgress
                    size={70}
                    thickness={8}
                    sections={revenueBreakdown.map(item => ({
                      value: item.percentage,
                      color: item.color,
                    }))}
                    label={
                      <Text size="xs" ta="center" fw={700}>
                        18.5M
                      </Text>
                    }
                  />
                </Group>

                <Stack gap={8}>
                  {revenueBreakdown.map((item) => (
                    <Box key={item.category}>
                      <Group justify="space-between" mb={4}>
                        <Group gap={6}>
                          <Box
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: item.color === 'indigo' ? '#4c6ef5' : item.color === 'teal' ? '#20c997' : '#7950f2',
                            }}
                          />
                          <Text size="sm" fw={500}>
                            {item.category}
                          </Text>
                        </Group>
                        <Text size="sm" fw={700}>
                          Rp {item.amount}M
                        </Text>
                      </Group>
                      <Progress value={item.percentage} size="sm" radius="xl" color={item.color} />
                    </Box>
                  ))}
                </Stack>

                <Group justify="space-between" pt="md" mt="md" style={{ borderTop: '1px solid #e9ecef' }}>
                  <Text size="xs" c="dimmed">Total Revenue</Text>
                  <Badge size="sm" variant="light" color="indigo">
                    +12.5%
                  </Badge>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Recent Reservations */}
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <div>
                <Text size="sm" fw={700}>Recent Reservations</Text>
                <Text size="xs" c="dimmed">Latest bookings and check-ins</Text>
              </div>
              <Button variant="light" color="indigo" size="sm">
                View All
              </Button>
            </Group>

            <Stack gap={6}>
              {recentReservations.map((res) => (
                <Paper
                  key={res.id}
                  p="sm"
                  radius="md"
                  style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                      <Avatar size={36} radius="md" color="indigo">
                        {res.guest.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" fw={600} truncate>
                          {res.guest}
                        </Text>
                        <Group gap={6}>
                          <Text size="xs" c="dimmed">
                            {res.id}
                          </Text>
                          <Text size="xs" c="dimmed">•</Text>
                          <Text size="xs" c="dimmed">
                            Room {res.room}
                          </Text>
                        </Group>
                      </div>
                    </Group>

                    <Group gap="sm" wrap="nowrap">
                      <div style={{ textAlign: 'right' }}>
                        <Text size="xs" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                          <IconClockHour4 size={12} />
                          {res.checkIn}
                        </Text>
                        <Text size="sm" fw={700}>
                          {res.amount}
                        </Text>
                      </div>
                      <Badge
                        size="sm"
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
      </Container>

      {/* Floating AI Widget Button */}
      {!isWidgetOpen && (
        <Tooltip label="Open AI Co-Pilot" position="left">
          <ActionIcon
            size={60}
            radius="xl"
            variant="gradient"
            gradient={{ from: 'indigo', to: 'violet' }}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
              cursor: 'pointer',
              zIndex: 1000,
            }}
            onClick={() => setIsWidgetOpen(true)}
          >
            <IconSparkles size={28} stroke={2} />
          </ActionIcon>
        </Tooltip>
      )}

      {/* Floating AI Widget Panel */}
      <Transition
        mounted={isWidgetOpen}
        transition="slide-up"
        duration={300}
        timingFunction="ease"
      >
        {(styles) => (
          <Paper
            shadow="xl"
            radius="lg"
            style={{
              ...styles,
              position: 'fixed',
              bottom: isMaximized ? 0 : 24,
              right: isMaximized ? 0 : 24,
              width: isMaximized ? '100%' : 420,
              height: isMaximized ? '100vh' : 600,
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              background: 'white',
              border: '2px solid #818cf8',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <Box
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '12px 16px',
                borderRadius: isMaximized ? 0 : '12px 12px 0 0',
              }}
            >
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon size={28} radius="md" color="white" variant="light">
                    <IconSparkles size={16} stroke={2} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" fw={700} c="white">AI Co-Pilot</Text>
                    <Badge size="xs" variant="light" color="green" style={{ height: '16px', padding: '0 6px' }}>
                      LIVE
                    </Badge>
                  </div>
                </Group>
                <Group gap={4}>
                  <ActionIcon
                    size={28}
                    variant="subtle"
                    color="white"
                    onClick={() => setIsMaximized(!isMaximized)}
                  >
                    {isMaximized ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
                  </ActionIcon>
                  <ActionIcon
                    size={28}
                    variant="subtle"
                    color="white"
                    onClick={() => setIsWidgetOpen(false)}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            </Box>

            {/* Chat Area */}
            <ScrollArea style={{ flex: 1, padding: '12px 16px' }} ref={chatScrollRef}>
              <Stack gap="sm">
                {/* AI Greeting Message */}
                <Paper
                  p="md"
                  radius="md"
                  style={{
                    background: 'white',
                    border: '1px solid #e9ecef',
                  }}
                >
                  <Group gap="xs" mb="xs">
                    <ThemeIcon size={28} radius="md" variant="light" color="violet">
                      <IconSparkles size={16} />
                    </ThemeIcon>
                    <Text size="sm" fw={700}>AI Co-Pilot</Text>
                  </Group>
                  <Text size="sm" style={{ lineHeight: 1.5 }} c="dimmed">
                    Hi! I'm your AI Co-Pilot. I can help you with pricing strategies, guest management, and operational insights. How can I assist you today?
                  </Text>
                </Paper>

                {/* Quick Action Insights - Compact */}
                {activeInsights.filter(Boolean).length > 0 && (
                  <Box>
                    <Group gap="xs" mb="xs">
                      <Text size="xs" fw={700} c="dimmed">QUICK ACTIONS</Text>
                      <Badge
                        size="xs"
                        variant="light"
                        color="yellow"
                        leftSection={<IconAlertCircle size={10} />}
                      >
                        {activeInsights.filter(Boolean).length}
                      </Badge>
                    </Group>
                    
                    <Stack gap={6}>
                      {aiInsights.map((insight, index) => (
                        activeInsights[index] && (
                          <Paper
                            key={insight.id}
                            p="xs"
                            radius="sm"
                            withBorder
                            style={{
                              borderColor: insight.priority === 'urgent' ? '#fa5252' : insight.priority === 'high' ? '#fab005' : '#e9ecef',
                              background: 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <Stack gap={6}>
                              <Group gap="xs" wrap="nowrap" align="flex-start">
                                <ThemeIcon size={24} radius="sm" variant="light" color={insight.color}>
                                  <insight.icon size={14} stroke={1.5} />
                                </ThemeIcon>
                                
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <Text size="xs" fw={700} style={{ lineHeight: 1.3 }} mb={2}>
                                    {insight.title}
                                  </Text>
                                  <Text size="10px" c="dimmed" style={{ lineHeight: 1.4 }}>
                                    {insight.description}
                                  </Text>
                                  <Group gap={4} mt={4}>
                                    <Badge
                                      size="xs"
                                      variant="dot"
                                      color={insight.priority === 'urgent' ? 'red' : insight.priority === 'high' ? 'yellow' : 'blue'}
                                    >
                                      {insight.priority}
                                    </Badge>
                                    <Text size="9px" fw={600} c="indigo">
                                      💡 {insight.impact}
                                    </Text>
                                  </Group>
                                </div>
                              </Group>

                              <Button
                                size="xs"
                                variant="light"
                                color={insight.color}
                                fullWidth
                                rightSection={<IconArrowUpRight size={12} />}
                                style={{ height: '28px' }}
                                onClick={() => handleInsightAction(insight.id)}
                              >
                                {insight.actionLabel}
                              </Button>
                            </Stack>
                          </Paper>
                        )
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Conversation Messages */}
                {chatHistory.length > 0 && (
                  <Box mt="md">
                    <Text size="xs" fw={700} c="dimmed" mb="xs">CONVERSATION</Text>
                    <Stack gap="sm">
                      {chatHistory.map((msg, idx) => (
                        <Box
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <Paper
                            p="sm"
                            radius="md"
                            style={{
                              maxWidth: '85%',
                              background: msg.type === 'user' ? '#667eea' : msg.type === 'system' ? '#f8f9fa' : 'white',
                              border: msg.type === 'ai' ? '1px solid #e9ecef' : 'none',
                              color: msg.type === 'user' ? 'white' : 'inherit',
                            }}
                          >
                            <Text size="sm" style={{ lineHeight: 1.5 }}>
                              {msg.content}
                            </Text>
                            <Text size="9px" c={msg.type === 'user' ? 'rgba(255,255,255,0.7)' : 'dimmed'} mt={4}>
                              {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </Paper>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </ScrollArea>

            {/* Chat Input */}
            <Box
              p="md"
              style={{
                borderTop: '1px solid #e9ecef',
                background: 'white',
              }}
            >
              <Group gap="xs" align="flex-end">
                <Textarea
                  placeholder="Ask AI anything about your hotel operations..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  minRows={1}
                  maxRows={3}
                  autosize
                  style={{ flex: 1 }}
                />
                <ActionIcon
                  size={36}
                  radius="md"
                  variant="gradient"
                  gradient={{ from: 'indigo', to: 'violet' }}
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                >
                  <IconSend size={18} />
                </ActionIcon>
              </Group>
            </Box>
          </Paper>
        )}
      </Transition>
    </Box>
  );
}