// src/app/fo/guests/components/GuestsTable.tsx
'use client';

import { Table, Group, ActionIcon, Paper, Text, Avatar, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash, IconPhone, IconMail } from '@tabler/icons-react';
import { Guest } from '@/core/types/database';

interface Props {
  data: Guest[];
  onEdit: (guest: Guest) => void;
  onDelete: (guest: Guest) => void;
}

export function GuestsTable({ data, onEdit, onDelete }: Props) {
  if (data.length === 0) {
    return (
      <Paper p="xl" withBorder ta="center" c="dimmed" radius="md">
        Belum ada data tamu yang ditemukan.
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" radius="md" withBorder style={{ overflow: 'hidden' }}>
      <Table striped highlightOnHover verticalSpacing="xs">
        <Table.Thead bg="gray.0">
          <Table.Tr>
            <Table.Th>Nama Lengkap</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Nomor Telepon</Table.Th>
            <Table.Th ta="center" style={{ width: 100 }}>Aksi</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((guest) => (
            <Table.Tr key={guest.id}>
              <Table.Td>
                <Group gap="sm">
                  <Avatar color="teal" radius="xl" size="sm">
                    {guest.full_name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Text size="sm" fw={500}>
                    {guest.full_name}
                  </Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  <IconMail size={14} style={{ opacity: 0.5 }} />
                  <Text size="sm">{guest.email}</Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  <IconPhone size={14} style={{ opacity: 0.5 }} />
                  <Text size="sm">{guest.phone_number || '-'}</Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Group gap={4} justify="center">
                  <Tooltip label="Edit Tamu">
                    <ActionIcon 
                      variant="subtle" 
                      color="blue" 
                      size="sm" 
                      onClick={() => onEdit(guest)}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Hapus Tamu">
                    <ActionIcon 
                      variant="subtle" 
                      color="red" 
                      size="sm" 
                      onClick={() => onDelete(guest)}
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