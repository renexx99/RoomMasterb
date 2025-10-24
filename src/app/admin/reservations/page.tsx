// src/app/admin/reservations/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Title,
  Button,
  Table,
  Group,
  Modal,
  TextInput, // Pastikan ada
  Stack,
  Paper,
  ActionIcon,
  Text,
  Box,
  Loader,
  Center,
  Select,   // Pastikan ada
  Badge,
  NumberInput,
  Grid,     // Tambahkan Grid
  MultiSelect, // Tambahkan MultiSelect
} from '@mantine/core';
import { DatePickerInput, DatesProvider, DateValue } from '@mantine/dates'; // Tambahkan DateValue
import 'dayjs/locale/id';
import {
    IconEdit, IconTrash, IconPlus, IconArrowLeft, IconUser, IconMail, IconPhone,
    IconBed, IconCalendar, IconCash, IconSearch // Tambahkan IconSearch
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import '@mantine/dates/styles.css';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Guest, Reservation, Room, RoomType, PaymentStatus } from '@/core/types/database'; // Import PaymentStatus

// --- Interfaces ---
interface ReservationDetails extends Reservation {
  guest?: Pick<Guest, 'id' | 'full_name' | 'email'>;
  room?: Pick<Room, 'id' | 'room_number'> & {
    room_type?: Pick<RoomType, 'id' | 'name' | 'price_per_night'>;
  };
  // Tambahkan created_at jika belum ada di type Reservation
  created_at: string;
}

interface RoomWithDetails extends Room {
    room_type?: RoomType;
}

interface GuestOption {
  id: string;
  full_name: string;
  email: string;
}

// --- Component ---
export default function ReservationsManagementPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<ReservationDetails[]>([]);
  const [guestOptionsData, setGuestOptionsData] = useState<GuestOption[]>([]);
  const [availableRooms, setAvailableRooms] = useState<RoomWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationDetails | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReservationDetails | null>(null);

  // Form State
  const [guestSelectionMode, setGuestSelectionMode] = useState<'select' | 'new'>('select');
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('check_in_asc'); // Default sort: upcoming check-ins
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string[]>([]);
  const [filterDateRange, setFilterDateRange] = useState<[DateValue, DateValue]>([null, null]);

  const form = useForm({
    initialValues: {
      guest_id: '',
      new_guest_name: '',
      new_guest_email: '',
      new_guest_phone: '',
      room_id: '',
      check_in_date: null as Date | null,
      check_out_date: null as Date | null,
      total_price: 0,
      payment_status: 'pending' as PaymentStatus,
    },
     validate: {
      guest_id: (value, values) => (guestSelectionMode === 'select' && !value ? 'Pilih tamu' : null),
      new_guest_name: (value, values) => (guestSelectionMode === 'new' && !value ? 'Nama tamu baru harus diisi' : null),
      new_guest_email: (value, values) => {
        if (guestSelectionMode === 'new' && !value) return 'Email tamu baru harus diisi';
        if (guestSelectionMode === 'new' && value && !/^\S+@\S+\.\S+$/.test(value)) return 'Format email tidak valid';
        return null;
      },
      room_id: (value) => (!value ? 'Pilih kamar' : null),
      check_in_date: (value) => (!value ? 'Tanggal check-in harus diisi' : null),
      check_out_date: (value, values) => {
        if (!value) return 'Tanggal check-out harus diisi';
        const checkIn = values.check_in_date ? new Date(values.check_in_date) : null;
        const checkOut = value ? new Date(value) : null;
        if (checkIn && checkOut && checkOut <= checkIn) {
          return 'Tanggal check-out harus setelah check-in';
        }
        return null;
      },
      payment_status: (value) => (!value ? 'Status pembayaran harus dipilih' : null),
    },
  });

  // --- Data Fetching ---
  useEffect(() => {
    if (profile?.hotel_id) {
      fetchInitialData();
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.hotel_id]);

  const fetchInitialData = async () => {
    // ... (fungsi tetap sama) ...
    if (!profile?.hotel_id) return;
    setLoading(true);
    try {
      await Promise.all([
        fetchReservations(),
        fetchGuestsForSelect(),
        fetchAvailableRooms(),
      ]);
    } catch (error: any) {
        console.error("Error fetching initial data:", error);
      notifications.show({ title: 'Error', message: error?.message || 'Gagal memuat data awal.', color: 'red'});
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    // ... (fungsi tetap sama, tanpa sort awal) ...
    if (!profile?.hotel_id) return;
    const { data, error } = await supabase
      .from('reservations')
      .select(`*, guest:guests(id, full_name, email), room:rooms(id, room_number, room_type:room_types(id, name, price_per_night))`)
      .eq('hotel_id', profile.hotel_id);
      // .order('created_at', { ascending: false }); // Hapus sort

    if (error) throw error;
    setReservations((data as ReservationDetails[]) || []);
  };

  const fetchGuestsForSelect = async () => {
     // ... (fungsi tetap sama) ...
     if (!profile?.hotel_id) return;
    const { data, error } = await supabase.from('guests').select('id, full_name, email').eq('hotel_id', profile.hotel_id).order('full_name', { ascending: true });
    if (error) throw error;
    setGuestOptionsData((data as GuestOption[]) || []);
  };

  const fetchAvailableRooms = async () => {
     // ... (fungsi tetap sama) ...
     if (!profile?.hotel_id) return;
     const { data, error } = await supabase.from('rooms').select(`*, room_type:room_types(*)`).eq('hotel_id', profile.hotel_id).eq('status', 'available').order('room_number', { ascending: true });
     if (error) throw error;
     setAvailableRooms((data as RoomWithDetails[]) || []);
  };

  // --- Price Calculation ---
   useEffect(() => {
    // ... (fungsi tetap sama) ...
     const { check_in_date, check_out_date, room_id } = form.values;
    const checkIn = check_in_date ? new Date(check_in_date) : null;
    const checkOut = check_out_date ? new Date(check_out_date) : null;
    if (checkIn && checkOut && checkOut > checkIn && room_id) {
      const selectedRoom = availableRooms.find(room => room.id === room_id);
      if (selectedRoom?.room_type?.price_per_night) {
        const durationInNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        if (durationInNights > 0) { const price = durationInNights * selectedRoom.room_type.price_per_night; setCalculatedPrice(price); form.setFieldValue('total_price', price); }
        else { setCalculatedPrice(null); form.setFieldValue('total_price', 0); }
      } else { setCalculatedPrice(null); form.setFieldValue('total_price', 0); }
    } else { setCalculatedPrice(null); form.setFieldValue('total_price', 0); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.check_in_date, form.values.check_out_date, form.values.room_id, availableRooms]);


  // --- Filter & Sort Logic ---
  const filteredAndSortedReservations = useMemo(() => {
    let result = [...reservations];

    // Filter by search term (guest name, guest email, room number)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(res =>
        res.guest?.full_name?.toLowerCase().includes(lowerSearch) ||
        res.guest?.email?.toLowerCase().includes(lowerSearch) ||
        res.room?.room_number?.toLowerCase().includes(lowerSearch)
      );
    }

    // Filter by payment status
    if (filterPaymentStatus.length > 0) {
      result = result.filter(res => filterPaymentStatus.includes(res.payment_status));
    }

    // Filter by check-in date range
    const [startDate, endDate] = filterDateRange;
    if (startDate) {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0); // Set ke awal hari
        result = result.filter(res => {
            const checkIn = new Date(res.check_in_date + 'T00:00:00'); // Pastikan parsing lokal
            return checkIn >= startOfDay;
        });
    }
     if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999); // Set ke akhir hari
        result = result.filter(res => {
            const checkIn = new Date(res.check_in_date + 'T00:00:00'); // Pastikan parsing lokal
            return checkIn <= endOfDay;
        });
    }


    // Sort
    switch (sortBy) {
        case 'guest_name_asc':
            result.sort((a, b) => (a.guest?.full_name || '').localeCompare(b.guest?.full_name || ''));
            break;
        case 'guest_name_desc':
            result.sort((a, b) => (b.guest?.full_name || '').localeCompare(a.guest?.full_name || ''));
            break;
        case 'room_number_asc':
            result.sort((a, b) => (a.room?.room_number || '').localeCompare(b.room?.room_number || '', undefined, { numeric: true }));
            break;
         case 'room_number_desc':
            result.sort((a, b) => (b.room?.room_number || '').localeCompare(a.room?.room_number || '', undefined, { numeric: true }));
            break;
        case 'check_in_asc':
        default: // Default: upcoming check-ins first
            result.sort((a, b) => new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime());
            break;
        case 'check_in_desc':
            result.sort((a, b) => new Date(b.check_in_date).getTime() - new Date(a.check_in_date).getTime());
            break;
         case 'check_out_asc':
            result.sort((a, b) => new Date(a.check_out_date).getTime() - new Date(b.check_out_date).getTime());
            break;
        case 'check_out_desc':
            result.sort((a, b) => new Date(b.check_out_date).getTime() - new Date(a.check_out_date).getTime());
            break;
        case 'price_asc':
            result.sort((a, b) => a.total_price - b.total_price);
            break;
        case 'price_desc':
            result.sort((a, b) => b.total_price - a.total_price);
            break;
        case 'payment_status':
            // Urutkan berdasarkan status: paid -> pending -> cancelled
            const statusOrder = { paid: 1, pending: 2, cancelled: 3 };
            result.sort((a, b) => (statusOrder[a.payment_status] || 99) - (statusOrder[b.payment_status] || 99));
            break;
         case 'created_at_desc':
            result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            break;
        case 'created_at_asc':
            result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            break;
    }

    return result;
  }, [reservations, searchTerm, sortBy, filterPaymentStatus, filterDateRange]);


  // --- Submit, Edit, Delete Handlers (Tetap Sama) ---
  const handleSubmit = async (values: typeof form.values) => {
    // ... (fungsi tetap sama) ...
    if (!profile?.hotel_id) return;
    let targetGuestId = values.guest_id;
    try {
        setLoading(true);
      if (guestSelectionMode === 'new') {
        const { data: newGuest, error: guestError } = await supabase.from('guests').insert({ hotel_id: profile.hotel_id, full_name: values.new_guest_name, email: values.new_guest_email, phone_number: values.new_guest_phone || null }).select('id').single();
        if (guestError) { if (guestError?.code === '23505') { throw new Error('Email tamu baru sudah terdaftar di hotel ini.'); } throw guestError; }
        targetGuestId = newGuest.id;
        await fetchGuestsForSelect();
      }
      if (!targetGuestId) { throw new Error("Guest ID tidak valid."); }
      const reservationData = { hotel_id: profile.hotel_id, guest_id: targetGuestId, room_id: values.room_id, check_in_date: values.check_in_date, check_out_date: values.check_out_date, total_price: calculatedPrice ?? 0, payment_status: values.payment_status };
      if (editingReservation) {
        const { error } = await supabase.from('reservations').update(reservationData).eq('id', editingReservation.id);
        if (error) throw error;
        notifications.show({ title: 'Sukses', message: 'Reservasi berhasil diperbarui', color: 'green' });
      } else {
        const { error } = await supabase.from('reservations').insert(reservationData);
        if (error) throw error;
        notifications.show({ title: 'Sukses', message: 'Reservasi baru berhasil dibuat', color: 'green' });
      }
      handleCloseModal();
      await fetchReservations();
    } catch (error: any) {
      console.error("Error saving reservation:", error);
      notifications.show({ title: 'Error Penyimpanan', message: error?.message || 'Gagal menyimpan reservasi.', color: 'red' });
    } finally { setLoading(false); }
  };

 const handleEdit = (reservation: ReservationDetails) => {
    // ... (fungsi tetap sama) ...
    setEditingReservation(reservation);
    setGuestSelectionMode('select');
    const checkInDate = reservation.check_in_date ? new Date(reservation.check_in_date + 'T00:00:00') : null;
    const checkOutDate = reservation.check_out_date ? new Date(reservation.check_out_date + 'T00:00:00') : null;
    form.setValues({ guest_id: reservation.guest_id, room_id: reservation.room_id, check_in_date: checkInDate, check_out_date: checkOutDate, total_price: reservation.total_price, payment_status: reservation.payment_status, new_guest_name: '', new_guest_email: '', new_guest_phone: '' });
    setCalculatedPrice(reservation.total_price);
    setModalOpened(true);
  };

  const handleDelete = async () => {
    // ... (fungsi tetap sama) ...
     if (!deleteTarget) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('reservations').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      notifications.show({ title: 'Sukses', message: 'Reservasi berhasil dihapus', color: 'green' });
      handleCloseDeleteModal();
      await fetchReservations();
    } catch (error: any) {
      console.error("Error deleting reservation:", error);
      notifications.show({ title: 'Error Penghapusan', message: error?.message || 'Gagal menghapus reservasi.', color: 'red' });
    } finally { setLoading(false); }
  };

  const handleCloseModal = () => {
    // ... (fungsi tetap sama) ...
     setModalOpened(false); setEditingReservation(null); setGuestSelectionMode('select'); setCalculatedPrice(null); form.reset();
  };

  const handleCloseDeleteModal = () => {
    // ... (fungsi tetap sama) ...
     setDeleteModalOpened(false); setDeleteTarget(null);
  };

  // --- Options for Select Inputs ---
  const guestOptions = useMemo(() => guestOptionsData.map((g) => ({
    value: g.id,
    label: `${g.full_name} (${g.email})`,
  })), [guestOptionsData]);

  const roomOptionsModal = useMemo(() => availableRooms.map((r) => ({ // Ganti nama agar tidak konflik
      value: r.id,
      label: `Kamar ${r.room_number} (${r.room_type?.name || 'Tipe Tidak Diketahui'}) - Rp ${r.room_type?.price_per_night?.toLocaleString('id-ID') ?? 'N/A'}/malam`,
    })), [availableRooms]);

  const paymentStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const getPaymentStatusColor = (status: string) => {
    // ... (fungsi tetap sama) ...
     switch (status) { case 'paid': return 'green'; case 'pending': return 'orange'; case 'cancelled': return 'red'; default: return 'gray'; }
  };


  if (loading && reservations.length === 0) {
    // ... (loader tetap sama) ...
     return ( <Center style={{ minHeight: 'calc(100vh - 140px)' }}> <Loader size="xl" /> </Center> );
  }

  // --- Variabel untuk minCheckoutDate (Tetap Sama) ---
  const checkInDateValue = form.values.check_in_date;
  const minCheckoutDate = (checkInDateValue instanceof Date && !isNaN(checkInDateValue.getTime())) ? new Date(checkInDateValue.getTime() + 86400000) : new Date(Date.now() + 86400000);


  return (
    <DatesProvider settings={{ locale: 'id', firstDayOfWeek: 1, weekendDays: [0] }}>
        <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        {/* Header Gradient */}
        {/* ... (header tetap sama) ... */}
         <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '2rem 0', marginBottom: '2rem', }} >
            <Container size="lg">
                <Group justify="space-between" align="center">
                    <div>
                        <Group mb="xs">
                            <ActionIcon variant="transparent" color="white" onClick={() => router.push('/admin/dashboard')} aria-label="Kembali ke Dashboard Admin" > <IconArrowLeft size={20} /> </ActionIcon>
                            <Title order={1} c="white"> Manajemen Reservasi </Title>
                        </Group>
                        <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}> Kelola reservasi hotel Anda </Text>
                    </div>
                     <Button leftSection={<IconPlus size={18} />} onClick={() => { setEditingReservation(null); setGuestSelectionMode('select'); form.reset(); setCalculatedPrice(null); setModalOpened(true); }} variant="white" color="teal" > Buat Reservasi </Button>
                </Group>
            </Container>
        </div>

        <Container size="lg" pb="xl">
            <Stack gap="lg">
                {/* --- Filter & Search Inputs --- */}
                 {reservations.length > 0 && ( // Tampilkan filter hanya jika ada data reservasi
                    <Paper shadow="xs" p="md" radius="md" withBorder mb="lg">
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
                                    data={paymentStatusOptions}
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
                                        { value: 'check_out_asc', label: 'Check-out (Terdekat)' },
                                        { value: 'check_out_desc', label: 'Check-out (Terjauh)' },
                                        { value: 'guest_name_asc', label: 'Nama Tamu (A-Z)' },
                                        { value: 'guest_name_desc', label: 'Nama Tamu (Z-A)' },
                                        { value: 'room_number_asc', label: 'No. Kamar (Asc)' },
                                        { value: 'room_number_desc', label: 'No. Kamar (Desc)' },
                                        { value: 'price_asc', label: 'Harga Termurah' },
                                        { value: 'price_desc', label: 'Harga Termahal' },
                                        { value: 'payment_status', label: 'Status Bayar' },
                                        { value: 'created_at_desc', label: 'Terbaru Dibuat' },
                                        { value: 'created_at_asc', label: 'Terlama Dibuat' },
                                    ]}
                                />
                            </Grid.Col>
                        </Grid>
                    </Paper>
                 )}

                {/* --- Table --- */}
                {reservations.length === 0 && !loading ? (
                   // ... (pesan jika tidak ada reservasi sama sekali) ...
                    <Paper shadow="sm" p="xl" radius="md" withBorder>
                        <Box ta="center"> <Text c="dimmed" mb="md"> Belum ada reservasi. Klik tombol 'Buat Reservasi' di atas. </Text> </Box>
                    </Paper>
                ) : filteredAndSortedReservations.length === 0 ? (
                    // Pesan jika filter/search tidak menghasilkan apa-apa
                    <Paper shadow="sm" p="lg" radius="md" withBorder>
                         <Text c="dimmed" ta="center" py="xl"> Tidak ada reservasi yang cocok dengan filter atau pencarian Anda. </Text>
                    </Paper>
                ) : (
                    <Paper shadow="sm" p="lg" radius="md" withBorder>
                    <Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing="sm">
                        <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Nama Tamu</Table.Th>
                            <Table.Th>Email Tamu</Table.Th>
                            <Table.Th>No. Kamar</Table.Th>
                            <Table.Th>Tipe Kamar</Table.Th>
                            <Table.Th>Check-in</Table.Th>
                            <Table.Th>Check-out</Table.Th>
                            <Table.Th>Total Harga</Table.Th>
                            <Table.Th>Status Bayar</Table.Th>
                            <Table.Th ta="center">Aksi</Table.Th>
                        </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                        {/* Render Filtered & Sorted Reservations */}
                        {filteredAndSortedReservations.map((res) => (
                            <Table.Tr key={res.id}>
                            <Table.Td fw={500}>{res.guest?.full_name || 'N/A'}</Table.Td>
                            <Table.Td>{res.guest?.email || 'N/A'}</Table.Td>
                            <Table.Td>{res.room?.room_number || 'N/A'}</Table.Td>
                            <Table.Td>{res.room?.room_type?.name || 'N/A'}</Table.Td>
                            <Table.Td>{res.check_in_date ? new Date(res.check_in_date + 'T00:00:00').toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric'}) : 'N/A'}</Table.Td>
                            <Table.Td>{res.check_out_date ? new Date(res.check_out_date + 'T00:00:00').toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric'}) : 'N/A'}</Table.Td>
                            <Table.Td>Rp {res.total_price.toLocaleString('id-ID')}</Table.Td>
                            <Table.Td>
                                <Badge color={getPaymentStatusColor(res.payment_status)} variant="light">
                                {res.payment_status.charAt(0).toUpperCase() + res.payment_status.slice(1)}
                                </Badge>
                            </Table.Td>
                            <Table.Td>
                                <Group gap="xs" justify="center">
                                <ActionIcon variant="light" color="blue" onClick={() => handleEdit(res)} aria-label={`Edit reservasi ${res.guest?.full_name}`} > <IconEdit size={16} /> </ActionIcon>
                                <ActionIcon variant="light" color="red" onClick={() => { setDeleteTarget(res); setDeleteModalOpened(true); }} aria-label={`Hapus reservasi ${res.guest?.full_name}`} > <IconTrash size={16} /> </ActionIcon>
                                </Group>
                            </Table.Td>
                            </Table.Tr>
                        ))}
                        </Table.Tbody>
                    </Table>
                    </Paper>
                )}
            </Stack>
        </Container>

        {/* --- Modals (Tetap Sama) --- */}
        {/* Modal Add/Edit Reservation */}
        <Modal opened={modalOpened} onClose={handleCloseModal} title={editingReservation ? 'Edit Reservasi' : 'Buat Reservasi Baru'} centered size="lg" >
            <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
                <Group grow> <Button variant={guestSelectionMode === 'select' ? 'filled' : 'outline'} onClick={() => setGuestSelectionMode('select')} color="teal"> Pilih Tamu Lama </Button> <Button variant={guestSelectionMode === 'new' ? 'filled' : 'outline'} onClick={() => setGuestSelectionMode('new')} color="teal"> Input Tamu Baru </Button> </Group>
                {guestSelectionMode === 'select' && ( <Select label="Pilih Tamu" placeholder="Cari atau pilih tamu..." data={guestOptions} searchable required={guestSelectionMode === 'select'} nothingFoundMessage="Tamu tidak ditemukan" {...form.getInputProps('guest_id')} /> )}
                {guestSelectionMode === 'new' && ( <> <TextInput label="Nama Tamu Baru" placeholder="Masukkan nama lengkap" required={guestSelectionMode === 'new'} leftSection={<IconUser size={18} stroke={1.5} />} {...form.getInputProps('new_guest_name')} /> <TextInput label="Email Tamu Baru" placeholder="email@tamu.com" required={guestSelectionMode === 'new'} leftSection={<IconMail size={18} stroke={1.5} />} {...form.getInputProps('new_guest_email')} /> <TextInput label="Nomor Telepon Tamu Baru (Opsional)" placeholder="0812..." leftSection={<IconPhone size={18} stroke={1.5} />} {...form.getInputProps('new_guest_phone')} /> </> )}
                 <Select label="Pilih Kamar (Hanya yang Tersedia)" placeholder="Pilih kamar..." data={roomOptionsModal} searchable required nothingFoundMessage="Tidak ada kamar tersedia" leftSection={<IconBed size={18} stroke={1.5} />} {...form.getInputProps('room_id')} />
                <Group grow> <DatePickerInput label="Tanggal Check-in" placeholder="Pilih tanggal" required valueFormat="DD MMMM YYYY" leftSection={<IconCalendar size={18} stroke={1.5} />} minDate={new Date()} {...form.getInputProps('check_in_date')} /> <DatePickerInput label="Tanggal Check-out" placeholder="Pilih tanggal" required valueFormat="DD MMMM YYYY" leftSection={<IconCalendar size={18} stroke={1.5} />} minDate={minCheckoutDate} {...form.getInputProps('check_out_date')} /> </Group>
                <Paper withBorder p="xs" radius="sm" bg="gray.0"> <Group justify="space-between"> <Text fw={500} size="sm">Estimasi Total Harga:</Text> <Text fw={700} size="lg" c="teal"> {calculatedPrice !== null ? `Rp ${calculatedPrice.toLocaleString('id-ID')}` : 'Pilih kamar & tanggal'} </Text> </Group> <NumberInput style={{ display: 'none' }} {...form.getInputProps('total_price')} readOnly /> </Paper>
                 <Select label="Status Pembayaran" placeholder="Pilih status" data={paymentStatusOptions} required leftSection={<IconCash size={18} stroke={1.5} />} {...form.getInputProps('payment_status')} />
                <Group justify="flex-end" mt="md"> <Button variant="default" onClick={handleCloseModal}> Batal </Button> <Button type="submit" loading={loading} disabled={calculatedPrice === null || calculatedPrice <= 0}> {editingReservation ? 'Update Reservasi' : 'Simpan Reservasi'} </Button> </Group>
            </Stack>
            </form>
        </Modal>

        {/* Modal Delete Confirmation */}
        <Modal opened={deleteModalOpened} onClose={handleCloseDeleteModal} title="Konfirmasi Hapus Reservasi" centered size="sm" >
            <Stack gap="md"> <Text size="sm"> Apakah Anda yakin ingin menghapus reservasi untuk tamu{' '} <strong>{deleteTarget?.guest?.full_name}</strong>? Tindakan ini tidak dapat dibatalkan. </Text> <Group justify="flex-end"> <Button variant="default" onClick={handleCloseDeleteModal} > Batal </Button> <Button color="red" onClick={handleDelete} loading={loading}> Hapus Reservasi </Button> </Group> </Stack>
        </Modal>
        </div>
    </DatesProvider>
  );
}