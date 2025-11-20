'use client';

import { Table, Paper, Badge, Text, Box } from '@mantine/core';
import { RoomWithType } from '../page';

interface Props {
  rooms: RoomWithType[];
}

export function AvailabilityTable({ rooms }: Props) {
  // Helper functions dipindahkan ke dalam komponen tabel atau utils
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'green';
      case 'occupied': return 'red';
      case 'maintenance': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Tersedia';
      case 'occupied': return 'Terisi';
      case 'maintenance': return 'Maintenance';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (rooms.length === 0) {
    return (
      <Paper shadow="sm" p="lg" radius="md" withBorder>
        <Text c="dimmed" ta="center" py="xl">
          Tidak ada kamar yang cocok dengan filter atau pencarian Anda.
        </Text>
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>No. Kamar</Table.Th>
            <Table.Th>Tipe Kamar</Table.Th>
            <Table.Th>Harga/Malam</Table.Th>
            <Table.Th>Kapasitas</Table.Th>
            <Table.Th>Status Saat Ini</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rooms.map((room) => (
            <Table.Tr key={room.id}>
              <Table.Td fw={600}>{room.room_number}</Table.Td>
              <Table.Td>{room.room_type?.name || 'N/A'}</Table.Td>
              <Table.Td>
                Rp {room.room_type?.price_per_night.toLocaleString('id-ID') || '0'}
              </Table.Td>
              <Table.Td>{room.room_type?.capacity || 0} orang</Table.Td>
              <Table.Td>
                <Badge color={getStatusColor(room.status)} variant="light">
                  {getStatusLabel(room.status)}
                </Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}