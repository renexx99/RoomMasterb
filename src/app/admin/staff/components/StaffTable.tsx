'use client';

import { Table, Group, ActionIcon, Paper, Box, Text, Badge } from '@mantine/core';
import { IconEdit, IconTrash, IconUserShield } from '@tabler/icons-react';
import { StaffMember } from '../page';

interface Props {
  data: StaffMember[];
  onEdit: (user: StaffMember) => void;
  onAssign: (user: StaffMember) => void;
  onDelete: (user: StaffMember) => void;
}

export function StaffTable({ data, onEdit, onAssign, onDelete }: Props) {
  if (data.length === 0) {
    return (
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Box ta="center">
          <Text c="dimmed">Belum ada staf di hotel ini.</Text>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nama Lengkap</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Peran (Role)</Table.Th>
            <Table.Th ta="center">Aksi</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((user) => (
            <Table.Tr key={user.id}>
              <Table.Td fw={500}>{user.full_name}</Table.Td>
              <Table.Td>{user.email}</Table.Td>
              <Table.Td>
                {user.assignment?.role_name ? (
                  <Badge color="blue" variant="light">{user.assignment.role_name}</Badge>
                ) : (
                  <Badge color="gray" variant="light">Tanpa Peran</Badge>
                )}
              </Table.Td>
              <Table.Td>
                <Group gap="xs" justify="center">
                  <ActionIcon color="blue" variant="light" onClick={() => onEdit(user)} aria-label="Edit Profil">
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon color="teal" variant="light" onClick={() => onAssign(user)} aria-label="Ubah Peran">
                    <IconUserShield size={16} />
                  </ActionIcon>
                  <ActionIcon color="red" variant="light" onClick={() => onDelete(user)} aria-label="Hapus Peran">
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