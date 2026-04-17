'use client';

import { useState } from 'react';
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
} from '@mantine/core';
import { IconSearch, IconFilePlus } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { TaReservationRow } from './page';

interface Props {
  reservations: TaReservationRow[];
  hotelName: string;
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

export default function TaReservationsClient({ reservations, hotelName }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = reservations.filter((res) => {
    const q = search.toLowerCase();
    return (
      (res.guest?.full_name || '').toLowerCase().includes(q) ||
      (res.room?.room_number || '').toLowerCase().includes(q) ||
      res.id.toLowerCase().includes(q)
    );
  });

  return (
    <Box p="xl">
      {/* Header */}
      <Group justify="space-between" align="flex-end" mb="xl" wrap="wrap">
        <Stack gap={2}>
          <Text size="xl" fw={800} style={{ color: '#1a1a1a' }}>
            Reservations
          </Text>
          <Text size="sm" c="dimmed">
            {hotelName} — {reservations.length} total reservations
          </Text>
        </Stack>
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

      {/* Search */}
      <Paper
        p="md"
        radius="md"
        mb="md"
        style={{
          border: '1px solid #e5e5e5',
          background: '#ffffff',
        }}
      >
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
        />
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
            {search ? 'No reservations match your search.' : 'No reservations found.'}
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="sm" horizontalSpacing="lg">
              <Table.Thead>
                <Table.Tr style={{ borderBottom: '2px solid #e5e5e5', background: '#fafafa' }}>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confirmation #</Table.Th>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Guest</Table.Th>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Room</Table.Th>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Check-in</Table.Th>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Check-out</Table.Th>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</Table.Th>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Created</Table.Th>
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
