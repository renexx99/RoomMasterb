'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Text,
  Paper,
  Table,
  Badge,
  Button,
  Group,
  Stack,
  TextInput,
} from '@mantine/core';
import { IconSearch, IconFilePlus } from '@tabler/icons-react';
import { RoomTypeAvailability } from './page';

interface Props {
  availability: RoomTypeAvailability[];
  hotelName: string;
}

export default function TaAvailabilityClient({ availability, hotelName }: Props) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [search, setSearch] = useState('');

  const filtered = availability.filter((rt) =>
    rt.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleBook = (roomTypeId: string, roomTypeName: string) => {
    const params = new URLSearchParams();
    params.set('roomTypeId', roomTypeId);
    params.set('roomTypeName', roomTypeName);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    router.push(`/ta/book-room?${params.toString()}`);
  };

  return (
    <Box p="xl">
      {/* Header */}
      <Stack gap={2} mb="xl">
        <Text size="xl" fw={800} style={{ color: '#1a1a1a' }}>
          Availability
        </Text>
        <Text size="sm" c="dimmed">
          {hotelName} — Room type availability
        </Text>
      </Stack>

      {/* Filters */}
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
            type="date"
            label="Check-in Date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.currentTarget.value)}
            size="sm"
            radius="md"
            styles={{
              input: { background: '#fafafa', border: '1px solid #e0e0e0', color: '#1a1a1a' },
              label: { fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 },
            }}
            style={{ flex: '1 1 160px' }}
          />
          <TextInput
            type="date"
            label="Check-out Date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.currentTarget.value)}
            size="sm"
            radius="md"
            styles={{
              input: { background: '#fafafa', border: '1px solid #e0e0e0', color: '#1a1a1a' },
              label: { fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 },
            }}
            style={{ flex: '1 1 160px' }}
          />
          <TextInput
            placeholder="Search room type..."
            leftSection={<IconSearch size={14} stroke={1.5} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            size="sm"
            radius="md"
            label="Search"
            styles={{
              input: { background: '#fafafa', border: '1px solid #e0e0e0', color: '#1a1a1a' },
              label: { fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 },
            }}
            style={{ flex: '1 1 200px' }}
          />
        </Group>
      </Paper>

      {/* Data Table */}
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
            No room types found.
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={700}>
            <Table verticalSpacing="sm" horizontalSpacing="lg">
              <Table.Thead>
                <Table.Tr style={{ borderBottom: '2px solid #e5e5e5', background: '#fafafa' }}>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Room Type</Table.Th>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Capacity</Table.Th>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bed Type</Table.Th>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>View</Table.Th>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Available</Table.Th>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contract Rate</Table.Th>
                  <Table.Th style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((rt) => (
                  <Table.Tr key={rt.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <Table.Td>
                      <Text size="sm" fw={600} style={{ color: '#1a1a1a' }}>{rt.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{rt.capacity} pax</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{rt.bed_type || '—'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{rt.view_type || '—'}</Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      <Badge
                        variant={rt.availableRooms > 0 ? 'filled' : 'outline'}
                        color="dark"
                        size="md"
                        radius="sm"
                      >
                        {rt.availableRooms} / {rt.totalRooms}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed" fs="italic">Contract Rate</Text>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="filled"
                        color="dark"
                        radius="md"
                        leftSection={<IconFilePlus size={14} />}
                        disabled={rt.availableRooms === 0}
                        onClick={() => handleBook(rt.id, rt.name)}
                        styles={{
                          root: {
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }
                        }}
                      >
                        Book
                      </Button>
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
