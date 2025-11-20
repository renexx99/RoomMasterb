'use client';

import { Table, Badge, ActionIcon, Group, Text, Paper, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { ReservationDetails } from '../page';

interface Props {
  data: ReservationDetails[];
  onEdit: (reservation: ReservationDetails) => void;
  onDelete: (res: ReservationDetails) => void;
}

export function ReservationsTable({ data, onEdit, onDelete }: Props) {
  // Helper warna pembayaran
  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid': return 'green';
      case 'pending': return 'orange';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  if (data.length === 0) {
    return (
      <Paper p="xl" withBorder ta="center" c="dimmed" radius="md">
        Belum ada data reservasi yang ditemukan.
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" radius="md" withBorder style={{ overflow: 'hidden' }}>
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead bg="gray.0">
          <Table.Tr>
            <Table.Th>Tamu</Table.Th>
            <Table.Th>Kamar</Table.Th>
            <Table.Th>Check-in</Table.Th>
            <Table.Th>Check-out</Table.Th>
            {/* HAPUS Header Status */}
            <Table.Th>Pembayaran</Table.Th>
            <Table.Th>Total</Table.Th>
            <Table.Th style={{ width: 100 }} ta="center">Aksi</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((res) => (
            <Table.Tr key={res.id}>
              <Table.Td>
                <Text fw={500} size="sm">{res.guest?.full_name || 'N/A'}</Text>
                <Text size="xs" c="dimmed">{res.guest?.email}</Text>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Badge variant="dot" size="sm" color="dark">
                    {res.room?.room_number}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {res.room?.room_type?.name}
                  </Text>
                </Group>
              </Table.Td>
              <Table.Td>
                {new Date(res.check_in_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Table.Td>
              <Table.Td>
                {new Date(res.check_out_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Table.Td>
              {/* HAPUS Cell Status */}
              <Table.Td>
                <Badge color={getPaymentColor(res.payment_status)} variant="light">
                  {res.payment_status}
                </Badge>
              </Table.Td>
              <Table.Td fw={600} c="teal.7">
                Rp {res.total_price?.toLocaleString('id-ID')}
              </Table.Td>
              <Table.Td>
                <Group gap="xs" justify="center">
                  <Tooltip label="Edit Reservasi">
                    <ActionIcon 
                      variant="subtle" 
                      color="blue" 
                      onClick={() => onEdit(res)}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Hapus Reservasi">
                    <ActionIcon 
                      variant="subtle" 
                      color="red" 
                      onClick={() => onDelete(res)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}