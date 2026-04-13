// src/app/manager/guests/components/GuestDetailPanel.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Paper, Group, Avatar, Text, Badge, SimpleGrid, 
  Stack, ThemeIcon, Button, ScrollArea, Timeline, Grid, Box,
  Card, Progress
} from '@mantine/core';
import { 
  IconMail, IconPhone, IconDiamond, IconSparkles, 
  IconHistory, IconTag, IconBolt, IconPencil, IconBed, IconChartBar, IconCalendar,
  IconStar, IconTrophy, IconArrowUp, IconGift, IconTrash
} from '@tabler/icons-react';
import { Guest } from '@/core/types/database';
import { getGuestHistory } from '../actions';
import {
  getTierColor, formatPoints, getTierProgress, getTierBenefits, getTierLabel,
  DEFAULT_LOYALTY_CONFIG
} from '@/core/utils/loyalty';

interface Props {
  guest: Guest;
  onEdit: () => void;
  onDelete: () => void;
}

export function GuestDetailPanel({ guest, onEdit, onDelete }: Props) {
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    if (guest.id) {
        setHistory([]); 
        setHistoryLoaded(false);
        getGuestHistory(guest.id).then((data) => {
          setHistory(data);
          setHistoryLoaded(true);
        });
    }
  }, [guest.id]);

  // Compute stats from actual reservation history data
  const computedTotalStays = history.length;
  const computedTotalSpend = history.reduce((sum: number, h: any) => sum + (Number(h.total_price) || 0), 0);
  const computedLastVisit = history.length > 0 ? history[0]?.check_out_date || history[0]?.check_in_date : null;

  const preferences: string[] = (guest.preferences as any)?.tags || [];
  const progress = getTierProgress(guest.loyalty_points || 0, DEFAULT_LOYALTY_CONFIG);

  const aiSuggestions = [
    { text: 'Propose Suite upgrade (78% probability)', color: 'violet', icon: IconSparkles },
    { text: 'History of AC noise complaints - assign quiet room', color: 'red', icon: IconBolt },
  ];

  return (
    <Paper radius="md" withBorder h="100%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        <ScrollArea style={{ flex: 1 }} type="auto">
            
            {/* Header Profile - Manager Blue Gradient */}
            <Box p="md" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' }}>
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group gap="md" align="flex-start" wrap="nowrap">
                        <Avatar size={60} radius="md" color="white" variant="filled" styles={{ placeholder: { color: '#2563eb' } }}>
                            <Text size="xl" fw={700}>{guest.full_name.charAt(0)}</Text>
                        </Avatar>
                        <div>
                            <Text fz={20} fw={700} lh={1.1} mb={4}>{guest.title} {guest.full_name}</Text>
                            
                            <Group gap="xs" mb="sm">
                                <Badge color="white" c="blue.9" variant="white" leftSection={<IconDiamond size={12}/>}>
                                    {getTierLabel(guest.loyalty_tier)}
                                </Badge>
                                <Badge color="white" c="blue.8" variant="filled" leftSection={<IconStar size={12}/>}>
                                    {formatPoints(guest.loyalty_points || 0)} pts
                                </Badge>
                            </Group>

                            <Stack gap={4}>
                                <Group gap={6} style={{ opacity: 0.9 }}>
                                    <IconMail size={16} />
                                    <Text size="sm">{guest.email}</Text>
                                </Group>
                                <Group gap={6} style={{ opacity: 0.9 }}>
                                    <IconPhone size={16} />
                                    <Text size="sm">{guest.phone_number}</Text>
                                </Group>
                            </Stack>
                        </div>
                    </Group>
                    <Group gap="sm">
                        <Button 
                            variant="white" 
                            color="blue" 
                            size="xs" 
                            leftSection={<IconPencil size={14}/>}
                            onClick={onEdit}
                            style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        >
                            Edit
                        </Button>
                        <Button 
                            variant="filled" 
                            color="red.7" 
                            size="xs" 
                            leftSection={<IconTrash size={14}/>}
                            onClick={onDelete}
                            style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        >
                            Delete
                        </Button>
                    </Group>
                </Group>

                {/* Stats Bar */}
                <SimpleGrid cols={4} mt="md" spacing="sm">
                    <Box style={{ borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                        <Text size="xs" tt="uppercase" fw={700} style={{ opacity: 0.7 }}>Total Stays</Text>
                        <Text size="lg" fw={700}>{historyLoaded ? `${computedTotalStays}x` : '...'}</Text>
                    </Box>
                    <Box style={{ borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                        <Text size="xs" tt="uppercase" fw={700} style={{ opacity: 0.7 }}>Total Spend</Text>
                        <Text size="lg" fw={700}>{historyLoaded ? `Rp ${computedTotalSpend.toLocaleString('id-ID')}` : '...'}</Text>
                    </Box>
                    <Box style={{ borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                        <Text size="xs" tt="uppercase" fw={700} style={{ opacity: 0.7 }}>Loyalty Points</Text>
                        <Text size="lg" fw={700}>{formatPoints(guest.loyalty_points || 0)}</Text>
                    </Box>
                    <Box>
                        <Text size="xs" tt="uppercase" fw={700} style={{ opacity: 0.7 }}>Last Visit</Text>
                        <Text size="lg" fw={700}>
                            {historyLoaded
                              ? (computedLastVisit ? new Date(computedLastVisit).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-')
                              : '...'}
                        </Text>
                    </Box>
                </SimpleGrid>
            </Box>

            {/* Body Content */}
            <Box p="lg">
                <Grid gutter="lg">
                    {/* Left Col: Loyalty, AI & Preferences */}
                    <Grid.Col span={{ base: 12, md: 5 }}>
                        <Stack gap="md">

                            {/* Loyalty Status Card */}
                            <Card padding="md" radius="md" withBorder bg="blue.0" style={{ borderColor: 'var(--mantine-color-blue-2)' }}>
                                <Group mb="sm">
                                    <ThemeIcon color={getTierColor(guest.loyalty_tier)} variant="light"><IconTrophy size={18}/></ThemeIcon>
                                    <Text fw={700} size="sm" c="blue.9">Loyalty Status</Text>
                                </Group>

                                <Group justify="space-between" mb="xs">
                                    <Badge size="lg" color={getTierColor(guest.loyalty_tier)} variant="filled" leftSection={<IconDiamond size={14}/>}>
                                        {getTierLabel(guest.loyalty_tier)} Tier
                                    </Badge>
                                    <Text size="sm" fw={700} c="blue.8">{formatPoints(guest.loyalty_points || 0)} pts</Text>
                                </Group>

                                {progress.nextTier && (
                                    <Stack gap={4} mt="xs">
                                        <Group justify="space-between">
                                            <Text size="xs" c="dimmed">Progress to {progress.nextTier}</Text>
                                            <Text size="xs" fw={600} c="blue.7">{progress.progressPercent}%</Text>
                                        </Group>
                                        <Progress value={progress.progressPercent} size="md" radius="xl" color={getTierColor(guest.loyalty_tier)} />
                                        <Text size="xs" c="dimmed" ta="right">
                                            <IconArrowUp size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
                                            {' '}{formatPoints(progress.pointsToNextTier || 0)} pts needed
                                        </Text>
                                    </Stack>
                                )}

                                {/* Tier Benefits */}
                                <Box mt="sm" pt="sm" style={{ borderTop: '1px solid var(--mantine-color-blue-2)' }}>
                                    <Group gap={4} mb={4}>
                                        <IconGift size={14} color="var(--mantine-color-blue-7)" />
                                        <Text size="xs" fw={600} c="blue.7">Current Benefits</Text>
                                    </Group>
                                    <Group gap={4}>
                                        {getTierBenefits(guest.loyalty_tier || 'bronze').map((benefit, i) => (
                                            <Badge key={i} size="xs" variant="light" color="blue" radius="sm">{benefit}</Badge>
                                        ))}
                                    </Group>
                                </Box>
                            </Card>

                            {/* AI Recommendations */}
                            <Card padding="md" radius="md" withBorder bg="violet.0" style={{ borderColor: 'var(--mantine-color-violet-2)' }}>
                                <Group mb="sm">
                                    <ThemeIcon color="violet" variant="light"><IconSparkles size={18}/></ThemeIcon>
                                    <Text fw={700} size="sm" c="violet.9">AI Recommendation</Text>
                                </Group>
                                <Stack gap="xs">
                                    {aiSuggestions.map((s, idx) => (
                                        <Paper key={idx} p="xs" radius="sm" bg="white" withBorder>
                                            <Group gap="xs" align="flex-start" wrap="nowrap">
                                                <ThemeIcon color={s.color} size="sm" variant="transparent" mt={2}><s.icon size={16}/></ThemeIcon>
                                                <Text size="sm" c="dark.7" style={{ lineHeight: 1.4 }}>{s.text}</Text>
                                            </Group>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Card>

                            {/* Preferences */}
                            <Card padding="md" radius="md" withBorder>
                                <Group mb="sm">
                                    <ThemeIcon color="grape" variant="light"><IconTag size={18}/></ThemeIcon>
                                    <Text fw={700} size="sm">Preferences</Text>
                                </Group>
                                <Group gap="xs">
                                    {preferences.length > 0 ? preferences.map((tag, i) => (
                                        <Badge key={i} size="md" variant="light" color="grape" radius="sm">{tag}</Badge>
                                    )) : <Text c="dimmed" size="sm" fs="italic">No preferences recorded.</Text>}
                                </Group>
                            </Card>
                        </Stack>
                    </Grid.Col>

                    {/* Right Col: History */}
                    <Grid.Col span={{ base: 12, md: 7 }}>
                        <Card padding="md" radius="md" withBorder h="100%">
                            <Group mb="lg" justify="space-between">
                                <Group gap="xs">
                                    <ThemeIcon color="blue" variant="light"><IconHistory size={18}/></ThemeIcon>
                                    <Text fw={700} size="sm">Stay History</Text>
                                </Group>
                                <Badge variant="light" color="gray">{history.length} Visits</Badge>
                            </Group>
                            
                            {history.length > 0 ? (
                                <Timeline active={-1} bulletSize={30} lineWidth={2} color="blue">
                                    {history.map((h) => (
                                        <Timeline.Item 
                                            key={h.id} 
                                            bullet={<IconBed size={14}/>} 
                                            title={
                                                <Text size="sm" fw={600}>
                                                    Room {h.room?.room_number} <Text span c="dimmed" fw={400}>({h.room?.room_type?.name})</Text>
                                                </Text>
                                            }
                                        >
                                            <Text c="dimmed" size="xs" mt={4} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <IconCalendar size={12} />
                                                {new Date(h.check_in_date).toLocaleDateString('en-US')} — {new Date(h.check_out_date).toLocaleDateString('en-US')}
                                            </Text>
                                            <Badge size="sm" color="blue" variant="light" mt="xs">
                                                Total: Rp {h.total_price?.toLocaleString('id-ID')}
                                            </Badge>
                                        </Timeline.Item>
                                    ))}
                                </Timeline>
                            ) : (
                                <Stack align="center" justify="center" py="xl" gap="xs">
                                    <IconChartBar size={40} color="var(--mantine-color-gray-4)" />
                                    <Text c="dimmed" size="sm">No stay history found.</Text>
                                </Stack>
                            )}
                        </Card>
                    </Grid.Col>
                </Grid>
            </Box>
        </ScrollArea>
    </Paper>
  );
}