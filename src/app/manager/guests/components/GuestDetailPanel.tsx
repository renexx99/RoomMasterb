// src/app/manager/guests/components/GuestDetailPanel.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Paper, Group, Avatar, Text, Badge, SimpleGrid, 
  Stack, ThemeIcon, Button, ScrollArea, Timeline, Grid, Box,
  Card
} from '@mantine/core';
import { 
  IconMail, IconPhone, IconDiamond, IconSparkles, 
  IconHistory, IconTag, IconBolt, IconPencil, IconBed, IconChartBar, IconCalendar
} from '@tabler/icons-react';
import { Guest } from '@/core/types/database';
import { getGuestHistory } from '../actions';

interface Props {
  guest: Guest;
  onEdit: () => void;
}

export function GuestDetailPanel({ guest, onEdit }: Props) {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (guest.id) {
        setHistory([]); 
        getGuestHistory(guest.id).then(setHistory);
    }
  }, [guest.id]);

  const preferences: string[] = (guest.preferences as any)?.tags || [];

  const aiSuggestions = [
    { text: 'Propose Suite upgrade (78% probability)', color: 'violet', icon: IconSparkles },
    { text: 'History of AC noise complaints - assign quiet room', color: 'red', icon: IconBolt },
  ];

  return (
    <Paper radius="md" withBorder h="100%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        <ScrollArea style={{ flex: 1 }} type="auto">
            
            {/* Header Profile - Manager Blue Gradient */}
            <Box p="xl" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' }}>
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group gap="lg" align="flex-start" wrap="nowrap">
                        <Avatar size={90} radius="md" color="white" variant="filled" styles={{ placeholder: { color: '#2563eb' } }}>
                            <Text size="xl" fw={700}>{guest.full_name.charAt(0)}</Text>
                        </Avatar>
                        <div>
                            <Text fz={26} fw={700} lh={1.1} mb={4}>{guest.title} {guest.full_name}</Text>
                            
                            <Group gap="xs" mb="md">
                                <Badge color="white" c="blue.9" variant="white" leftSection={<IconDiamond size={12}/>}>
                                    {guest.loyalty_tier || 'Bronze'}
                                </Badge>
                                <Badge color="white" c="blue.8" variant="filled">
                                    Guest Profile
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
                    <Button 
                        variant="white" 
                        color="blue" 
                        size="sm" 
                        leftSection={<IconPencil size={16}/>}
                        onClick={onEdit}
                        style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    >
                        Edit Profile
                    </Button>
                </Group>

                {/* Stats Bar */}
                <SimpleGrid cols={3} mt="xl" spacing="lg">
                    <Box style={{ borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                        <Text size="xs" tt="uppercase" fw={700} style={{ opacity: 0.7 }}>Total Stays</Text>
                        <Text size="xl" fw={700}>{guest.total_stays || 0}x</Text>
                    </Box>
                    <Box style={{ borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                        <Text size="xs" tt="uppercase" fw={700} style={{ opacity: 0.7 }}>Total Spend</Text>
                        <Text size="xl" fw={700}>Rp {Number(guest.total_spend || 0).toLocaleString('id-ID')}</Text>
                    </Box>
                    <Box>
                        <Text size="xs" tt="uppercase" fw={700} style={{ opacity: 0.7 }}>Last Visit</Text>
                        <Text size="xl" fw={700}>
                            {guest.last_visit_at ? new Date(guest.last_visit_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'}
                        </Text>
                    </Box>
                </SimpleGrid>
            </Box>

            {/* Body Content */}
            <Box p="lg">
                <Grid gutter="lg">
                    {/* Left Col: AI & Preferences */}
                    <Grid.Col span={{ base: 12, md: 5 }}>
                        <Stack gap="md">
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