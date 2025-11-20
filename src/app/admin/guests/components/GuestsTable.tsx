'use client';

import { Table, Group, ActionIcon, Paper, Box, Text } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { Guest } from '@/core/types/database';

interface GuestsTableProps {
  guests: Guest[];
  onEdit: (guest: Guest) => void;
  onDelete: (guest: Guest) => void;
}

export function GuestsTable({ guests, onEdit, onDelete }: GuestsTableProps) {
  if (guests.length === 0) {
    return (
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Box ta="center">
          <Text c="dimmed">Data tamu tidak ditemukan.</Text>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nama Lengkap</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Nomor Telepon</Table.Th>
            <Table.Th ta="center" style={{ width: 100 }}>Aksi</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {guests.map((guest) => (
            <Table.Tr key={guest.id}>
              <Table.Td fw={500}>{guest.full_name}</Table.Td>
              <Table.Td>{guest.email}</Table.Td>
              <Table.Td>{guest.phone_number || '-'}</Table.Td>
              <Table.Td>
                <Group gap="xs" justify="center">
                  <ActionIcon 
                    variant="light" 
                    color="blue" 
                    onClick={() => onEdit(guest)} 
                    aria-label={`Edit ${guest.full_name}`}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon 
                    variant="light" 
                    color="red" 
                    onClick={() => onDelete(guest)} 
                    aria-label={`Hapus ${guest.full_name}`}
                  >
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