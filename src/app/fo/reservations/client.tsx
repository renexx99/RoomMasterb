// src/app/fo/reservations/client.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Container, Title, Button, Group, Paper, TextInput, Select,
  ActionIcon, Text, Grid, MultiSelect, Modal, Stack, Box, ThemeIcon
} from '@mantine/core';
import { DatePickerInput, DatesProvider, DateValue } from '@mantine/dates';
import 'dayjs/locale/id';
import '@mantine/dates/styles.css';
import { IconPlus, IconArrowLeft, IconSearch, IconCalendarEvent } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';

import { ReservationDetails, GuestOption, RoomWithDetails } from './page';
import { ReservationsTable } from './components/ReservationsTable';
import { ReservationFormModal } from './components/ReservationFormModal';
import { deleteReservation } from './actions';

interface ClientProps {
  initialReservations: ReservationDetails[];
  guests: GuestOption[];
  rooms: RoomWithDetails[];
  hotelId: string | null;
}

export default function FoReservationsClient({ initialReservations, guests, rooms, hotelId }: ClientProps) {
  const router = useRouter();
  const MAX_WIDTH = 1200;

  // State Data
  const reservations = initialReservations || [];
  const availableRooms = rooms || [];

  // UI States
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationDetails | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReservationDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('check_in_asc');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string[]>([]);
  const [filterDateRange, setFilterDateRange] = useState<[DateValue, DateValue]>([null, null]);

  // Filter & Sort Logic
  const filteredAndSortedReservations = useMemo(() => {
    let result = [...reservations];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(res =>
        res.guest?.full_name?.toLowerCase().includes(lowerSearch) ||
        res.guest?.email?.toLowerCase().includes(lowerSearch) ||
        res.room?.room_number?.toLowerCase().includes(lowerSearch)
      );
    }

    if (filterPaymentStatus.length > 0) {
      result = result.filter(res => filterPaymentStatus.includes(res.payment_status));
    }

    const [startDate, endDate] = filterDateRange;
    if (startDate) {
      const startOfDay = new Date(startDate); startOfDay.setHours(0, 0, 0, 0);
      result = result.filter(res => new Date(res.check_in_date + 'T00:00:00') >= startOfDay);
    }
    if (endDate) {
      const endOfDay = new Date(endDate); endOfDay.setHours(23, 59, 59, 999);
      result = result.filter(res => new Date(res.check_in_date + 'T00:00:00') <= endOfDay);
    }

    switch (sortBy) {
      case 'guest_name_asc': result.sort((a, b) => (a.guest?.full_name || '').localeCompare(b.guest?.full_name || '')); break;
      case 'check_in_desc': result.sort((a, b) => new Date(b.check_in_date).getTime() - new Date(a.check_in_date).getTime()); break;
      case 'price_desc': result.sort((a, b) => b.total_price - a.total_price); break;
      default: result.sort((a, b) => new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime());
    }

    return result;
  }, [reservations, searchTerm, sortBy, filterPaymentStatus, filterDateRange]);

  // Handlers
  const handleOpenCreate = () => { setEditingReservation(null); setModalOpened(true); };
  const handleOpenEdit = (res: ReservationDetails) => { setEditingReservation(res); setModalOpened(true); };
  const handleOpenDelete = (res: ReservationDetails) => { setDeleteTarget(res); setDeleteModalOpened(true); };
  
  const closeModals = () => {
    setModalOpened(false);
    setDeleteModalOpened(false);
    setEditingReservation(null);
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const result = await deleteReservation(deleteTarget.id);
      if (result.error) {
        notifications.show({ title: 'Gagal', message: result.error, color: 'red' });
      } else {
        notifications.show({ title: 'Sukses', message: 'Reservasi dihapus', color: 'green' });
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
        <Paper withBorder p="xl" ta="center"><Text c="dimmed">Akun tidak terhubung ke hotel.</Text></Paper>
      </Container>
    );
  }

  return (
    <DatesProvider settings={{ locale: 'id', firstDayOfWeek: 1, weekendDays: [0] }}>
      <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        {/* Header Ramping (Teal Gradient) */}
        <div style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)', padding: '0.75rem 0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <Container fluid px="lg">
            <Box maw={MAX_WIDTH} mx="auto">
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <ThemeIcon variant="light" color="white" size="lg" radius="md" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                    <IconCalendarEvent size={20} stroke={1.5} />
                  </ThemeIcon>
                  <div style={{ lineHeight: 1 }}>
                    <Title order={4} c="white" style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.2 }}>Manajemen Reservasi</Title>
                    <Text c="white" opacity={0.8} size="xs" mt={2}>Kelola booking & jadwal tamu</Text>
                  </div>
                </Group>
                <Group gap="xs">
                    <ActionIcon variant="white" color="teal" size="lg" radius="md" onClick={() => router.push('/fo/dashboard')} aria-label="Kembali">
                        <IconArrowLeft size={20} />
                    </ActionIcon>
                    <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate} variant="white" color="teal" size="xs" radius="md" fw={600}>
                        Buat Reservasi
                    </Button>
                </Group>
              </Group>
            </Box>
          </Container>
        </div>

        {/* Konten Utama */}
        <Container fluid px="lg" py="md">
          <Box maw={MAX_WIDTH} mx="auto">
            <Stack gap="md">
              
              {/* Filter Section */}
              <Paper shadow="xs" p="sm" radius="md" withBorder>
                <Grid align="flex-end" gutter="sm">
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      placeholder="Cari tamu atau kamar..."
                      leftSection={<IconSearch size={16} stroke={1.5} />}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.currentTarget.value)}
                      size="sm"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <DatePickerInput
                      type="range"
                      placeholder="Rentang Check-in"
                      value={filterDateRange}
                      onChange={setFilterDateRange}
                      clearable
                      valueFormat="DD MMM YYYY"
                      size="sm"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                    <MultiSelect
                      placeholder="Status Bayar"
                      data={['pending', 'paid', 'cancelled']}
                      value={filterPaymentStatus}
                      onChange={setFilterPaymentStatus}
                      clearable
                      size="sm"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <Select
                      value={sortBy}
                      onChange={(v) => setSortBy(v || 'check_in_asc')}
                      data={[
                        { value: 'check_in_asc', label: 'Check-in (Terdekat)' },
                        { value: 'check_in_desc', label: 'Check-in (Terjauh)' },
                        { value: 'guest_name_asc', label: 'Nama Tamu (A-Z)' },
                        { value: 'price_desc', label: 'Harga (Tertinggi)' },
                      ]}
                      size="sm"
                    />
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Tabel */}
              <ReservationsTable 
                data={filteredAndSortedReservations}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            </Stack>
          </Box>
        </Container>

        {/* Modals */}
        <ReservationFormModal 
          opened={modalOpened}
          onClose={closeModals}
          hotelId={hotelId}
          reservationToEdit={editingReservation}
          guests={guests}
          availableRooms={availableRooms}
        />

        <Modal opened={deleteModalOpened} onClose={closeModals} title="Konfirmasi Hapus" centered size="sm" radius="md">
          <Stack gap="md">
            <Text size="sm">Yakin ingin menghapus reservasi tamu <strong>{deleteTarget?.guest?.full_name}</strong>?</Text>
            <Group justify="flex-end">
              <Button variant="default" size="xs" onClick={closeModals} disabled={isSubmitting}>Batal</Button>
              <Button color="red" size="xs" onClick={handleDeleteConfirm} loading={isSubmitting}>Hapus Reservasi</Button>
            </Group>
          </Stack>
        </Modal>
      </div>
    </DatesProvider>
  );
}