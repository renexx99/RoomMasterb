// src/app/fo/check-in/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Center,
  Loader,
  ActionIcon,
  Badge,
  Tabs,
  Card,
  Button,
  Modal,
  Avatar,
  Box,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconLogin,
  IconLogout,
  IconBed,
  IconUser,
  IconCash,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { notifications } from '@mantine/notifications';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { Reservation, Guest, Room, RoomType } from '@/core/types/database';

// Tipe data gabungan untuk reservasi
interface ReservationDetails extends Reservation {
  guest: Pick<Guest, 'id' | 'full_name' | 'email'>;
  room: Pick<Room, 'id' | 'room_number'> & {
    room_type: Pick<RoomType, 'id' | 'name' | 'price_per_night'>;
  };
}

function CheckInProcessContent() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [arrivals, setArrivals] = useState<ReservationDetails[]>([]);
  const [departures, setDepartures] = useState<ReservationDetails[]>([]);

  // State Modal
  const [checkInModalOpened, setCheckInModalOpened] = useState(false);
  const [checkOutModalOpened, setCheckOutModalOpened] = useState(false);
  const [
    selectedReservation,
    setSelectedReservation,
  ] = useState<ReservationDetails | null>(null);

  const assignedHotelId = profile?.roles?.find(
    (r) => r.hotel_id && r.role_name === 'Front Office'
  )?.hotel_id;

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!authLoading && assignedHotelId) {
      fetchData();
    } else if (!authLoading && !assignedHotelId) {
      setLoading(false);
      notifications.show({
        title: 'Error',
        message: 'Anda tidak terhubung ke hotel manapun.',
        color: 'red',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, assignedHotelId]);

  const fetchData = async () => {
    if (!assignedHotelId) return;
    setLoading(true);
    try {
      const commonSelect = `
        *,
        guest:guests(id, full_name, email),
        room:rooms(id, room_number, room_type:room_types(id, name, price_per_night))
      `;

      // 1. Ambil Kedatangan Hari Ini
      const { data: arrivalsData, error: arrivalsError } = await supabase
        .from('reservations')
        .select(commonSelect)
        .eq('hotel_id', assignedHotelId)
        .eq('check_in_date', today)
        .neq('payment_status', 'cancelled')
        // Tambahkan filter untuk status kamar 'available' jika reservasi men-trigger
        // Untuk MVP, kita asumsikan semua reservasi hari ini adalah kedatangan
        // yang kamarnya belum 'occupied'
        .order('check_in_date', { ascending: true });

      if (arrivalsError) throw arrivalsError;

      // 2. Ambil Keberangkatan Hari Ini
      const { data: departuresData, error: departuresError } = await supabase
        .from('reservations')
        .select(commonSelect)
        .eq('hotel_id', assignedHotelId)
        .eq('check_out_date', today)
        .neq('payment_status', 'cancelled')
        .order('check_out_date', { ascending: true });

      if (departuresError) throw departuresError;

      // Filter manual untuk kedatangan (yang kamarnya belum 'occupied')
      // dan keberangkatan (yang kamarnya *sudah* 'occupied')
      // Ini butuh query status kamar terpisah.
      // UNTUK MVP: Kita tampilkan saja berdasarkan tanggal.
      setArrivals((arrivalsData as ReservationDetails[]) || []);
      setDepartures((departuresData as ReservationDetails[]) || []);
    } catch (error: any) {
      console.error('Error fetching check-in/out data:', error);
      notifications.show({
        title: 'Error',
        message: error?.message || 'Gagal memuat data kedatangan/keberangkatan.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers Modal ---
  const handleOpenCheckInModal = (res: ReservationDetails) => {
    setSelectedReservation(res);
    setCheckInModalOpened(true);
  };

  const handleOpenCheckOutModal = (res: ReservationDetails) => {
    setSelectedReservation(res);
    setCheckOutModalOpened(true);
  };

  const handleCloseModals = () => {
    setCheckInModalOpened(false);
    setCheckOutModalOpened(false);
    setSelectedReservation(null);
  };

  // --- Aksi Konfirmasi ---
  const handleConfirmCheckIn = async () => {
    if (!selectedReservation) return;

    try {
      setLoading(true);
      // 1. Ubah status kamar menjadi 'occupied'
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: 'occupied' })
        .eq('id', selectedReservation.room.id);

      if (roomError) throw roomError;

      // 2. (Opsional MVP) Update status pembayaran menjadi 'paid' saat check-in
      const { error: resError } = await supabase
        .from('reservations')
        .update({ payment_status: 'paid' })
        .eq('id', selectedReservation.id);

      if (resError) throw resError;

      notifications.show({
        title: 'Check-in Berhasil',
        message: `Tamu ${selectedReservation.guest.full_name} berhasil check-in ke kamar ${selectedReservation.room.room_number}.`,
        color: 'green',
      });

      handleCloseModals();
      await fetchData(); // Refresh data
    } catch (error: any) {
      notifications.show({
        title: 'Error Check-in',
        message: error.message || 'Gagal melakukan check-in.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCheckOut = async () => {
    if (!selectedReservation) return;

    try {
      setLoading(true);
      // 1. Ubah status kamar menjadi 'maintenance' (perlu dibersihkan)
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: 'maintenance' })
        .eq('id', selectedReservation.room.id);

      if (roomError) throw roomError;

      // 2. (Opsional) Jika ada logic update reservasi (misal status 'completed')
      // Untuk MVP, kita biarkan saja.

      notifications.show({
        title: 'Check-out Berhasil',
        message: `Tamu ${selectedReservation.guest.full_name} berhasil check-out dari kamar ${selectedReservation.room.room_number}.`,
        color: 'blue',
      });

      handleCloseModals();
      await fetchData(); // Refresh data
    } catch (error: any) {
      notifications.show({
        title: 'Error Check-out',
        message: error.message || 'Gagal melakukan check-out.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk render list
  const renderReservationList = (
    list: ReservationDetails[],
    type: 'check-in' | 'check-out'
  ) => {
    if (loading) {
      return (
        <Center py="xl">
          <Loader />
        </Center>
      );
    }
    if (list.length === 0) {
      return (
        <Center py="xl">
          <Text c="dimmed">
            Tidak ada {type === 'check-in' ? 'kedatangan' : 'keberangkatan'}{' '}
            terjadwal hari ini.
          </Text>
        </Center>
      );
    }

    return (
      <Stack gap="md" py="md">
        {list.map((res) => (
          <Card key={res.id} shadow="sm" radius="md" withBorder>
            <Group justify="space-between">
              <Stack gap={0}>
                <Group>
                  <Text fw={700} size="lg">
                    {res.guest.full_name}
                  </Text>
                  <Badge
                    color={
                      res.payment_status === 'paid'
                        ? 'green'
                        : res.payment_status === 'pending'
                        ? 'orange'
                        : 'gray'
                    }
                    variant="light"
                  >
                    {res.payment_status}
                  </Badge>
                </Group>
                <Text c="dimmed" size="sm">
                  {res.guest.email}
                </Text>
              </Stack>

              <Stack gap={0} align="flex-end">
                <Text fw={600} size="md">
                  Kamar {res.room.room_number}
                </Text>
                <Text c="dimmed" size="sm">
                  {res.room.room_type.name}
                </Text>
              </Stack>
            </Group>

            <Group justify="flex-end" mt="md">
              {type === 'check-in' ? (
                <Button
                  leftSection={<IconLogin size={18} />}
                  color="green"
                  onClick={() => handleOpenCheckInModal(res)}
                >
                  Check-in Tamu
                </Button>
              ) : (
                <Button
                  leftSection={<IconLogout size={18} />}
                  color="blue"
                  onClick={() => handleOpenCheckOutModal(res)}
                >
                  Check-out Tamu
                </Button>
              )}
            </Group>
          </Card>
        ))}
      </Stack>
    );
  };

  if (authLoading && !profile) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 140px)' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Halaman */}
      <div
        style={{
          background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)',
          padding: '2rem 0',
          marginBottom: '2rem',
        }}
      >
        <Container size="lg">
          <div>
            <Group mb="xs">
              <ActionIcon
                variant="transparent"
                color="white"
                onClick={() => router.push('/fo/dashboard')}
                aria-label="Kembali ke Dashboard"
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              <Title order={1} c="white">
                Proses Check-in & Check-out
              </Title>
            </Group>
            <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>
              Kelola alur kedatangan dan keberangkatan tamu hari ini.
            </Text>
          </div>
        </Container>
      </div>

      {/* Konten Utama (Tabs) */}
      <Container size="lg" pb="xl">
        <Paper shadow="sm" p={0} radius="md" withBorder>
          <Tabs defaultValue="arrivals" color="teal">
            <Tabs.List grow>
              <Tabs.Tab value="arrivals" leftSection={<IconLogin size={16} />}>
                Kedatangan Hari Ini ({arrivals.length})
              </Tabs.Tab>
              <Tabs.Tab
                value="departures"
                leftSection={<IconLogout size={16} />}
              >
                Keberangkatan Hari Ini ({departures.length})
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="arrivals" p="md">
              {renderReservationList(arrivals, 'check-in')}
            </Tabs.Panel>

            <Tabs.Panel value="departures" p="md">
              {renderReservationList(departures, 'check-out')}
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Container>

      {/* Modal Konfirmasi Check-in */}
      <Modal
        opened={checkInModalOpened}
        onClose={handleCloseModals}
        title="Konfirmasi Check-in"
        centered
        size="md"
      >
        <Stack gap="md">
          {selectedReservation && (
            <>
              <Text size="sm">
                Anda akan melakukan check-in untuk tamu:
              </Text>
              <Paper withBorder p="md" radius="md" bg="gray.0">
                <Group>
                  <Avatar
                    color="green"
                    radius="xl"
                    size="lg"
                    src={null}
                    alt={selectedReservation.guest.full_name}
                  >
                    <IconUser />
                  </Avatar>
                  <Box>
                    <Text fw={700} size="lg">
                      {selectedReservation.guest.full_name}
                    </Text>
                    <Text c="dimmed" size="sm">
                      {selectedReservation.guest.email}
                    </Text>
                  </Box>
                </Group>
                <Group mt="md">
                  <IconBed size={20} />
                  <Text fw={500}>
                    Kamar {selectedReservation.room.room_number} (
                    {selectedReservation.room.room_type.name})
                  </Text>
                </Group>
                <Group mt="xs">
                  <IconCash size={20} />
                  <Text fw={500}>
                    Status: {' '}
                    <Badge
                      color={
                        selectedReservation.payment_status === 'paid'
                          ? 'green'
                          : 'orange'
                      }
                      variant="light"
                      size="sm"
                    >
                      {selectedReservation.payment_status}
                    </Badge>
                  </Text>
                </Group>
              </Paper>
              <Text size="sm" c="dimmed" mt="xs">
                Tindakan ini akan mengubah status kamar menjadi 'Occupied' dan
                menandai reservasi sebagai 'Paid' (jika belum).
              </Text>
            </>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleCloseModals}>
              Batal
            </Button>
            <Button
              color="green"
              onClick={handleConfirmCheckIn}
              loading={loading}
            >
              Konfirmasi Check-in
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal Konfirmasi Check-out */}
      <Modal
        opened={checkOutModalOpened}
        onClose={handleCloseModals}
        title="Konfirmasi Check-out"
        centered
        size="md"
      >
        <Stack gap="md">
          {selectedReservation && (
            <>
              <Text size="sm">
                Anda akan melakukan check-out untuk tamu:
              </Text>
              <Paper withBorder p="md" radius="md" bg="gray.0">
                <Group>
                  <Avatar
                    color="blue"
                    radius="xl"
                    size="lg"
                    src={null}
                    alt={selectedReservation.guest.full_name}
                  >
                    <IconUser />
                  </Avatar>
                  <Box>
                    <Text fw={700} size="lg">
                      {selectedReservation.guest.full_name}
                    </Text>
                    <Text fw={500} mt="xs">
                      Kamar {selectedReservation.room.room_number}
                    </Text>
                  </Box>
                </Group>
              </Paper>
              <Text size="sm" c="dimmed" mt="xs">
                (MVP) Pastikan semua tagihan (mini bar, laundry, dll.) sudah
                lunas sebelum melanjutkan.
              </Text>
              <Text size="sm" c="dimmed">
                Tindakan ini akan mengubah status kamar menjadi 'Maintenance'
                (perlu dibersihkan).
              </Text>
            </>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleCloseModals}>
              Batal
            </Button>
            <Button
              color="blue"
              onClick={handleConfirmCheckOut}
              loading={loading}
            >
              Konfirmasi Check-out
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}

// Bungkus dengan ProtectedRoute
export default function CheckInPage() {
  return (
    <ProtectedRoute requiredRoleName="Front Office">
      <CheckInProcessContent />
    </ProtectedRoute>
  );
}