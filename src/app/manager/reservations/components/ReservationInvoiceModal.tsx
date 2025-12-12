'use client';

import { Modal, Paper, Text, Group, Stack, Divider, Grid, Badge, ThemeIcon, Box, Button } from '@mantine/core';
import { IconReceipt, IconCalendar, IconUser, IconBed, IconClock, IconPrinter, IconCheck } from '@tabler/icons-react';
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* CSS untuk menyembunyikan elemen non-invoice saat print */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-content, #invoice-content * {
            visibility: visible;
          }
          #invoice-content {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white;
            color: black;
            border: none;
            box-shadow: none;
          }
          /* Hide modal overlay & buttons */
          .mantine-Modal-overlay, .mantine-Modal-header, .no-print {
            display: none !important;
          }
        }
      `}</style>

      <Modal 
        opened={opened} 
        onClose={onClose} 
        // Title kosong saat print agar header modal bawaan tidak mengganggu layout custom print (walaupun di-hide via CSS)
        title={<Group gap="xs"><IconReceipt size={20} /><Text fw={700}>Reservation Details</Text></Group>}
        size="lg"
        centered
        radius="md"
        padding="lg"
      >
        {/* ID untuk target Print */}
        <div id="invoice-content">
          
          {/* Header Invoice (Hanya tampil jelas saat print atau di modal) */}
          <Group justify="space-between" mb="xl" align='flex-end'>
             <Stack gap={0}>
                <Text size="xl" fw={800} tt="uppercase" c="blue.8" style={{ letterSpacing: 1 }}>INVOICE</Text>
                <Text size="sm" c="dimmed">RoomMaster Hotel Management</Text>
             </Stack>
             <Stack gap={0} align="flex-end">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Status</Text>
                <Badge 
                    size="lg" 
                    variant="filled" 
                    color={getStatusColor(reservation.payment_status)}
                    style={{ textTransform: 'uppercase' }}
                >
                    {reservation.payment_status}
                </Badge>
             </Stack>
          </Group>

          <Paper p="md" withBorder radius="md" bg="gray.0" mb="md" style={{ borderColor: '#e9ecef' }}>
            <Group justify="space-between" align="center">
              <Stack gap={2}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Booking Reference</Text>
                <Text fw={700} fz="lg" ff="monospace">#{reservation.id.substring(0, 8).toUpperCase()}</Text>
              </Stack>
              <Stack gap={2} align="flex-end">
                 <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Date</Text>
                 <Text fw={600}>{new Date(reservation.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</Text>
              </Stack>
            </Group>
          </Paper>

          <Grid gutter="lg">
            {/* Guest Info */}
            <Grid.Col span={12}>
              <Text size="sm" fw={700} c="dimmed" mb="xs" tt="uppercase">Guest Information</Text>
              <Paper p="md" withBorder radius="md" style={{ borderColor: '#e9ecef' }}>
                <Group>
                  <ThemeIcon variant="light" size="lg" radius="md" color="blue" className="no-print">
                    <IconUser size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={600} size="lg">{reservation.guest?.full_name}</Text>
                    <Text size="sm" c="dimmed">{reservation.guest?.email}</Text>
                    <Text size="sm" c="dimmed">{reservation.guest?.phone_number || '-'}</Text>
                  </Box>
                </Group>
              </Paper>
            </Grid.Col>

            {/* Room & Stay Info */}
            <Grid.Col span={12}>
              <Text size="sm" fw={700} c="dimmed" mb="xs" tt="uppercase">Reservation Details</Text>
              <Paper p="md" withBorder radius="md" style={{ borderColor: '#e9ecef' }}>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconBed size={18} color="gray" className="no-print" />
                      <Text size="sm">Room Type:</Text>
                    </Group>
                    <Text size="sm" fw={600}>{reservation.room?.room_type?.name} (No. {reservation.room?.room_number})</Text>
                  </Group>
                  
                  <Divider variant="dashed" />
                  
                  <Group grow>
                    <Box>
                      <Text size="xs" c="dimmed" mb={4}>Check-in</Text>
                      <Text fw={600} size="md">{new Date(reservation.check_in_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed" mb={4}>Check-out</Text>
                      <Text fw={600} size="md">{new Date(reservation.check_out_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed" mb={4}>Duration</Text>
                      <Text fw={600} size="md">{nights} Nights</Text>
                    </Box>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>

            {/* Payment Info */}
            <Grid.Col span={12}>
              <Paper bg="blue.0" p="lg" radius="md" style={{ border: '1px solid var(--mantine-color-blue-2)' }}>
                <Group justify="space-between" align="center">
                  <Stack gap={2}>
                    <Text size="sm" fw={600} c="blue.9">TOTAL AMOUNT</Text>
                    {reservation.payment_method && (
                        <Group gap={6}>
                            <IconCheck size={14} color="var(--mantine-color-blue-7)" />
                            <Text size="xs" c="blue.8" fw={500}>Paid via {reservation.payment_method.toUpperCase().replace('_', ' ')}</Text>
                        </Group>
                    )}
                  </Stack>
                  <Text fz={28} fw={800} c="blue.8">
                    Rp {reservation.total_price.toLocaleString('id-ID')}
                  </Text>
                </Group>
              </Paper>
            </Grid.Col>
          </Grid>
          
          {/* Footer Invoice (Hanya tampil saat print) */}
          <Box mt={40} style={{ display: 'none' }} className="visible-print-block">
             <Divider mb="sm" />
             <Text size="xs" c="dimmed" ta="center">Thank you for choosing RoomMaster. This is a computer-generated invoice.</Text>
          </Box>
        </div>

        {/* Buttons (Hidden when printing) */}
        <Group justify="flex-end" mt="xl" className="no-print">
          <Button variant="default" onClick={onClose}>Close</Button>
          <Button 
            leftSection={<IconPrinter size={16} />} 
            variant="filled" 
            color="blue"
            onClick={handlePrint}
          >
            Print / Save PDF
          </Button>
        </Group>
      </Modal>
    </>
  );
}