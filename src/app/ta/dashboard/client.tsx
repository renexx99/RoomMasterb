'use client';

import {
  Box,
  Text,
  Paper,
  Group,
  Stack,
  SimpleGrid,
  Progress,
  Table,
  Badge,
} from '@mantine/core';
import {
  IconCalendarStats,
  IconCircleCheck,
  IconLogin,
  IconCircleX,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { TaDashboardData } from './page';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
}

function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <Paper
      p="lg"
      radius="md"
      style={{
        border: '1px solid #e5e5e5',
        background: '#ffffff',
      }}
    >
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text size="xs" tt="uppercase" fw={600} c="dimmed" style={{ letterSpacing: '0.04em' }}>
            {label}
          </Text>
          <Text size="xl" fw={800} style={{ color: '#1a1a1a', fontSize: '2rem', lineHeight: 1 }}>
            {value}
          </Text>
        </Stack>
        <Box
          style={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} stroke={1.5} />
        </Box>
      </Group>
    </Paper>
  );
}

function getStatusBadge(paymentStatus: string, checkedInAt: string | null, checkedOutAt: string | null) {
  if (paymentStatus === 'cancelled') {
    return <Badge variant="outline" color="dark" size="sm" radius="sm">Cancelled</Badge>;
  }
  if (checkedOutAt) {
    return <Badge variant="light" color="gray" size="sm" radius="sm">Checked Out</Badge>;
  }
  if (checkedInAt) {
    return <Badge variant="filled" color="dark" size="sm" radius="sm">Checked In</Badge>;
  }
  if (paymentStatus === 'paid') {
    return <Badge variant="dot" color="dark" size="sm" radius="sm">Confirmed</Badge>;
  }
  return <Badge variant="default" size="sm" radius="sm">Pending</Badge>;
}

export default function TaDashboardClient({ data }: { data: TaDashboardData }) {
  const { stats, recentReservations, allotment } = data;
  const allotmentPct = allotment.totalAllotted > 0
    ? Math.round((allotment.used / allotment.totalAllotted) * 100)
    : 0;

  return (
    <Box p="xl">
      {/* Header */}
      <Stack gap={2} mb="xl">
        <Text size="xl" fw={800} style={{ color: '#1a1a1a' }}>
          Dashboard
        </Text>
        <Text size="sm" c="dimmed">
          {stats.hotelName} — Last 30 days overview
        </Text>
      </Stack>

      {/* Stat Cards */}
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md" mb="xl">
        <StatCard label="Total Bookings" value={stats.totalBookings} icon={IconCalendarStats} />
        <StatCard label="Confirmed" value={stats.confirmedBookings} icon={IconCircleCheck} />
        <StatCard label="Checked In" value={stats.checkedInBookings} icon={IconLogin} />
        <StatCard label="Cancelled" value={stats.cancelledBookings} icon={IconCircleX} />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {/* Allotment Card */}
        <Paper
          p="lg"
          radius="md"
          style={{
            border: '1px solid #e5e5e5',
            background: '#ffffff',
          }}
        >
          <Text size="sm" fw={700} mb="md" style={{ color: '#1a1a1a' }}>
            Allotment Usage
          </Text>
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed">
              {allotment.used} of {allotment.totalAllotted} rooms used
            </Text>
            <Text size="xs" fw={700} style={{ color: '#1a1a1a' }}>
              {allotmentPct}%
            </Text>
          </Group>
          <Progress
            value={allotmentPct}
            color="dark"
            radius="xl"
            size="lg"
            style={{ background: '#f0f0f0' }}
          />
          <Group justify="space-between" mt="md">
            <Stack gap={0}>
              <Text size="xs" c="dimmed">Remaining</Text>
              <Text size="lg" fw={800} style={{ color: '#1a1a1a' }}>{allotment.remaining}</Text>
            </Stack>
            <Stack gap={0} style={{ textAlign: 'right' }}>
              <Text size="xs" c="dimmed">Daily Limit</Text>
              <Text size="lg" fw={800} style={{ color: '#1a1a1a' }}>{allotment.totalAllotted}</Text>
            </Stack>
          </Group>
        </Paper>

        {/* Quick Info */}
        <Paper
          p="lg"
          radius="md"
          style={{
            border: '1px solid #e5e5e5',
            background: '#ffffff',
          }}
        >
          <Text size="sm" fw={700} mb="md" style={{ color: '#1a1a1a' }}>
            Agent Information
          </Text>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Property</Text>
              <Text size="sm" fw={600}>{stats.hotelName}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Booking Source</Text>
              <Badge variant="filled" color="dark" size="sm" radius="sm">Travel Agent</Badge>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Contract Rate</Text>
              <Text size="sm" fw={600} c="dimmed">Contact Revenue Mgr.</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Payment Terms</Text>
              <Text size="sm" fw={600}>Net 30 Days</Text>
            </Group>
          </Stack>
        </Paper>
      </SimpleGrid>

      {/* Recent Reservations */}
      <Paper
        p="lg"
        radius="md"
        mt="md"
        style={{
          border: '1px solid #e5e5e5',
          background: '#ffffff',
        }}
      >
        <Text size="sm" fw={700} mb="md" style={{ color: '#1a1a1a' }}>
          Recent Reservations
        </Text>

        {recentReservations.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            No reservations yet. Start by checking availability and booking a room.
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={600}>
            <Table verticalSpacing="sm" horizontalSpacing="md" striped={false}>
              <Table.Thead>
                <Table.Tr style={{ borderBottom: '2px solid #e5e5e5' }}>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Guest</Table.Th>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Room</Table.Th>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Check-in</Table.Th>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Check-out</Table.Th>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {recentReservations.map((res: any) => (
                  <Table.Tr key={res.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <Table.Td>
                      <Text size="sm" fw={600}>{res.guest?.full_name || '—'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {res.room?.room_number || '—'}
                        {res.room?.room_type?.name ? ` · ${res.room.room_type.name}` : ''}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{dayjs(res.check_in_date).format('DD MMM YYYY')}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{dayjs(res.check_out_date).format('DD MMM YYYY')}</Text>
                    </Table.Td>
                    <Table.Td>
                      {getStatusBadge(res.payment_status, res.checked_in_at, res.checked_out_at)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>
    </Box>
  );
}
