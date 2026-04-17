// src/app/manager/loyalty/client.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Container, Paper, Group, Text, Stack, Box, Badge, Avatar,
  SimpleGrid, ThemeIcon, Table, ScrollArea, TextInput, Select,
  Modal, NumberInput, Textarea, Button, Card, Progress,
  Tabs, ActionIcon, Tooltip, Divider, Grid, RingProgress, Center,
} from '@mantine/core';
import {
  IconStar, IconTrophy, IconCoin, IconUsers,
  IconSearch, IconAdjustments, IconPlus, IconMinus,
  IconArrowUp, IconHistory, IconSettings, IconChartBar,
  IconDiamond, IconMedal, IconCrown, IconShieldCheck,
  IconFilter,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Guest } from '@/core/types/database';
import {
  getTierColor, formatPoints, getTierProgress, getTierBenefits, getTierLabel,
  type LoyaltyConfigValues, DEFAULT_LOYALTY_CONFIG,
} from '@/core/utils/loyalty';
import { adjustGuestPoints, saveLoyaltyConfig } from './actions';

interface Props {
  guests: Guest[];
  config: LoyaltyConfigValues | null;
  pointsLog: any[];
  hotelId: string;
  userId: string;
}

function getTierIcon(tier: string) {
  switch (tier?.toLowerCase()) {
    case 'diamond': return IconDiamond;
    case 'platinum': return IconCrown;
    case 'gold': return IconMedal;
    case 'silver': return IconShieldCheck;
    default: return IconStar;
  }
}

export default function LoyaltyDashboardClient({ guests, config: initialConfig, pointsLog, hotelId, userId }: Props) {
  const config = initialConfig || DEFAULT_LOYALTY_CONFIG;
  const MAX_WIDTH = 1800;

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string | null>(null);
  const [adjustModal, setAdjustModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [adjustPoints, setAdjustPoints] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [configModal, setConfigModal] = useState(false);
  const [editConfig, setEditConfig] = useState<LoyaltyConfigValues>(config);

  // Filtered guests
  const filteredGuests = useMemo(() => {
    let result = [...guests];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(g =>
        g.full_name.toLowerCase().includes(lower) ||
        g.email.toLowerCase().includes(lower)
      );
    }
    if (filterTier) {
      result = result.filter(g => g.loyalty_tier === filterTier);
    }
    return result;
  }, [guests, searchTerm, filterTier]);

  // Stats
  const stats = useMemo(() => {
    const tierCounts = { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0 };
    let totalPoints = 0;
    guests.forEach(g => {
      const tier = g.loyalty_tier || 'bronze';
      if (tier in tierCounts) tierCounts[tier as keyof typeof tierCounts]++;
      totalPoints += g.loyalty_points || 0;
    });
    return {
      totalMembers: guests.length,
      totalPoints,
      tierCounts,
      premiumMembers: tierCounts.gold + tierCounts.platinum + tierCounts.diamond,
    };
  }, [guests]);

  // Handle manual point adjustment
  const handleAdjustPoints = async () => {
    if (!selectedGuest || adjustPoints === 0 || !adjustReason.trim()) {
      notifications.show({ title: 'Error', message: 'Please fill all fields', color: 'red' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await adjustGuestPoints(selectedGuest.id, hotelId, adjustPoints, adjustReason, userId);
      if (res.error) {
        notifications.show({ title: 'Failed', message: res.error, color: 'red' });
      } else {
        notifications.show({
          title: 'Points Adjusted',
          message: `${selectedGuest.full_name}: ${adjustPoints > 0 ? '+' : ''}${adjustPoints} pts → New tier: ${res.newTier}`,
          color: 'green',
        });
        setAdjustModal(false);
        setAdjustPoints(0);
        setAdjustReason('');
        window.location.reload();
      }
    } catch {
      notifications.show({ title: 'Error', message: 'System error occurred', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle save config
  const handleSaveConfig = async () => {
    setIsSubmitting(true);
    try {
      const res = await saveLoyaltyConfig(hotelId, editConfig);
      if (res.error) {
        notifications.show({ title: 'Failed', message: res.error, color: 'red' });
      } else {
        notifications.show({ title: 'Success', message: 'Loyalty configuration saved', color: 'green' });
        setConfigModal(false);
        window.location.reload();
      }
    } catch {
      notifications.show({ title: 'Error', message: 'System error occurred', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAdjustModal = (guest: Guest) => {
    setSelectedGuest(guest);
    setAdjustPoints(0);
    setAdjustReason('');
    setAdjustModal(true);
  };

  return (
    <Box style={{ minHeight: 'calc(100vh - 70px)', background: '#f8f9fa' }}>
      <Container fluid px="lg" py="lg">
        <Box maw={MAX_WIDTH} mx="auto">

          {/* Page Header */}
          <Group justify="flex-end" mb="lg">
            <Button
              leftSection={<IconSettings size={16} />}
              variant="light"
              color="blue"
              onClick={() => {
                setEditConfig(config);
                setConfigModal(true);
              }}
            >
              Configure Rules
            </Button>
          </Group>

          {/* Overview Cards */}
          <SimpleGrid cols={{ base: 2, sm: 4 }} mb="lg">
            <Paper p="lg" radius="md" withBorder shadow="sm">
              <Group gap="sm">
                <ThemeIcon size={44} radius="md" variant="light" color="blue">
                  <IconUsers size={22} />
                </ThemeIcon>
                <div>
                  <Text size="xl" fw={700}>{stats.totalMembers}</Text>
                  <Text size="xs" c="dimmed" fw={500}>Total Members</Text>
                </div>
              </Group>
            </Paper>

            <Paper p="lg" radius="md" withBorder shadow="sm">
              <Group gap="sm">
                <ThemeIcon size={44} radius="md" variant="light" color="yellow">
                  <IconCoin size={22} />
                </ThemeIcon>
                <div>
                  <Text size="xl" fw={700}>{formatPoints(stats.totalPoints)}</Text>
                  <Text size="xs" c="dimmed" fw={500}>Total Points Issued</Text>
                </div>
              </Group>
            </Paper>

            <Paper p="lg" radius="md" withBorder shadow="sm">
              <Group gap="sm">
                <ThemeIcon size={44} radius="md" variant="light" color="violet">
                  <IconTrophy size={22} />
                </ThemeIcon>
                <div>
                  <Text size="xl" fw={700}>{stats.premiumMembers}</Text>
                  <Text size="xs" c="dimmed" fw={500}>Premium Members</Text>
                </div>
              </Group>
            </Paper>

            <Paper p="lg" radius="md" withBorder shadow="sm">
              <Group gap="xs" wrap="nowrap">
                {(['diamond', 'platinum', 'gold', 'silver', 'bronze'] as const).map(tier => (
                  <Tooltip key={tier} label={`${getTierLabel(tier)}: ${stats.tierCounts[tier]}`}>
                    <Badge
                      color={getTierColor(tier)}
                      variant={stats.tierCounts[tier] > 0 ? 'filled' : 'light'}
                      size="lg"
                      style={{ cursor: 'default' }}
                    >
                      {stats.tierCounts[tier]}
                    </Badge>
                  </Tooltip>
                ))}
              </Group>
              <Text size="xs" c="dimmed" fw={500} mt={6}>Tier Distribution</Text>
            </Paper>
          </SimpleGrid>

          {/* Main Content Tabs */}
          <Tabs defaultValue="leaderboard" variant="outline" radius="md">
            <Tabs.List mb="md">
              <Tabs.Tab value="leaderboard" leftSection={<IconTrophy size={16} />}>Leaderboard</Tabs.Tab>
              <Tabs.Tab value="activity" leftSection={<IconHistory size={16} />}>Points Activity</Tabs.Tab>
            </Tabs.List>

            {/* Leaderboard Tab */}
            <Tabs.Panel value="leaderboard">
              <Paper radius="md" withBorder shadow="sm">
                {/* Filters */}
                <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                  <Group>
                    <TextInput
                      placeholder="Search guest name or email..."
                      leftSection={<IconSearch size={14} />}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.currentTarget.value)}
                      radius="md"
                      style={{ flex: 1, maxWidth: 400 }}
                    />
                    <Select
                      placeholder="All Tiers"
                      data={['diamond', 'platinum', 'gold', 'silver', 'bronze'].map(t => ({ value: t, label: getTierLabel(t) }))}
                      value={filterTier}
                      onChange={setFilterTier}
                      clearable
                      leftSection={<IconFilter size={14} />}
                      radius="md"
                      w={160}
                    />
                  </Group>
                </Box>

                {/* Table */}
                <ScrollArea>
                  <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th w={50}>#</Table.Th>
                        <Table.Th>Guest</Table.Th>
                        <Table.Th>Tier</Table.Th>
                        <Table.Th ta="right">Points</Table.Th>
                        <Table.Th>Progress</Table.Th>
                        <Table.Th>Stays</Table.Th>
                        <Table.Th>Total Spend</Table.Th>
                        <Table.Th ta="center">Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredGuests.map((guest, index) => {
                        const progress = getTierProgress(guest.loyalty_points || 0, config);
                        const TierIcon = getTierIcon(guest.loyalty_tier);
                        return (
                          <Table.Tr key={guest.id}>
                            <Table.Td>
                              <Text size="sm" fw={600} c="dimmed">{index + 1}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="sm" wrap="nowrap">
                                <Avatar color={getTierColor(guest.loyalty_tier)} radius="xl" size="sm">
                                  {guest.full_name?.charAt(0)}
                                </Avatar>
                                <div>
                                  <Text size="sm" fw={600} truncate>{guest.full_name}</Text>
                                  <Text size="xs" c="dimmed" truncate>{guest.email}</Text>
                                </div>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                color={getTierColor(guest.loyalty_tier)}
                                variant="light"
                                leftSection={<TierIcon size={12} />}
                              >
                                {getTierLabel(guest.loyalty_tier)}
                              </Badge>
                            </Table.Td>
                            <Table.Td ta="right">
                              <Text size="sm" fw={700}>{formatPoints(guest.loyalty_points || 0)}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Stack gap={2}>
                                <Progress value={progress.progressPercent} size="sm" radius="xl" color={getTierColor(guest.loyalty_tier)} />
                                {progress.nextTier && (
                                  <Text size="10px" c="dimmed">
                                    {formatPoints(progress.pointsToNextTier || 0)} pts to {progress.nextTier}
                                  </Text>
                                )}
                              </Stack>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{guest.total_stays || 0}x</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">Rp {Number(guest.total_spend || 0).toLocaleString('id-ID')}</Text>
                            </Table.Td>
                            <Table.Td ta="center">
                              <Group gap={4} justify="center">
                                <Tooltip label="Add Points">
                                  <ActionIcon
                                    variant="light"
                                    color="green"
                                    size="sm"
                                    onClick={() => {
                                      openAdjustModal(guest);
                                      setAdjustPoints(100);
                                    }}
                                  >
                                    <IconPlus size={14} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Deduct Points">
                                  <ActionIcon
                                    variant="light"
                                    color="red"
                                    size="sm"
                                    onClick={() => {
                                      openAdjustModal(guest);
                                      setAdjustPoints(-100);
                                    }}
                                  >
                                    <IconMinus size={14} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                      {filteredGuests.length === 0 && (
                        <Table.Tr>
                          <Table.Td colSpan={8}>
                            <Center py="xl">
                              <Text c="dimmed">No guests found</Text>
                            </Center>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>
            </Tabs.Panel>

            {/* Activity Tab */}
            <Tabs.Panel value="activity">
              <Paper radius="md" withBorder shadow="sm">
                <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                  <Group>
                    <IconHistory size={18} />
                    <Text fw={700} size="sm">Recent Points Activity</Text>
                    <Badge variant="light" color="gray">{pointsLog.length} entries</Badge>
                  </Group>
                </Box>
                <ScrollArea mah={600}>
                  <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Date</Table.Th>
                        <Table.Th>Guest</Table.Th>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>Source</Table.Th>
                        <Table.Th ta="right">Points</Table.Th>
                        <Table.Th>Description</Table.Th>
                        <Table.Th>By</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {pointsLog.map((log) => (
                        <Table.Tr key={log.id}>
                          <Table.Td>
                            <Text size="xs" c="dimmed">
                              {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" fw={500}>{log.guest?.full_name || '-'}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              size="xs"
                              color={log.type === 'earn' ? 'green' : log.type === 'redeem' ? 'orange' : 'blue'}
                              variant="light"
                            >
                              {log.type}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge size="xs" variant="outline" color="gray">{log.source}</Badge>
                          </Table.Td>
                          <Table.Td ta="right">
                            <Text
                              size="sm"
                              fw={700}
                              c={log.points > 0 ? 'green' : 'red'}
                            >
                              {log.points > 0 ? '+' : ''}{formatPoints(log.points)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed" truncate maw={200}>{log.description || '-'}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">{log.creator?.full_name || 'System'}</Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                      {pointsLog.length === 0 && (
                        <Table.Tr>
                          <Table.Td colSpan={7}>
                            <Center py="xl">
                              <Stack align="center" gap="xs">
                                <IconHistory size={32} color="var(--mantine-color-gray-4)" />
                                <Text c="dimmed" size="sm">No points activity yet</Text>
                              </Stack>
                            </Center>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>
            </Tabs.Panel>
          </Tabs>

        </Box>
      </Container>

      {/* Adjust Points Modal */}
      <Modal
        opened={adjustModal}
        onClose={() => setAdjustModal(false)}
        title={
          <Group gap="xs">
            <IconAdjustments size={20} />
            <Text fw={700}>Adjust Points</Text>
          </Group>
        }
        centered
      >
        {selectedGuest && (
          <Stack gap="md">
            <Paper p="md" bg="gray.0" radius="md">
              <Group gap="sm">
                <Avatar color={getTierColor(selectedGuest.loyalty_tier)} radius="xl" size="md">
                  {selectedGuest.full_name?.charAt(0)}
                </Avatar>
                <div>
                  <Text fw={600}>{selectedGuest.full_name}</Text>
                  <Group gap="xs">
                    <Badge size="sm" color={getTierColor(selectedGuest.loyalty_tier)} variant="light">
                      {getTierLabel(selectedGuest.loyalty_tier)}
                    </Badge>
                    <Text size="xs" c="dimmed">{formatPoints(selectedGuest.loyalty_points || 0)} pts</Text>
                  </Group>
                </div>
              </Group>
            </Paper>

            <NumberInput
              label="Points Adjustment"
              description="Positive to add, negative to deduct"
              value={adjustPoints}
              onChange={(v) => setAdjustPoints(Number(v) || 0)}
              min={-(selectedGuest.loyalty_points || 0)}
              step={50}
            />

            <Textarea
              label="Reason"
              placeholder="e.g., VIP compensation, service recovery, promotion..."
              required
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.currentTarget.value)}
              minRows={2}
            />

            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={() => setAdjustModal(false)} disabled={isSubmitting}>Cancel</Button>
              <Button
                onClick={handleAdjustPoints}
                loading={isSubmitting}
                color={adjustPoints >= 0 ? 'green' : 'red'}
                leftSection={adjustPoints >= 0 ? <IconPlus size={16} /> : <IconMinus size={16} />}
              >
                {adjustPoints >= 0 ? 'Add' : 'Deduct'} {Math.abs(adjustPoints)} pts
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Config Modal */}
      <Modal
        opened={configModal}
        onClose={() => setConfigModal(false)}
        title={
          <Group gap="xs">
            <IconSettings size={20} />
            <Text fw={700}>Loyalty Configuration</Text>
          </Group>
        }
        centered
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">Configure how guests earn points and the tier thresholds for this hotel.</Text>

          <Divider label="Points Earning Rules" labelPosition="left" />
          
          <SimpleGrid cols={2}>
            <NumberInput
              label="Points per Night"
              description="Points earned per night stayed"
              value={editConfig.points_per_night}
              onChange={(v) => setEditConfig({ ...editConfig, points_per_night: Number(v) || 0 })}
              min={0}
            />
            <NumberInput
              label="Completion Bonus"
              description="Bonus points on check-out"
              value={editConfig.completion_bonus}
              onChange={(v) => setEditConfig({ ...editConfig, completion_bonus: Number(v) || 0 })}
              min={0}
            />
            <NumberInput
              label="Points per Spend Unit"
              description="Points per spend threshold"
              value={editConfig.points_per_spend_unit}
              onChange={(v) => setEditConfig({ ...editConfig, points_per_spend_unit: Number(v) || 0 })}
              min={0}
            />
            <NumberInput
              label="Spend Unit Amount (Rp)"
              description="e.g., 100000 = per Rp 100K"
              value={editConfig.spend_unit_amount}
              onChange={(v) => setEditConfig({ ...editConfig, spend_unit_amount: Number(v) || 1 })}
              min={1}
              step={10000}
            />
          </SimpleGrid>

          <Divider label="Tier Thresholds (Minimum Points)" labelPosition="left" />

          <SimpleGrid cols={2}>
            <NumberInput
              label="Silver Tier"
              value={editConfig.tier_silver}
              onChange={(v) => setEditConfig({ ...editConfig, tier_silver: Number(v) || 0 })}
              min={1}
              leftSection={<Badge size="xs" color="gray" variant="filled">S</Badge>}
            />
            <NumberInput
              label="Gold Tier"
              value={editConfig.tier_gold}
              onChange={(v) => setEditConfig({ ...editConfig, tier_gold: Number(v) || 0 })}
              min={1}
              leftSection={<Badge size="xs" color="yellow" variant="filled">G</Badge>}
            />
            <NumberInput
              label="Platinum Tier"
              value={editConfig.tier_platinum}
              onChange={(v) => setEditConfig({ ...editConfig, tier_platinum: Number(v) || 0 })}
              min={1}
              leftSection={<Badge size="xs" color="cyan" variant="filled">P</Badge>}
            />
            <NumberInput
              label="Diamond Tier"
              value={editConfig.tier_diamond}
              onChange={(v) => setEditConfig({ ...editConfig, tier_diamond: Number(v) || 0 })}
              min={1}
              leftSection={<Badge size="xs" color="violet" variant="filled">D</Badge>}
            />
          </SimpleGrid>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setConfigModal(false)} disabled={isSubmitting}>Cancel</Button>
            <Button
              onClick={handleSaveConfig}
              loading={isSubmitting}
              variant="gradient"
              gradient={{ from: '#3b82f6', to: '#2563eb', deg: 135 }}
            >
              Save Configuration
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
