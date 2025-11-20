'use client';

import { Table, Group, ActionIcon, Paper, Box, Text, Badge, NumberFormatter } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { RoomWithDetails } from '../page';

interface Props {
  data: RoomWithDetails[];
  onEdit: (item: RoomWithDetails) => void;
  onDelete: (item: RoomWithDetails) => void;
}

export function RoomsTable({ data, onEdit, onDelete }: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'green';
      case 'occupied': return 'red';
      case 'maintenance': return 'gray';
      default: return 'blue';
    }
  };

  if (data.length === 0) {
    return (
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Box ta="center">
          <Text c="dimmed">Data kamar tidak ditemukan.</Text>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder>
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>No. Kamar</Table.Th>
            <Table.Th>Tipe Kamar</Table.Th>
            {/* PERBAIKAN: Hapus Header Lantai */}
            <Table.Th>Harga Dasar</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th ta="center">Aksi</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((item) => (
            <Table.Tr key={item.id}>
              <Table.Td fw={700} fz="lg">{item.room_number}</Table.Td>
              <Table.Td>
                {item.room_type ? (
                  <Text size="sm" fw={500}>{item.room_type.name}</Text>
                ) : (
                  <Text size="sm" c="red" fs="italic">Tipe Terhapus</Text>
                )}
              </Table.Td>
              
              {/* PERBAIKAN: Hapus Data Lantai */}
              
              <Table.Td>
                {item.room_type ? (
                   <NumberFormatter 
                     prefix="Rp " 
                     value={Number(item.room_type.price_per_night)} 
                     thousandSeparator="." 
                     decimalSeparator="," 
                   />
                ) : '-'}
              </Table.Td>
              <Table.Td>
                <Badge color={getStatusColor(item.status)} variant="light">
                  {item.status.toUpperCase()}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap="xs" justify="center">
                  <ActionIcon variant="light" color="blue" onClick={() => onEdit(item)} aria-label="Edit">
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon variant="light" color="red" onClick={() => onDelete(item)} aria-label="Hapus">
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