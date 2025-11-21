// src/app/fo/reservations/components/ReservationsTable.tsx
'use client';

import { Table, Badge, ActionIcon, Group, Text, Paper, Tooltip, Box } from '@mantine/core';
import { IconPencil, IconTrash, IconUser, IconBed } from '@tabler/icons-react';
import { ReservationDetails } from '../page';

interface Props {
  data: ReservationDetails[];
  onEdit: (reservation: ReservationDetails) => void;
  onDelete: (res: ReservationDetails) => void;
}

export function ReservationsTable({ data, onEdit, onDelete }: Props) {
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
      <Table striped highlightOnHover verticalSpacing="xs">
        <Table.Thead bg="gray.0">
          <Table.Tr>
            <Table.Th>Tamu</Table.Th>
            <Table.Th>Kamar</Table.Th>
            <Table.Th>Check-in</Table.Th>
            <Table.Th>Check-out</Table.Th>
            <Table.Th>Pembayaran</Table.Th>
            <Table.Th>Total</Table.Th>
            <Table.Th ta="center" style={{ width: 100 }}>Aksi</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((res) => (
            <Table.Tr key={res.id}>
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                    <IconUser size={16} style={{ opacity: 0.5 }} />
                    <Box>
                        <Text fw={500} size="sm" lineClamp={1}>{res.guest?.full_name || 'N/A'}</Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>{res.guest?.email}</Text>
                    </Box>
                </Group>
              </Table.Td>
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  <Badge variant="light" size="sm" color="gray" radius="sm">
                    {res.room?.room_number}
                  </Badge>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {res.room?.room_type?.name}
                  </Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{new Date(res.check_in_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{new Date(res.check_out_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </Table.Td>
              <Table.Td>
                <Badge color={getPaymentColor(res.payment_status)} variant="light" size="sm">
                  {res.payment_status}
                </Badge>
              </Table.Td>
              <Table.Td fw={600} c="teal.7" style={{ whiteSpace: 'nowrap' }}>
                Rp {res.total_price?.toLocaleString('id-ID')}
              </Table.Td>
              <Table.Td>
                <Group gap={4} justify="center">
                  <Tooltip label="Edit">
                    <ActionIcon variant="subtle" color="blue" size="sm" onClick={() => onEdit(res)}>
                      <IconPencil size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Hapus">
                    <ActionIcon variant="subtle" color="red" size="sm" onClick={() => onDelete(res)}>
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