'use client';

import { Modal, Paper, Text, Group, Stack, Divider, Grid, Badge, ThemeIcon, Box, Button } from '@mantine/core';
import { IconReceipt, IconCalendar, IconUser, IconBed, IconClock, IconPrinter } from '@tabler/icons-react';
import { ReservationDetails } from '../page';

interface Props {
  opened: boolean;
  onClose: () => void;
  reservation: ReservationDetails | null;
}

export function ReservationInvoiceModal({ opened, onClose, reservation }: Props) {
  if (!reservation) return null;

  const nights = Math.ceil(
    (new Date(reservation.check_out_date).getTime() - new Date(reservation.check_in_date).getTime()) / (1000 * 3600 * 24)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'teal';
      case 'pending': return 'orange';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={<Group gap="xs"><IconReceipt size={20} /><Text fw={700}>Reservation Details</Text></Group>}
      size="lg"
      centered
      radius="md"
    >
      <Paper p="md" withBorder radius="md" bg="gray.0" mb="md">
        <Group justify="space-between" align="flex-start">
          <Stack gap={2}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Reservation ID</Text>
            <Text fw={600} fz="sm">#{reservation.id.substring(0, 8).toUpperCase()}</Text>
          </Stack>
          <Badge 
            size="lg" 
            variant="filled" 
            color={getStatusColor(reservation.payment_status)}
            style={{ textTransform: 'uppercase' }}
          >
            {reservation.payment_status}
          </Badge>
        </Group>
      </Paper>

      <Grid gutter="lg">
        {/* Guest Info */}
        <Grid.Col span={12}>
          <Text size="sm" fw={700} c="dimmed" mb="xs" tt="uppercase">Guest Information</Text>
          <Paper p="md" withBorder radius="md">
            <Group>
              <ThemeIcon variant="light" size="lg" radius="md" color="blue">
                <IconUser size={20} />
              </ThemeIcon>
              <Box>
                <Text fw={600}>{reservation.guest?.full_name}</Text>
                <Text size="sm" c="dimmed">{reservation.guest?.email}</Text>
                <Text size="sm" c="dimmed">{reservation.guest?.phone_number || '-'}</Text>
              </Box>
            </Group>
          </Paper>
        </Grid.Col>

        {/* Room & Stay Info */}
        <Grid.Col span={12}>
          <Text size="sm" fw={700} c="dimmed" mb="xs" tt="uppercase">Stay Details</Text>
          <Paper p="md" withBorder radius="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Group gap="xs">
                  <IconBed size={18} color="gray" />
                  <Text size="sm">Room Type:</Text>
                </Group>
                <Text size="sm" fw={600}>{reservation.room?.room_type?.name} (No. {reservation.room?.room_number})</Text>
              </Group>
              
              <Divider variant="dashed" />
              
              <Group grow>
                <Box>
                  <Group gap="xs" mb={4}>
                    <IconCalendar size={16} color="gray" />
                    <Text size="xs" c="dimmed">Check-in</Text>
                  </Group>
                  <Text fw={600}>{new Date(reservation.check_in_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</Text>
                </Box>
                <Box>
                   <Group gap="xs" mb={4}>
                    <IconCalendar size={16} color="gray" />
                    <Text size="xs" c="dimmed">Check-out</Text>
                  </Group>
                  <Text fw={600}>{new Date(reservation.check_out_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</Text>
                </Box>
                <Box>
                   <Group gap="xs" mb={4}>
                    <IconClock size={16} color="gray" />
                    <Text size="xs" c="dimmed">Duration</Text>
                  </Group>
                  <Text fw={600}>{nights} Nights</Text>
                </Box>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Payment Info */}
        <Grid.Col span={12}>
          <Paper bg="blue.0" p="md" radius="md" style={{ border: '1px solid var(--mantine-color-blue-2)' }}>
            <Group justify="space-between" align="center">
              <Stack gap={2}>
                 <Text size="sm" fw={600} c="blue.9">Total Amount</Text>
                 <Text size="xs" c="blue.7">Created on {new Date(reservation.created_at).toLocaleDateString()}</Text>
                 {reservation.payment_method && (
                    <Text size="xs" c="blue.8" mt={4}>Via: {reservation.payment_method.toUpperCase().replace('_', ' ')}</Text>
                 )}
              </Stack>
              <Text fz={24} fw={700} c="blue.8">
                Rp {reservation.total_price.toLocaleString('id-ID')}
              </Text>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>

      <Group justify="flex-end" mt="xl">
        <Button variant="default" onClick={onClose}>Close</Button>
        <Button leftSection={<IconPrinter size={16} />} variant="outline">Print Invoice</Button>
      </Group>
    </Modal>
  );
}