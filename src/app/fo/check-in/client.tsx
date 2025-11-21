// src/app/fo/check-in/client.tsx
'use client';

import { useState } from 'react';
import {
  Container, Box, Paper, Tabs, Group, ThemeIcon, Title, ActionIcon, Text, 
  Modal, Stack, Avatar, Button
} from '@mantine/core';
import { IconCalendarTime, IconArrowLeft, IconLogin, IconLogout, IconUser } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { ReservationDetails } from './page';
import { CheckInList } from './components/CheckInList';
import { checkInGuest, checkOutGuest } from './actions'; // Import Server Actions

interface ClientProps {
  initialArrivals: ReservationDetails[];
  initialDepartures: ReservationDetails[];
  hotelId: string | null;
}

export default function CheckInClient({ initialArrivals, initialDepartures, hotelId }: ClientProps) {
  const router = useRouter();
  const MAX_WIDTH = 1200;

  // UI State
  const [checkInModalOpened, setCheckInModalOpened] = useState(false);
  const [checkOutModalOpened, setCheckOutModalOpened] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handlers Modal
  const openCheckIn = (res: ReservationDetails) => { setSelectedReservation(res); setCheckInModalOpened(true); };
  const openCheckOut = (res: ReservationDetails) => { setSelectedReservation(res); setCheckOutModalOpened(true); };
  const closeModals = () => { setCheckInModalOpened(false); setCheckOutModalOpened(false); setSelectedReservation(null); };

  // Actions
  const handleConfirmCheckIn = async () => {
    if (!selectedReservation) return;
    setIsSubmitting(true);
    
    try {
      const res = await checkInGuest(selectedReservation.id, selectedReservation.room_id);
      if (res.error) {
        notifications.show({ title: 'Gagal', message: res.error, color: 'red' });
      } else {
        notifications.show({ title: 'Sukses', message: 'Tamu berhasil check-in', color: 'green' });
        closeModals();
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Terjadi kesalahan sistem', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCheckOut = async () => {
    if (!selectedReservation) return;
    setIsSubmitting(true);

    try {
      const res = await checkOutGuest(selectedReservation.id, selectedReservation.room_id);
      if (res.error) {
        notifications.show({ title: 'Gagal', message: res.error, color: 'red' });
      } else {
        notifications.show({ title: 'Sukses', message: 'Tamu berhasil check-out', color: 'blue' });
        closeModals();
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Terjadi kesalahan sistem', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hotelId) {
    return (
      <Container size="lg" py="xl">
        <Paper p="xl" withBorder ta="center"><Text c="dimmed">Akun tidak terhubung ke hotel.</Text></Paper>
      </Container>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Ramping */}
      <div style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)', padding: '0.75rem 0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <Container fluid px="lg">
          <Box maw={MAX_WIDTH} mx="auto">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <ThemeIcon variant="light" color="white" size="lg" radius="md" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                  <IconCalendarTime size={20} stroke={1.5} />
                </ThemeIcon>
                <div style={{ lineHeight: 1 }}>
                  <Title order={4} c="white" style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.2 }}>Proses Check-in & Check-out</Title>
                  <Text c="white" opacity={0.8} size="xs" mt={2}>Kelola alur tamu hari ini</Text>
                </div>
              </Group>
              <ActionIcon variant="white" color="teal" size="lg" radius="md" onClick={() => router.push('/fo/dashboard')} aria-label="Kembali">
                <IconArrowLeft size={20} />
              </ActionIcon>
            </Group>
          </Box>
        </Container>
      </div>

      {/* Konten Utama */}
      <Container fluid px="lg" py="md">
        <Box maw={MAX_WIDTH} mx="auto">
          <Paper shadow="sm" radius="md" withBorder p="sm">
            <Tabs defaultValue="arrivals" color="teal" variant="pills" radius="md">
              <Tabs.List mb="md">
                <Tabs.Tab value="arrivals" leftSection={<IconLogin size={16} />}>
                  Kedatangan ({initialArrivals.length})
                </Tabs.Tab>
                <Tabs.Tab value="departures" leftSection={<IconLogout size={16} />}>
                  Keberangkatan ({initialDepartures.length})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="arrivals">
                <CheckInList 
                  data={initialArrivals} 
                  type="check-in" 
                  onAction={openCheckIn} 
                />
              </Tabs.Panel>

              <Tabs.Panel value="departures">
                <CheckInList 
                  data={initialDepartures} 
                  type="check-out" 
                  onAction={openCheckOut} 
                />
              </Tabs.Panel>
            </Tabs>
          </Paper>
        </Box>
      </Container>

      {/* Modal Check-in */}
      <Modal opened={checkInModalOpened} onClose={closeModals} title="Konfirmasi Check-in" centered size="sm" radius="md">
        <Stack gap="md">
          <Text size="sm">Konfirmasi check-in untuk tamu ini?</Text>
          {selectedReservation && (
            <Paper withBorder p="xs" radius="md" bg="gray.0">
              <Group>
                <Avatar color="teal" radius="xl"><IconUser size={20}/></Avatar>
                <div>
                  <Text fw={600} size="sm">{selectedReservation.guest?.full_name}</Text>
                  <Text c="dimmed" size="xs">Kamar {selectedReservation.room?.room_number}</Text>
                </div>
              </Group>
            </Paper>
          )}
          <Text size="xs" c="dimmed">Status kamar akan berubah menjadi <strong>Occupied</strong>.</Text>
          <Group justify="flex-end" mt="xs">
            <Button variant="default" size="xs" onClick={closeModals} disabled={isSubmitting}>Batal</Button>
            <Button color="teal" size="xs" onClick={handleConfirmCheckIn} loading={isSubmitting}>Check-in</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal Check-out */}
      <Modal opened={checkOutModalOpened} onClose={closeModals} title="Konfirmasi Check-out" centered size="sm" radius="md">
        <Stack gap="md">
          <Text size="sm">Konfirmasi check-out untuk tamu ini?</Text>
          {selectedReservation && (
            <Paper withBorder p="xs" radius="md" bg="gray.0">
              <Group>
                <Avatar color="orange" radius="xl"><IconUser size={20}/></Avatar>
                <div>
                  <Text fw={600} size="sm">{selectedReservation.guest?.full_name}</Text>
                  <Text c="dimmed" size="xs">Kamar {selectedReservation.room?.room_number}</Text>
                </div>
              </Group>
            </Paper>
          )}
          <Text size="xs" c="dimmed">Status kamar akan berubah menjadi <strong>Maintenance</strong>. Pastikan pembayaran lunas.</Text>
          <Group justify="flex-end" mt="xs">
            <Button variant="default" size="xs" onClick={closeModals} disabled={isSubmitting}>Batal</Button>
            <Button color="orange" size="xs" onClick={handleConfirmCheckOut} loading={isSubmitting}>Check-out</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}