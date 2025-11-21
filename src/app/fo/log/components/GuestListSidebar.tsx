// src/app/fo/log/components/GuestListSidebar.tsx
'use client';

import { Paper, Stack, TextInput, Divider, ScrollArea, Center, Text, Group, Avatar, Box } from '@mantine/core';
import { IconSearch, IconUser } from '@tabler/icons-react';
import { ReservationDetails } from '../page';

interface Props {
  reservations: ReservationDetails[];
  selectedId: string | null;
  onSelect: (res: ReservationDetails) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
}

export function GuestListSidebar({ reservations, selectedId, onSelect, searchTerm, onSearchChange }: Props) {
  return (
    <Paper shadow="sm" radius="md" withBorder p="md" h="100%">
      <Stack gap="sm" h="100%">
        <TextInput
          placeholder="Cari tamu atau kamar..."
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
        />
        
        <Divider label="Tamu In-House" labelPosition="center" />
        
        <ScrollArea type="auto" offsetScrollbars style={{ flex: 1 }}>
          {reservations.length === 0 ? (
            <Center py="xl">
              <Text c="dimmed" size="sm" ta="center">
                {searchTerm ? 'Tidak ditemukan' : 'Tidak ada tamu'}
              </Text>
            </Center>
          ) : (
            <Stack gap="xs">
              {reservations.map((res) => (
                <Paper
                  key={res.id}
                  p="sm"
                  radius="sm"
                  withBorder
                  onClick={() => onSelect(res)}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: selectedId === res.id ? 'var(--mantine-color-teal-0)' : undefined,
                    borderColor: selectedId === res.id ? 'var(--mantine-color-teal-5)' : undefined,
                  }}
                  className="hover:bg-gray-50"
                >
                  <Group wrap="nowrap">
                    <Avatar color="teal" radius="xl" size="md">
                      <IconUser size={18} />
                    </Avatar>
                    <Box style={{ flex: 1, overflow: 'hidden' }}>
                      <Text fw={600} size="sm" truncate>
                        {res.guest?.full_name}
                      </Text>
                      <Text c="dimmed" size="xs" truncate>
                        Kamar {res.room?.room_number}
                      </Text>
                    </Box>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </ScrollArea>
      </Stack>
    </Paper>
  );
}