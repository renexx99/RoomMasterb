// src/app/manager/reservations/components/ReservationInvoiceModal.tsx
'use client';

import { Modal, Paper, Text, Group, Stack, Divider, Grid, Badge, Box, Button, ActionIcon, ScrollArea } from '@mantine/core';
import { IconPrinter, IconCheck, IconX } from '@tabler/icons-react';
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

  // --- Konten Invoice yang Reusable (Untuk Layar & Cetak) ---
  const InvoiceContent = (
    <Box p="xl" bg="white" style={{ color: 'black' }}>
       {/* Header Invoice */}
       <Group justify="space-between" mb="xl" align='flex-start'>
          <Stack gap={2}>
             {/* [PERBAIKAN] Menggunakan data dinamis dari tabel Hotel */}
             <Text size="xl" fw={900} tt="uppercase" c="blue.8" style={{ letterSpacing: 1, lineHeight: 1.2 }}>
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
                 {reservation.payment_status}
             </Badge>
             <Text size="sm" mt={4} fw={600}>Ref: #{reservation.id.substring(0, 8).toUpperCase()}</Text>
             <Text size="xs" c="dimmed">{new Date(reservation.created_at).toLocaleDateString('id-ID')}</Text>
          </Stack>
       </Group>

       <Divider mb="lg" />

       <Grid gutter="lg">
         {/* Guest Info */}
         <Grid.Col span={6}>
           <Text size="xs" fw={700} c="dimmed" mb={4} tt="uppercase">Bill To:</Text>
           <Text fw={700} size="md">{reservation.guest?.full_name}</Text>
           <Text size="sm">{reservation.guest?.email}</Text>
           <Text size="sm">{reservation.guest?.phone_number || '-'}</Text>
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
                 <Text size="xs" c="dimmed">{reservation.room?.room_type?.name} Rate</Text>
               </Grid.Col>
               <Grid.Col span={4} style={{ textAlign: 'right' }}>
                 <Text size="sm" fw={600}>Rp {reservation.total_price.toLocaleString('id-ID')}</Text>
               </Grid.Col>
            </Grid>
         </Box>
         <Box p="md" bg="blue.0" style={{ borderTop: '1px solid #dee2e6' }}>
            <Grid align="center">
               <Grid.Col span={8}>
                  <Text fw={800} size="lg" c="blue.9">TOTAL</Text>
                  {reservation.payment_method && (
                      <Group gap={4}>
                         <IconCheck size={14} color="teal" />
                         <Text size="xs" c="teal.7" fw={600}>Paid via {reservation.payment_method}</Text>
                      </Group>
                  )}
               </Grid.Col>
               <Grid.Col span={4} style={{ textAlign: 'right' }}>
                  <Text fw={800} size="xl" c="blue.9">Rp {reservation.total_price.toLocaleString('id-ID')}</Text>
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
        withCloseButton={false} // Matikan header bawaan agar kita bisa buat custom header
        size="lg"
        centered
        radius="md"
        padding={0}
      >
        {/* CUSTOM HEADER: Agar judul rapi di tengah */}
        <Group justify="space-between" px="md" py="xs" style={{ borderBottom: '1px solid #e9ecef', background: '#f8f9fa' }}>
            <Box style={{ width: 28 }} /> {/* Spacer kiri untuk menyeimbangkan tombol close */}
            
            {/* Judul di tengah tanpa ikon receipt */}
            <Text fw={700} size="lg" c="dark.7">Reservation Successful</Text>
            
            <ActionIcon onClick={onClose} variant="subtle" color="gray" aria-label="Close modal">
                <IconX size={20} />
            </ActionIcon>
        </Group>

        {/* Render Konten Invoice dengan ScrollArea agar rapi jika layar kecil */}
        <div style={{ maxHeight: "calc(100vh - 200px)", overflow: "auto" }}>
           {InvoiceContent}
        </div>

        {/* Footer Tombol */}
        <Group justify="flex-end" p="md" bg="gray.0" style={{ borderTop: '1px solid #e9ecef' }}>
          <Button variant="default" onClick={onClose}>Close</Button>
          <Button 
            leftSection={<IconPrinter size={16} />} 
            color="blue"
            onClick={handlePrint}
          >
            Print Invoice
          </Button>
        </Group>
      </Modal>

      {/* 2. Area Khusus Cetak (Hidden di Layar, Visible di Print) */}
      <div id="printable-area">
        {InvoiceContent}
      </div>

      {/* 3. Style Global untuk Print */}
      <style jsx global>{`
        /* Sembunyikan area print saat di layar biasa */
        #printable-area {
          display: none;
        }

        @media print {
          /* Sembunyikan semua elemen body normal */
          body * {
            visibility: hidden;
          }
          
          /* Sembunyikan elemen portal Mantine (Modal overlay, dll) */
          .mantine-Modal-root, .mantine-Overlay-root, .mantine-Portal-root {
            display: none !important;
          }

          /* Tampilkan HANYA area print dan children-nya */
          #printable-area, #printable-area * {
            visibility: visible;
          }

          /* Posisikan area print di pojok kiri atas kertas */
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