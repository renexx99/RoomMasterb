// src/app/fo/billing/components/BillingList.tsx
'use client';

import { Paper, Grid, Card, Group, Avatar, Box, Text, Button, Stack, Center } from '@mantine/core';
import { IconUser, IconFileInvoice, IconUserOff } from '@tabler/icons-react';
import { ReservationDetails } from '../page'; 

interface Props {
  reservations: ReservationDetails[];
  onViewInvoice: (res: ReservationDetails) => void; // Renamed prop
}

export function BillingList({ reservations, onViewInvoice }: Props) {
  if (reservations.length === 0) {
    return (
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Center>
          <Stack align="center" c="dimmed" gap="xs">
            <IconUserOff size={40} stroke={1.5} />
            <Text size="sm">Tidak ada tamu in-house yang sesuai pencarian.</Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      {reservations.map((res) => (
        <Card key={res.id} shadow="xs" radius="md" withBorder padding="sm">
          <Grid align="center">
            {/* Kolom Identitas */}
            <Grid.Col span={{ base: 12, sm: 5 }}>
              <Group>
                <Avatar color="teal" size="md" radius="xl">
                  <IconUser size={18} />
                </Avatar>
                <Box>
                  <Text fw={600} size="sm" lineClamp={1}>{res.guest?.full_name}</Text>
                  <Text c="dimmed" size="xs">
                    Kamar {res.room?.room_number} ({res.room?.room_type?.name})
                  </Text>
                </Box>
              </Group>
            </Grid.Col>

            {/* Kolom Waktu */}
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  Check-in: <Text span c="dark" fw={500}>{new Date(res.check_in_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</Text>
                </Text>
                <Text size="xs" c="dimmed">
                  Check-out: <Text span c="dark" fw={500}>{new Date(res.check_out_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</Text>
                </Text>
              </Stack>
            </Grid.Col>

            {/* Kolom Aksi */}
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Button
                fullWidth
                variant="light"
                color="teal"
                size="xs"
                leftSection={<IconFileInvoice size={16} />}
                onClick={() => onViewInvoice(res)} // Use new prop
              >
                Lihat Invoice
              </Button>
            </Grid.Col>
          </Grid>
        </Card>
      ))}
    </Stack>
  );
}