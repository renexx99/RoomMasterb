'use client';

import { Table, Badge, Card, Text } from '@mantine/core';

interface SimpleReservation {
  id: string;
  check_in_date: string;
  payment_status: string;
  total_price: number;
  guest: {
    full_name: string;
  } | null;
}

interface TableProps {
  reservations: SimpleReservation[];
}

export function RecentReservationsTable({ reservations }: TableProps) {
  if (reservations.length === 0) {
    return (
      <Card withBorder radius="md" p="lg">
        <Text c="dimmed" ta="center">Belum ada reservasi terbaru.</Text>
      </Card>
    );
  }

  const rows = reservations.map((row) => (
    <Table.Tr key={row.id}>
      <Table.Td>
        <Text fw={500}>{row.guest?.full_name || 'N/A'}</Text>
      </Table.Td>
      <Table.Td>
        {new Date(row.check_in_date).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })}
      </Table.Td>
      <Table.Td>
        <Badge
          color={
            row.payment_status === 'paid'
              ? 'green'
              : row.payment_status === 'pending'
              ? 'orange'
              : 'red'
          }
          variant="light"
        >
          {row.payment_status}
        </Badge>
      </Table.Td>
      <Table.Td>Rp {row.total_price.toLocaleString('id-ID')}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Card withBorder radius="md" p={0}>
      <Table verticalSpacing="sm" striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Tamu</Table.Th>
            <Table.Th>Check-in</Table.Th>
            <Table.Th>Status Bayar</Table.Th>
            <Table.Th>Total</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Card>
  );
}