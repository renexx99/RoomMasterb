// src/app/fo/check-in/components/CheckInList.tsx
'use client';

import { SimpleGrid, Card, Group, Avatar, Text, Badge, Paper, Button, Center } from '@mantine/core';
import { IconUser, IconBed, IconLogin, IconLogout } from '@tabler/icons-react';
import { ReservationDetails } from '../page'; // Import tipe dari page parent

interface CheckInListProps {
  data: ReservationDetails[];
  type: 'check-in' | 'check-out';
  onAction: (res: ReservationDetails) => void;
  loading?: boolean;
}

export function CheckInList({ data, type, onAction, loading }: CheckInListProps) {
  if (data.length === 0) {
    return (
      <Paper withBorder p="xl" ta="center" radius="md" bg="gray.0">
        <Text c="dimmed" size="sm">
          Tidak ada {type === 'check-in' ? 'kedatangan' : 'keberangkatan'} terjadwal hari ini.
        </Text>
      </Paper>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
      {data.map((res) => (
        <Card key={res.id} shadow="xs" padding="md" radius="md" withBorder>
          {/* Header Kartu: Nama Tamu & Status Bayar */}
          <Group justify="space-between" align="flex-start" mb="xs">
            <Group gap="xs">
              <Avatar color={type === 'check-in' ? 'teal' : 'orange'} radius="xl" size="md">
                <IconUser size={18} />
              </Avatar>
              <div>
                <Text fw={600} size="sm" lineClamp={1}>{res.guest?.full_name || 'Tamu'}</Text>
                <Text c="dimmed" size="xs" lineClamp={1}>{res.guest?.email || '-'}</Text>
              </div>
            </Group>
            <Badge 
              color={res.payment_status === 'paid' ? 'green' : 'orange'} 
              variant="light" 
              size="sm"
            >
              {res.payment_status}
            </Badge>
          </Group>

          {/* Info Kamar */}
          <Paper bg="gray.0" p="xs" radius="sm" mb="md">
            <Group justify="space-between">
              <Group gap="xs">
                <IconBed size={16} style={{ opacity: 0.6 }} />
                <Text size="xs" fw={500}>
                  Kamar {res.room?.room_number || '?'}
                </Text>
              </Group>
              <Text size="xs" c="dimmed">
                {res.room?.room_type?.name || 'Tipe?'}
              </Text>
            </Group>
          </Paper>

          {/* Tombol Aksi */}
          <Button 
            fullWidth 
            variant="light" 
            color={type === 'check-in' ? 'teal' : 'orange'} 
            size="xs"
            loading={loading}
            leftSection={type === 'check-in' ? <IconLogin size={16}/> : <IconLogout size={16}/>}
            onClick={() => onAction(res)}
          >
            {type === 'check-in' ? 'Proses Check-in' : 'Proses Check-out'}
          </Button>
        </Card>
      ))}
    </SimpleGrid>
  );
}