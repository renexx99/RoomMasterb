// src/app/fo/billing/components/BillingList.tsx
'use client';

import { Table, Group, Avatar, Box, Text, Button, Center, Stack, Badge } from '@mantine/core';
import { IconUser, IconFileInvoice, IconUserOff } from '@tabler/icons-react';
import { ReservationDetails } from '../page'; 

interface Props {
  reservations: ReservationDetails[];
  onViewInvoice: (res: ReservationDetails) => void;
}

export function BillingList({ reservations, onViewInvoice }: Props) {
  if (reservations.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center" c="dimmed" gap="xs">
          <IconUserOff size={40} stroke={1.5} />
          <Text size="sm">Tidak ada tamu in-house yang sesuai pencarian.</Text>
        </Stack>
      </Center>
    );
  }

  const rows = reservations.map((res) => (
    <Table.Tr key={res.id}>
      <Table.Td>
        <Group gap="sm">
          <Avatar color="teal" size="md" radius="xl">
            <IconUser size={18} />
          </Avatar>
          <Box>
            <Text fw={600} size="sm">{res.guest?.full_name}</Text>
            <Text c="dimmed" size="xs">{res.guest?.email || 'No email'}</Text>
          </Box>
        </Group>
      </Table.Td>
      <Table.Td>
        <Badge variant="light" color="blue" mb={4}>
          Kamar {res.room?.room_number}
        </Badge>
        <Text c="dimmed" size="xs">{res.room?.room_type?.name}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={500}>{new Date(res.check_in_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        <Text size="xs" c="dimmed">Check-in</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={500}>{new Date(res.check_out_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        <Text size="xs" c="dimmed">Check-out</Text>
      </Table.Td>
      <Table.Td ta="right">
        <Button
          variant="light"
          color="teal"
          size="xs"
          leftSection={<IconFileInvoice size={14} />}
          onClick={() => onViewInvoice(res)}
        >
          Lihat Invoice
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table verticalSpacing="sm" striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Informasi Tamu</Table.Th>
          <Table.Th>Kamar</Table.Th>
          <Table.Th>Tgl Check-In</Table.Th>
          <Table.Th>Tgl Check-Out</Table.Th>
          <Table.Th ta="right">Aksi</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}