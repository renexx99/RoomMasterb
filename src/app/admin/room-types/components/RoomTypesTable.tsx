'use client';

import { Table, Group, ActionIcon, Paper, Box, Text, NumberFormatter } from '@mantine/core';
import { IconEdit, IconTrash, IconUsers, IconCoin } from '@tabler/icons-react';
import { RoomType } from '@/core/types/database';

interface Props {
  data: RoomType[];
  onEdit: (item: RoomType) => void;
  onDelete: (item: RoomType) => void;
}

export function RoomTypesTable({ data, onEdit, onDelete }: Props) {
  if (data.length === 0) {
    return (
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Box ta="center">
          <Text c="dimmed">Belum ada tipe kamar yang dibuat.</Text>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder>
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nama Tipe</Table.Th>
            <Table.Th>Deskripsi</Table.Th>
            <Table.Th>Kapasitas</Table.Th>
            <Table.Th>Harga / Malam</Table.Th>
            <Table.Th ta="center">Aksi</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((item) => (
            <Table.Tr key={item.id}>
              <Table.Td fw={600}>{item.name}</Table.Td>
              <Table.Td>
                <Text lineClamp={1} size="sm" c="dimmed">
                    {item.description || '-'}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group gap={4}>
                  <IconUsers size={14} style={{ opacity: 0.5 }} />
                  <Text size="sm">{item.capacity} Org</Text>
                </Group>
              </Table.Td>
              <Table.Td fw={500} c="teal">
                <Group gap={4}>
                    <IconCoin size={14} />
                    {/* PERBAIKAN DI SINI: */}
                    {/* 1. Pastikan value dikonversi ke number */}
                    {/* 2. Set decimalSeparator secara eksplisit agar beda dengan thousandSeparator */}
                    <NumberFormatter 
                      prefix="Rp " 
                      value={Number(item.price_per_night)} 
                      thousandSeparator="." 
                      decimalSeparator=","
                    />
                </Group>
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