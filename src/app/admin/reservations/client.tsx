'use client';

import { useState, useMemo } from 'react';
import {
  Container,
  Title,
  Button,
  Group,
  Paper,
  TextInput,
  Select,
  ActionIcon,
  Text,
  Grid,
  MultiSelect,
  Modal,
  Stack,
} from '@mantine/core';
import { DatePickerInput, DatesProvider, DateValue } from '@mantine/dates';
import 'dayjs/locale/id';
import '@mantine/dates/styles.css';
import { IconPlus, IconArrowLeft, IconSearch } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';

import { ReservationDetails, GuestOption, RoomWithDetails } from './page';
import { ReservationsTable } from './components/ReservationsTable';
import { ReservationFormModal } from './components/ReservationFormModal';
import { deleteReservation } from './actions';

interface ClientProps {
  initialReservations: ReservationDetails[];
  guests: GuestOption[];
  availableRooms: RoomWithDetails[];
  hotelId: string | null;
}

export default function ReservationsManagementClient({ 
  initialReservations, 
  guests, 
  availableRooms, 
  hotelId 
}: ClientProps) {
  const router = useRouter();

  // State Data
  const reservations = initialReservations;

  // UI States
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationDetails | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReservationDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('check_in_asc');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string[]>([]);
  const [filterDateRange, setFilterDateRange] = useState<[DateValue, DateValue]>([null, null]);

  // --- Filter & Sort Logic ---
  const filteredAndSortedReservations = useMemo(() => {
    let result = [...reservations];

    // 1. Filter Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(res =>
        res.guest?.full_name?.toLowerCase().includes(lowerSearch) ||
        res.guest?.email?.toLowerCase().includes(lowerSearch) ||
        res.room?.room_number?.toLowerCase().includes(lowerSearch)
      );
    }

    // 2. Filter Status
    if (filterPaymentStatus.length > 0) {
      result = result.filter(res => filterPaymentStatus.includes(res.payment_status));
    }

    // 3. Filter Date Range
    const [startDate, endDate] = filterDateRange;
    if (startDate) {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        result = result.filter(res => new Date(res.check_in_date + 'T00:00:00') >= startOfDay);
    }
    if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        result = result.filter(res => new Date(res.check_in_date + 'T00:00:00') <= endOfDay);
    }

    // 4. Sort
    switch (sortBy) {
        case 'guest_name_asc':
            result.sort((a, b) => (a.guest?.full_name || '').localeCompare(b.guest?.full_name || ''));
            break;
        case 'guest_name_desc':
            result.sort((a, b) => (b.guest?.full_name || '').localeCompare(a.guest?.full_name || ''));
            break;
        case 'check_in_asc':
            result.sort((a, b) => new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime());
            break;
        case 'check_in_desc':
            result.sort((a, b) => new Date(b.check_in_date).getTime() - new Date(a.check_in_date).getTime());
            break;
        case 'price_asc':
            result.sort((a, b) => a.total_price - b.total_price);
            break;
        case 'price_desc':
            result.sort((a, b) => b.total_price - a.total_price);
            break;
        default: // check_in_asc
            result.sort((a, b) => new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime());
    }

    return result;
  }, [reservations, searchTerm, sortBy, filterPaymentStatus, filterDateRange]);

  // --- Handlers ---
  const handleOpenCreate = () => {
    setEditingReservation(null);
    setModalOpened(true);
  };

  const handleOpenEdit = (res: ReservationDetails) => {
    setEditingReservation(res);
    setModalOpened(true);
  };

  const handleOpenDelete = (res: ReservationDetails) => {
    setDeleteTarget(res);
    setDeleteModalOpened(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const result = await deleteReservation(deleteTarget.id);
      if (result.error) {
        notifications.show({ title: 'Gagal', message: result.error, color: 'red' });
      } else {
        notifications.show({ title: 'Sukses', message: 'Reservasi berhasil dihapus', color: 'green' });
        setDeleteModalOpened(false);
        setDeleteTarget(null);
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
        <Paper withBorder p="xl" ta="center">
          <Text c="dimmed">Akun Anda belum terhubung dengan Hotel manapun.</Text>
        </Paper>
      </Container>
    );
  }

  return (
    <DatesProvider settings={{ locale: 'id', firstDayOfWeek: 1, weekendDays: [0] }}>
      <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '2rem 0', marginBottom: '2rem' }}>
          <Container size="lg">
            <Group justify="space-between" align="center">
              <div>
                <Group mb="xs">
                  <ActionIcon variant="transparent" color="white" onClick={() => router.push('/admin/dashboard')} aria-label="Kembali ke Dashboard">
                    <IconArrowLeft size={20} />
                  </ActionIcon>
                  <Title order={1} c="white">Manajemen Reservasi</Title>
                </Group>
                <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>Kelola reservasi hotel Anda</Text>
              </div>
              <Button leftSection={<IconPlus size={18} />} onClick={handleOpenCreate} variant="white" color="teal">
                Buat Reservasi
              </Button>
            </Group>
          </Container>
        </div>

        {/* Konten Utama */}
        <Container size="lg" pb="xl">
          <Stack gap="lg">
            {/* Filter */}
            <Paper shadow="xs" p="md" radius="md" withBorder>
              <Grid align="flex-end" gutter="md">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Cari Reservasi"
                    placeholder="Nama tamu, email, atau no. kamar..."
                    leftSection={<IconSearch size={16} />}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <DatePickerInput
                    type="range"
                    label="Rentang Check-in"
                    placeholder="Pilih rentang tanggal"
                    value={filterDateRange}
                    onChange={setFilterDateRange}
                    clearable
                    valueFormat="DD MMM YYYY"
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                  <MultiSelect
                    label="Status Bayar"
                    placeholder="Semua Status"
                    data={['pending', 'paid', 'cancelled']}
                    value={filterPaymentStatus}
                    onChange={setFilterPaymentStatus}
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Select
                    label="Urutkan"
                    value={sortBy}
                    onChange={(value) => setSortBy(value || 'check_in_asc')}
                    data={[
                      { value: 'check_in_asc', label: 'Check-in (Terdekat)' },
                      { value: 'check_in_desc', label: 'Check-in (Terjauh)' },
                      { value: 'price_asc', label: 'Harga Termurah' },
                      { value: 'price_desc', label: 'Harga Termahal' },
                      { value: 'guest_name_asc', label: 'Nama Tamu (A-Z)' },
                    ]}
                  />
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Tabel */}
            <ReservationsTable 
              reservations={filteredAndSortedReservations}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          </Stack>
        </Container>

        {/* Modals */}
        <ReservationFormModal 
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          hotelId={hotelId}
          reservationToEdit={editingReservation}
          guests={guests}
          availableRooms={availableRooms}
        />

        <Modal opened={deleteModalOpened} onClose={() => setDeleteModalOpened(false)} title="Konfirmasi Hapus" centered size="sm">
          <Stack gap="md">
            <Text size="sm">Apakah Anda yakin ingin menghapus reservasi tamu <strong>{deleteTarget?.guest?.full_name}</strong>?</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setDeleteModalOpened(false)} disabled={isSubmitting}>Batal</Button>
              <Button color="red" onClick={handleDeleteConfirm} loading={isSubmitting}>Hapus Reservasi</Button>
            </Group>
          </Stack>
        </Modal>
      </div>
    </DatesProvider>
  );
}