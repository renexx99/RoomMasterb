// src/app/fo/availability/components/AvailabilityTable.tsx
'use client';

import { Table, Paper, Badge, Text, Group, Box, ThemeIcon } from '@mantine/core';
import { IconUsers, IconCoin } from '@tabler/icons-react';
import { RoomWithDetails } from '../page';

interface Props {
  data: RoomWithDetails[];
}

export function AvailabilityTable({ data }: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'green';
      case 'occupied': return 'red';
      case 'maintenance': return 'orange';
      case 'dirty': return 'yellow'; // Menambahkan status dirty jika ada
      default: return 'gray';
    }
  };

  if (data.length === 0) {
    return (
      <Paper p="xl" withBorder ta="center" c="dimmed" radius="md">
        Tidak ada kamar yang sesuai dengan filter.
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" radius="md" withBorder style={{ overflow: 'hidden' }}>
      <Table striped highlightOnHover verticalSpacing="xs">
        <Table.Thead bg="gray.0">
          <Table.Tr>
            <Table.Th>Nomor Kamar</Table.Th>
            <Table.Th>Tipe Kamar</Table.Th>
            <Table.Th>Harga / Malam</Table.Th>
            <Table.Th>Kapasitas</Table.Th>
            <Table.Th ta="center">Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((room) => (
            <Table.Tr key={room.id}>
              <Table.Td>
                <Text fw={700} size="sm" c="dark.3">
                  {room.room_number}
                </Text>
              </Table.Td>
              <Table.Td>
                <Badge variant="dot" color="blue" size="sm">
                  {room.room_type?.name || 'Unknown'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap={4}>
                  <IconCoin size={14} style={{ opacity: 0.5 }} />
                  <Text size="sm" fw={500} c="teal.7">
                    Rp {room.room_type?.price_per_night.toLocaleString('id-ID')}
                  </Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Group gap={4}>
                  <IconUsers size={14} style={{ opacity: 0.5 }} />
                  <Text size="sm">{room.room_type?.capacity} Org</Text>
                </Group>
              </Table.Td>
              <Table.Td ta="center">
                <Badge 
                  color={getStatusColor(room.status)} 
                  variant="light" 
                  size="sm"
                  tt="uppercase"
                >
                  {room.status}
                </Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}