'use client';

import { Table, Group, ActionIcon, Paper, Box, Text, Badge } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { ReservationDetails } from '../page';

interface Props {
  reservations: ReservationDetails[];
  onEdit: (res: ReservationDetails) => void;
  onDelete: (res: ReservationDetails) => void;
}

export function ReservationsTable({ reservations, onEdit, onDelete }: Props) {
  if (reservations.length === 0) {
    return (
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Box ta="center">
          <Text c="dimmed">Belum ada reservasi yang ditemukan.</Text>
        </Box>
      </Paper>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'green';
      case 'pending': return 'orange';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder>
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nama Tamu</Table.Th>
            <Table.Th>No. Kamar</Table.Th>
            <Table.Th>Check-in</Table.Th>
            <Table.Th>Check-out</Table.Th>
            <Table.Th>Total Harga</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th ta="center">Aksi</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {reservations.map((res) => (
            <Table.Tr key={res.id}>
              <Table.Td fw={500}>{res.guest?.full_name || 'N/A'}</Table.Td>
              <Table.Td>{res.room?.room_number || 'N/A'}</Table.Td>
              <Table.Td>
                {new Date(res.check_in_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Table.Td>
              <Table.Td>
                {new Date(res.check_out_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Table.Td>
              <Table.Td>Rp {res.total_price.toLocaleString('id-ID')}</Table.Td>
              <Table.Td>
                <Badge color={getStatusColor(res.payment_status)} variant="light">
                  {res.payment_status}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap="xs" justify="center">
                  <ActionIcon variant="light" color="blue" onClick={() => onEdit(res)}>
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon variant="light" color="red" onClick={() => onDelete(res)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}