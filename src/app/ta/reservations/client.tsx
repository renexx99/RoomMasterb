'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Text,
  Paper,
  Table,
  Badge,
  Group,
  Stack,
  TextInput,
  Button,
  MultiSelect,
} from '@mantine/core';
import { IconSearch, IconFilePlus, IconFilter } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { TaReservationRow } from './page';

interface Props {
  reservations: TaReservationRow[];
  hotelName: string;
}

function getStatusLabel(paymentStatus: string, checkedInAt: string | null, checkedOutAt: string | null): string {
  if (paymentStatus === 'cancelled') return 'cancelled';
  if (checkedOutAt) return 'checked_out';
  if (checkedInAt) return 'checked_in';
  if (paymentStatus === 'paid') return 'confirmed';
  if (paymentStatus === 'city_ledger') return 'city_ledger';
  return 'pending';
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
  if (paymentStatus === 'city_ledger') {
    return <Badge variant="dot" color="dark" size="sm" radius="sm">City Ledger</Badge>;
  }
  return <Badge variant="default" size="sm" radius="sm">Pending</Badge>;
}

export default function TaReservationsClient({ reservations, hotelName }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return reservations.filter((res) => {
      // Text search
      const q = search.toLowerCase();
      const matchesSearch = !q || 
        (res.guest?.full_name || '').toLowerCase().includes(q) ||
        (res.room?.room_number || '').toLowerCase().includes(q) ||
        res.id.toLowerCase().includes(q);

      // Status filter
      const status = getStatusLabel(res.payment_status, res.checked_in_at, res.checked_out_at);
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(status);

      return matchesSearch && matchesStatus;
    });
  }, [reservations, search, statusFilter]);

  const thStyle = { color: '#6b7280', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase' as const, letterSpacing: '0.06em' };

  return (
    <Box p="xl">
      {/* Toolbar */}
      <Group justify="space-between" align="center" mb="md" wrap="wrap">
        <Group gap="xs">
          <Badge variant="light" color="gray" size="lg" radius="sm">
            {reservations.length} Total
          </Badge>
          <Badge variant="light" color="dark" size="lg" radius="sm">
            {filtered.length} Shown
          </Badge>
        </Group>
        <Button
          variant="filled"
          color="dark"
          radius="md"
          leftSection={<IconFilePlus size={16} />}
          onClick={() => router.push('/ta/book-room')}
          styles={{
            root: { fontWeight: 600 },
          }}
        >
          New Reservation
        </Button>
      </Group>

      {/* Search + Filter */}
      <Paper
        p="md"
        radius="md"
        mb="md"
        style={{
          border: '1px solid #e5e5e5',
          background: '#ffffff',
        }}
      >
        <Group gap="md" wrap="wrap">
          <TextInput
            placeholder="Search by guest name, room number, or confirmation ID..."
            leftSection={<IconSearch size={14} stroke={1.5} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            size="sm"
            radius="md"
            styles={{
              input: { background: '#fafafa', border: '1px solid #e0e0e0', color: '#1a1a1a' },
            }}
            style={{ flex: '1 1 300px' }}
          />
          <MultiSelect
            placeholder="Filter by status..."
            leftSection={<IconFilter size={14} stroke={1.5} />}
            data={[
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'city_ledger', label: 'City Ledger' },
              { value: 'checked_in', label: 'Checked In' },
              { value: 'checked_out', label: 'Checked Out' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            size="sm"
            radius="md"
            clearable
            styles={{
              input: { background: '#fafafa', border: '1px solid #e0e0e0', color: '#1a1a1a' },
            }}
            style={{ flex: '1 1 250px' }}
          />
        </Group>
      </Paper>

      {/* Table */}
      <Paper
        radius="md"
        style={{
          border: '1px solid #e5e5e5',
          background: '#ffffff',
          overflow: 'hidden',
        }}
      >
        {filtered.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            {search || statusFilter.length > 0 ? 'No reservations match your filters.' : 'No reservations found.'}
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="sm" horizontalSpacing="lg">
              <Table.Thead>
                <Table.Tr style={{ borderBottom: '2px solid #e5e5e5', background: '#fafafa' }}>
                  <Table.Th style={thStyle}>Confirmation #</Table.Th>
                  <Table.Th style={thStyle}>Guest</Table.Th>
                  <Table.Th style={thStyle}>Room</Table.Th>
                  <Table.Th style={thStyle}>Check-in</Table.Th>
                  <Table.Th style={thStyle}>Check-out</Table.Th>
                  <Table.Th style={thStyle}>Status</Table.Th>
                  <Table.Th style={thStyle}>Created</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((res) => (
                  <Table.Tr key={res.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <Table.Td>
                      <Text size="xs" ff="monospace" c="dimmed">
                        {res.id.slice(0, 8).toUpperCase()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={0}>
                        <Text size="sm" fw={600}>{res.guest?.full_name || '—'}</Text>
                        <Text size="xs" c="dimmed">{res.guest?.email || ''}</Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={0}>
                        <Text size="sm" fw={500}>{res.room?.room_number || '—'}</Text>
                        <Text size="xs" c="dimmed">{res.room?.room_type?.name || ''}</Text>
                      </Stack>
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
                    <Table.Td>
                      <Text size="xs" c="dimmed">{dayjs(res.created_at).format('DD MMM YY')}</Text>
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
