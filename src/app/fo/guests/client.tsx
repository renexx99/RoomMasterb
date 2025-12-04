// src/app/fo/guests/client.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Container, Title, Button, Group, Paper, TextInput,
  Select, ActionIcon, Text, Grid, Stack, Box, ThemeIcon,
  Card, Badge, Avatar, Timeline, RingProgress, SimpleGrid, Tabs, ScrollArea
} from '@mantine/core';
import { 
  IconPlus, IconArrowLeft, IconSearch, IconSparkles, 
  IconUserStar, IconHistory, IconTag, IconTrendingUp,
  IconMoodSmile, IconBed, IconClock, IconGift,
  IconPhone, IconMail, IconDiamond, IconBolt, IconChartBar
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

// Mock Data dengan cerita yang kaya
const MOCK_GUESTS = [
  {
    id: '1',
    full_name: 'Richard Anderson',
    email: 'richard.anderson@techcorp.com',
    phone_number: '+62 812-3456-7890',
    tier: 'Diamond',
    status: 'In-House',
    avatar: 'RA',
    total_spend: 45000000,
    total_stays: 28,
    ltv_score: 92,
    preferences: ['High Floor', 'Express Check-in', 'Business Lounge', 'Non-Smoking'],
    behavioral_insights: [
      'Always checks in after 10 PM',
      'Prefers rooms ending with number 8',
      'Orders room service breakfast 90% of the time',
      'Average stay: 3-4 nights'
    ],
    ai_suggestions: [
      { icon: IconGift, text: 'Upgrade to Executive Suite (High conversion: 78%)', color: 'violet' },
      { icon: IconClock, text: 'Offer complimentary late check-out', color: 'blue' },
      { icon: IconMoodSmile, text: 'Send birthday greetings - birthday in 3 days', color: 'pink' }
    ],
    recent_history: [
      { date: '2024-11-15', room: 'Deluxe 808', nights: 4, spend: 8500000 },
      { date: '2024-10-02', room: 'Executive 1208', nights: 3, spend: 12000000 },
      { date: '2024-08-20', room: 'Deluxe 708', nights: 5, spend: 11000000 }
    ]
  },
  {
    id: '2',
    full_name: 'Sarah Chen',
    email: 'sarah.chen@family.com',
    phone_number: '+62 821-9876-5432',
    tier: 'Gold',
    status: 'Checked-Out',
    avatar: 'SC',
    total_spend: 18000000,
    total_stays: 12,
    ltv_score: 68,
    preferences: ['Twin Beds', 'Connecting Rooms', 'Pool View', 'Baby Cot'],
    behavioral_insights: [
      'Travels with 2 children (ages 5-8)',
      'Books during school holidays only',
      'Requests extra towels and pillows',
      'Uses hotel pool facilities extensively'
    ],
    ai_suggestions: [
      { icon: IconGift, text: 'Offer Kids Stay Free promotion', color: 'orange' },
      { icon: IconBed, text: 'Recommend Family Suite - 35% upsell opportunity', color: 'teal' },
      { icon: IconMoodSmile, text: 'Complimentary welcome treats for kids', color: 'grape' }
    ],
    recent_history: [
      { date: '2024-12-20', room: 'Family Suite 505', nights: 5, spend: 9000000 },
      { date: '2024-07-10', room: 'Twin Deluxe 603', nights: 7, spend: 9000000 }
    ]
  },
  {
    id: '3',
    full_name: 'Michael Hartono',
    email: 'm.hartono@investments.id',
    phone_number: '+62 811-2233-4455',
    tier: 'Platinum',
    status: 'Checked-Out',
    avatar: 'MH',
    total_spend: 32000000,
    total_stays: 19,
    ltv_score: 85,
    preferences: ['King Bed', 'Quiet Room', 'High Floor', 'Newspaper'],
    behavioral_insights: [
      'Extremely sensitive to noise',
      'Never uses minibar or room service',
      'Prefers corner rooms away from elevator',
      'Always declines housekeeping'
    ],
    ai_suggestions: [
      { icon: IconBolt, text: 'PRIORITY: Assign quietest room (corner units)', color: 'red' },
      { icon: IconMoodSmile, text: 'Waive room service charge - gesture of goodwill', color: 'cyan' },
      { icon: IconTag, text: 'Flag profile: Requires noise-sensitive handling', color: 'yellow' }
    ],
    recent_history: [
      { date: '2024-11-28', room: 'Deluxe 1501', nights: 2, spend: 4500000 },
      { date: '2024-10-15', room: 'Executive 1401', nights: 3, spend: 9000000 }
    ]
  },
  {
    id: '4',
    full_name: 'Amanda Kusuma',
    email: 'amanda.k@startup.co',
    phone_number: '+62 856-7788-9900',
    tier: 'Silver',
    status: 'Checked-Out',
    avatar: 'AK',
    total_spend: 8500000,
    total_stays: 6,
    ltv_score: 54,
    preferences: ['Free WiFi', 'Workspace Area', 'Coffee Machine', 'Late Check-out'],
    behavioral_insights: [
      'Digital nomad - stays 7-10 days',
      'Works from room during daytime',
      'Frequently extends stay last-minute',
      'Price-sensitive but loyal'
    ],
    ai_suggestions: [
      { icon: IconTrendingUp, text: 'Offer weekly rate discount', color: 'indigo' },
      { icon: IconGift, text: 'Complimentary workspace upgrade', color: 'lime' },
      { icon: IconClock, text: 'Flexible check-in/out times', color: 'violet' }
    ],
    recent_history: [
      { date: '2024-11-01', room: 'Standard 304', nights: 8, spend: 4800000 },
      { date: '2024-09-12', room: 'Standard 206', nights: 6, spend: 3700000 }
    ]
  }
];

export default function GuestsClient() {
  const router = useRouter();
  const MAX_WIDTH = 1600;

  // State
  const [selectedGuest, setSelectedGuest] = useState<typeof MOCK_GUESTS[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string | null>(null);

  // Filtered guests
  const filteredGuests = useMemo(() => {
    let result = [...MOCK_GUESTS];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(g => 
        g.full_name.toLowerCase().includes(lower) ||
        g.phone_number.includes(searchTerm)
      );
    }

    if (filterTier) {
      result = result.filter(g => g.tier === filterTier);
    }

    return result;
  }, [searchTerm, filterTier]);

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      'Diamond': 'violet',
      'Platinum': 'gray',
      'Gold': 'yellow',
      'Silver': 'cyan'
    };
    return colors[tier] || 'blue';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
      {/* Compact Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        padding: '0.75rem 0', 
        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)',
        flexShrink: 0
      }}>
        <Container fluid px="lg">
          <Box maw={MAX_WIDTH} mx="auto">
            <Group justify="space-between" align="center">
              <Group gap="sm">
                <ThemeIcon size="md" radius="md" variant="light" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <IconSparkles size={18} color="white" />
                </ThemeIcon>
                <div>
                  <Group gap={6} align="center">
                    <Title order={4} c="white" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                      Guest Intelligence Hub
                    </Title>
                    <Badge size="xs" variant="light" color="white" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                      AI
                    </Badge>
                  </Group>
                  <Text c="white" opacity={0.85} size="xs">
                    360° Profiles • AI Insights
                  </Text>
                </div>
              </Group>
              <Group gap="xs">
                <ActionIcon variant="light" size="md" radius="md" onClick={() => router.push('/fo/dashboard')} style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <IconArrowLeft size={16} color="white" />
                </ActionIcon>
                <Button leftSection={<IconPlus size={14} />} variant="white" size="xs" radius="md" fw={600}>
                  Add Guest
                </Button>
              </Group>
            </Group>
          </Box>
        </Container>
      </div>

      {/* Main Content - Full Height dengan Scroll */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Container fluid px="lg" py="sm" style={{ height: '100%' }}>
          <Box maw={MAX_WIDTH} mx="auto" style={{ height: '100%' }}>
            <Grid gutter="sm" style={{ height: '100%', margin: 0 }}>
              {/* LEFT: Guest List (35%) */}
              <Grid.Col span={{ base: 12, lg: 4 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Stack gap="xs" style={{ height: '100%' }}>
                  {/* Search & Filter - Compact */}
                  <Paper p="xs" radius="md" withBorder style={{ flexShrink: 0 }}>
                    <Stack gap={6}>
                      <TextInput
                        placeholder="Search name or phone..."
                        leftSection={<IconSearch size={14} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.currentTarget.value)}
                        size="xs"
                        radius="sm"
                      />
                      <Select
                        placeholder="All Tiers"
                        data={['Diamond', 'Platinum', 'Gold', 'Silver']}
                        value={filterTier}
                        onChange={setFilterTier}
                        clearable
                        size="xs"
                      />
                    </Stack>
                  </Paper>

                  {/* Guest List - Scrollable */}
                  <ScrollArea style={{ flex: 1 }} type="auto">
                    <Stack gap={6}>
                      {filteredGuests.map((guest) => (
                        <Paper
                          key={guest.id}
                          p="xs"
                          radius="sm"
                          withBorder
                          style={{
                            cursor: 'pointer',
                            background: selectedGuest?.id === guest.id ? 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)' : 'white',
                            borderColor: selectedGuest?.id === guest.id ? '#667eea' : '#dee2e6',
                            borderWidth: selectedGuest?.id === guest.id ? '2px' : '1px',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => setSelectedGuest(guest)}
                        >
                          <Group gap="xs" wrap="nowrap">
                            <Avatar color={getTierColor(guest.tier)} radius="sm" size="md">
                              <Text size="xs" fw={700}>{guest.avatar}</Text>
                            </Avatar>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Text fw={600} size="xs" truncate>{guest.full_name}</Text>
                              <Group gap={4} mt={2}>
                                <Badge size="xs" color={getTierColor(guest.tier)} variant="dot">{guest.tier}</Badge>
                                <Badge size="xs" color={guest.status === 'In-House' ? 'green' : 'gray'} variant="outline">
                                  {guest.status === 'In-House' ? 'In' : 'Out'}
                                </Badge>
                              </Group>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <Text size="xs" fw={600} c="dimmed">{guest.ltv_score}</Text>
                              <Text size="10px" c="dimmed">LTV</Text>
                            </div>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </ScrollArea>
                </Stack>
              </Grid.Col>

              {/* RIGHT: Guest Detail - Scrollable (65%) */}
              <Grid.Col span={{ base: 12, lg: 8 }} style={{ height: '100%' }}>
                {!selectedGuest ? (
                  <Paper p="xl" radius="md" withBorder style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Stack align="center" gap="sm">
                      <ThemeIcon size={60} radius="xl" variant="light" color="violet">
                        <IconUserStar size={30} />
                      </ThemeIcon>
                      <div style={{ textAlign: 'center' }}>
                        <Text size="lg" fw={600} c="dimmed">Select a guest</Text>
                        <Text size="xs" c="dimmed" mt={4}>
                          View 360° profile and AI recommendations
                        </Text>
                      </div>
                    </Stack>
                  </Paper>
                ) : (
                  <ScrollArea style={{ height: '100%' }} type="auto">
                    <Stack gap="xs">
                      {/* Compact Profile Header */}
                      <Paper p="md" radius="md" withBorder style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        <Group justify="space-between" wrap="nowrap">
                          <Group gap="sm">
                            <Avatar size={50} radius="md" style={{ border: '2px solid white' }}>
                              <Text size="lg" fw={700}>{selectedGuest.avatar}</Text>
                            </Avatar>
                            <div>
                              <Text size="md" fw={700}>{selectedGuest.full_name}</Text>
                              <Group gap={4} mt={2}>
                                <Badge size="xs" color={getTierColor(selectedGuest.tier)} variant="white" leftSection={<IconDiamond size={10} />}>
                                  {selectedGuest.tier}
                                </Badge>
                                <Badge size="xs" color={selectedGuest.status === 'In-House' ? 'green' : 'gray'} variant="white">
                                  {selectedGuest.status}
                                </Badge>
                              </Group>
                              <Group gap="sm" mt={6}>
                                <Group gap={4}>
                                  <IconMail size={12} />
                                  <Text size="xs">{selectedGuest.email}</Text>
                                </Group>
                                <Group gap={4}>
                                  <IconPhone size={12} />
                                  <Text size="xs">{selectedGuest.phone_number}</Text>
                                </Group>
                              </Group>
                            </div>
                          </Group>
                          <RingProgress
                            size={70}
                            thickness={6}
                            sections={[{ value: selectedGuest.ltv_score, color: 'white' }]}
                            label={<Text c="white" fw={700} ta="center" size="sm">{selectedGuest.ltv_score}</Text>}
                          />
                        </Group>
                        <SimpleGrid cols={3} mt="sm" spacing="xs">
                          <div style={{ textAlign: 'center' }}>
                            <Text size="xs" opacity={0.85}>Stays</Text>
                            <Text size="lg" fw={700}>{selectedGuest.total_stays}</Text>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <Text size="xs" opacity={0.85}>Total Value</Text>
                            <Text size="sm" fw={700}>{formatCurrency(selectedGuest.total_spend)}</Text>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <Text size="xs" opacity={0.85}>Avg/Stay</Text>
                            <Text size="sm" fw={700}>{formatCurrency(selectedGuest.total_spend / selectedGuest.total_stays)}</Text>
                          </div>
                        </SimpleGrid>
                      </Paper>

                      {/* AI Engine - Compact */}
                      <Paper p="sm" radius="md" withBorder style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}>
                        <Group gap={6} mb="xs">
                          <ThemeIcon size="sm" radius="sm" variant="light" color="yellow">
                            <IconSparkles size={14} />
                          </ThemeIcon>
                          <Text size="sm" fw={700} c="dark">AI Recommendations</Text>
                        </Group>
                        <Stack gap={6}>
                          {selectedGuest.ai_suggestions.map((suggestion, idx) => (
                            <Paper key={idx} p="xs" radius="sm" withBorder bg="white">
                              <Group gap={6} wrap="nowrap">
                                <ThemeIcon size="sm" radius="sm" color={suggestion.color} variant="light">
                                  <suggestion.icon size={12} />
                                </ThemeIcon>
                                <Text size="xs" fw={500} style={{ flex: 1 }}>{suggestion.text}</Text>
                              </Group>
                            </Paper>
                          ))}
                        </Stack>
                      </Paper>

                      {/* Tabs untuk Insights, Preferences, History */}
                      <Paper radius="md" withBorder>
                        <Tabs defaultValue="insights" variant="pills">
                          <Tabs.List p="xs" style={{ borderBottom: '1px solid #dee2e6' }}>
                            <Tabs.Tab value="insights" leftSection={<IconBolt size={14} />} style={{ fontSize: '0.75rem' }}>
                              Insights
                            </Tabs.Tab>
                            <Tabs.Tab value="preferences" leftSection={<IconTag size={14} />} style={{ fontSize: '0.75rem' }}>
                              Preferences
                            </Tabs.Tab>
                            <Tabs.Tab value="history" leftSection={<IconHistory size={14} />} style={{ fontSize: '0.75rem' }}>
                              History
                            </Tabs.Tab>
                          </Tabs.List>

                          <Tabs.Panel value="insights" p="sm">
                            <Stack gap={6}>
                              {selectedGuest.behavioral_insights.map((insight, idx) => (
                                <Paper key={idx} p="xs" radius="sm" bg="#f8f9fa">
                                  <Text size="xs" c="dimmed">• {insight}</Text>
                                </Paper>
                              ))}
                            </Stack>
                          </Tabs.Panel>

                          <Tabs.Panel value="preferences" p="sm">
                            <Group gap={6}>
                              {selectedGuest.preferences.map((pref, idx) => (
                                <Badge key={idx} size="sm" variant="light" color="grape">{pref}</Badge>
                              ))}
                            </Group>
                          </Tabs.Panel>

                          <Tabs.Panel value="history" p="sm">
                            <Timeline active={-1} bulletSize={16} lineWidth={2} color="teal">
                              {selectedGuest.recent_history.map((stay, idx) => (
                                <Timeline.Item key={idx} bullet={<IconBed size={10} />}>
                                  <Group justify="space-between">
                                    <div>
                                      <Text size="xs" fw={500}>{stay.room}</Text>
                                      <Text size="10px" c="dimmed">
                                        {new Date(stay.date).toLocaleDateString('id-ID')} • {stay.nights}n
                                      </Text>
                                    </div>
                                    <Text size="xs" fw={600} c="teal">{formatCurrency(stay.spend)}</Text>
                                  </Group>
                                </Timeline.Item>
                              ))}
                            </Timeline>
                          </Tabs.Panel>
                        </Tabs>
                      </Paper>
                    </Stack>
                  </ScrollArea>
                )}
              </Grid.Col>
            </Grid>
          </Box>
        </Container>
      </div>
    </div>
  );
}