'use client';

import { Modal, Paper, Text, Group, Stack, Divider, Grid, Badge, Box, Button, ActionIcon } from '@mantine/core';
import { IconPrinter, IconCheck, IconX, IconBuildingBank } from '@tabler/icons-react';
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

  const isCityLedger = reservation.booking_source === 'travel_agent' || reservation.payment_status === 'city_ledger';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'teal';
      case 'pending': return 'orange';
      case 'cancelled': return 'red';
      case 'city_ledger': return 'dark';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'city_ledger') return 'CITY LEDGER';
    return status.toUpperCase();
  };

  // --- Konten Invoice yang Reusable (Untuk Layar & Cetak) ---
  const InvoiceContent = (
    <Box p="xl" bg="white" style={{ color: 'black' }}>
       {/* City Ledger Banner */}
       {isCityLedger && (
         <Box
           mb="lg"
           p="sm"
           style={{
             background: '#f5f5f5',
             border: '1px solid #d4d4d4',
             borderRadius: 6,
             textAlign: 'center',
           }}
         >
           <Group gap={8} justify="center">
             <IconBuildingBank size={16} color="#525252" />
             <Text size="sm" fw={700} style={{ color: '#262626', letterSpacing: '0.03em' }}>
               B2B Booking — City Ledger (Billed to OTA)
             </Text>
           </Group>
           <Text size="xs" c="dimmed" mt={2}>
             Room charges are invoiced to the travel agent. Do not collect payment from guest.
           </Text>
         </Box>
       )}

       {/* Header Invoice */}
       <Group justify="space-between" mb="xl" align='flex-start'>
          <Stack gap={2}>
             {/* [UPDATED] Nama Hotel dengan Gradient Ungu (Konsisten dengan Login/FO) */}
             <Text 
                size="xl" 
                fw={900} 
                tt="uppercase" 
                variant="gradient"
                gradient={{ from: '#667eea', to: '#764ba2', deg: 135 }}
                style={{ letterSpacing: 1, lineHeight: 1.2 }}
             >
                {reservation.hotel?.name || 'HOTEL NAME'}
             </Text>
             <Text size="sm" c="dimmed">
                {reservation.hotel?.address || 'Hotel Address Not Available'}
             </Text>
          </Stack>
          <Stack gap={0} align="flex-end">
             <Badge 
                 size="lg" 
                 variant="filled" 
                 color={getStatusColor(reservation.payment_status)}
                 style={{ textTransform: 'uppercase' }}
             >
                 {getStatusLabel(reservation.payment_status)}
             </Badge>
             <Text size="sm" mt={4} fw={600}>Ref: #{reservation.id.substring(0, 8).toUpperCase()}</Text>
             <Text size="xs" c="dimmed">{new Date(reservation.created_at).toLocaleDateString('id-ID')}</Text>
          </Stack>
       </Group>

       <Divider mb="lg" />

       <Grid gutter="lg">
         {/* Guest Info */}
         <Grid.Col span={6}>
           <Text size="xs" fw={700} c="dimmed" mb={4} tt="uppercase">
             {isCityLedger ? 'Guest (Stay):' : 'Bill To:'}
           </Text>
           <Text fw={700} size="md">{reservation.guest?.full_name}</Text>
           <Text size="sm">{reservation.guest?.email}</Text>
           <Text size="sm">{reservation.guest?.phone_number || '-'}</Text>
           {isCityLedger && (
             <Text size="xs" c="dimmed" mt={4} fs="italic">
               Room charges billed to Travel Agent
             </Text>
           )}
         </Grid.Col>

         {/* Stay Info */}
         <Grid.Col span={6} style={{ textAlign: 'right' }}>
           <Text size="xs" fw={700} c="dimmed" mb={4} tt="uppercase">Stay Details:</Text>
           <Text fw={600}>{reservation.room?.room_type?.name} - Room {reservation.room?.room_number}</Text>
           <Text size="sm">
             {new Date(reservation.check_in_date).toLocaleDateString('id-ID')} — {new Date(reservation.check_out_date).toLocaleDateString('id-ID')}
           </Text>
           <Text size="sm">Duration: {nights} Night(s)</Text>
         </Grid.Col>
       </Grid>

       <Paper withBorder radius="sm" mt="xl" mb="lg" style={{ overflow: 'hidden' }}>
         <Box p="xs" bg="gray.1" style={{ borderBottom: '1px solid #dee2e6' }}>
            <Grid>
               <Grid.Col span={8}><Text fw={700} size="sm">Description</Text></Grid.Col>
               <Grid.Col span={4} style={{ textAlign: 'right' }}><Text fw={700} size="sm">Amount</Text></Grid.Col>
            </Grid>
         </Box>
         <Box p="md">
            <Grid mb="sm">
               <Grid.Col span={8}>
                 <Text size="sm">Room Charge ({nights} nights)</Text>
                 <Text size="xs" c="dimmed">
                   {reservation.room?.room_type?.name} Rate
                   {isCityLedger && ' — B2B Contract Rate'}
                 </Text>
               </Grid.Col>
               <Grid.Col span={4} style={{ textAlign: 'right' }}>
                 <Text size="sm" fw={600}>Rp {reservation.total_price.toLocaleString('id-ID')}</Text>
               </Grid.Col>
            </Grid>
         </Box>
         
         {/* [UPDATED] Bagian Total — monochrome for City Ledger, violet for standard */}
         <Box p="md" style={{ background: isCityLedger ? '#f5f5f5' : '#f5f3ff', borderTop: '1px solid #dee2e6' }}>
            <Grid align="center">
               <Grid.Col span={8}>
                  <Text fw={800} size="lg" c={isCityLedger ? 'dark.7' : 'violet.9'}>TOTAL</Text>
                  {isCityLedger ? (
                    <Group gap={4}>
                       <IconBuildingBank size={14} color="#525252" />
                       <Text size="xs" c="dark.4" fw={600}>City Ledger — Billed to OTA</Text>
                    </Group>
                  ) : (
                    reservation.payment_method && reservation.payment_status === 'paid' && (
                      <Group gap={4}>
                         <IconCheck size={14} color="teal" />
                         <Text size="xs" c="teal.7" fw={600}>Paid via {reservation.payment_method}</Text>
                      </Group>
                    )
                  )}
               </Grid.Col>
               <Grid.Col span={4} style={{ textAlign: 'right' }}>
                  <Text fw={800} size="xl" c={isCityLedger ? 'dark.7' : 'violet.9'}>Rp {reservation.total_price.toLocaleString('id-ID')}</Text>
               </Grid.Col>
            </Grid>
         </Box>
       </Paper>

       <Text size="xs" c="dimmed" ta="center" mt={40}>
          Thank you for choosing {reservation.hotel?.name || 'RoomMaster'}. This is a computer-generated invoice.
       </Text>
    </Box>
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* 1. Modal untuk Tampilan Layar */}
      <Modal 
        opened={opened} 
        onClose={onClose} 
        withCloseButton={false} 
        size="lg"
        centered
        radius="md"
        padding={0}
      >
        {/* CUSTOM HEADER */}
        <Group justify="space-between" px="md" py="xs" style={{ borderBottom: '1px solid #e9ecef', background: '#f8f9fa' }}>
            <Box style={{ width: 28 }} /> 
            <Text fw={700} size="lg" c="dark.7">
              {isCityLedger ? 'Reservation — City Ledger' : 'Reservation Successful'}
            </Text>
            <ActionIcon onClick={onClose} variant="subtle" color="gray" aria-label="Close modal">
                <IconX size={20} />
            </ActionIcon>
        </Group>

        {/* Render Konten Invoice */}
        <div style={{ maxHeight: "calc(100vh - 200px)", overflow: "auto" }}>
           {InvoiceContent}
        </div>

        {/* Footer Tombol */}
        <Group justify="flex-end" p="md" bg="gray.0" style={{ borderTop: '1px solid #e9ecef' }}>
          <Button variant="default" onClick={onClose}>Close</Button>
          {/* Hide payment collection for City Ledger bookings */}
          {!isCityLedger && (
            <Button 
              leftSection={<IconPrinter size={16} />} 
              color="blue"
              onClick={handlePrint}
            >
              Print Invoice
            </Button>
          )}
          {isCityLedger && (
            <Button 
              leftSection={<IconPrinter size={16} />}
              variant="filled"
              color="dark"
              onClick={handlePrint}
            >
              Print Folio
            </Button>
          )}
        </Group>
      </Modal>

      {/* 2. Area Khusus Cetak (Hidden di Layar, Visible di Print) */}
      <div id="printable-area">
        {InvoiceContent}
      </div>

      {/* 3. Style Global untuk Print */}
      <style jsx global>{`
        #printable-area {
          display: none;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          .mantine-Modal-root, .mantine-Overlay-root, .mantine-Portal-root {
            display: none !important;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          #printable-area {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white;
            z-index: 99999;
          }
        }
      `}</style>
    </>
  );
}