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
  TextInput,
  Stack,
  Paper,
  ActionIcon,
  Text,
  Box,
  Loader,
  Center,
  Select,
  Badge,
  NumberInput,
} from '@mantine/core';
// Pastikan @mantine/dates sudah terinstall
import { DatePickerInput, DatesProvider } from '@mantine/dates';
import 'dayjs/locale/id'; // Import locale
import { IconEdit, IconTrash, IconPlus, IconArrowLeft, IconUser, IconMail, IconPhone, IconBed, IconCalendar, IconCash } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import '@mantine/dates/styles.css';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Guest, Reservation, Room, RoomType } from '@/core/types/database'; // Import types

// Gabungkan tipe data yang dibutuhkan
interface ReservationDetails extends Reservation {
  guest?: Pick<Guest, 'id' | 'full_name' | 'email'>;
  room?: Pick<Room, 'id' | 'room_number'> & {
    room_type?: Pick<RoomType, 'id' | 'name' | 'price_per_night'>;
  };
}

interface RoomWithDetails extends Room {
    room_type?: RoomType;
}

// Definisikan tipe baru hanya untuk data tamu di Select
interface GuestOption {
  id: string;
  full_name: string;
  email: string;
}

export default function ReservationsManagementPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<ReservationDetails[]>([]);
  // Gunakan GuestOption untuk state tamu di Select
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
      payment_status: 'pending' as 'pending' | 'paid' | 'cancelled',
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
        // Pastikan keduanya adalah objek Date sebelum membandingkan
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
      notifications.show({
        title: 'Error',
        message: error?.message || 'Gagal memuat data awal.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    if (!profile?.hotel_id) return;
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        guest:guests ( id, full_name, email ),
        room:rooms (
          id,
          room_number,
          room_type:room_types ( id, name, price_per_night )
        )
      `)
      .eq('hotel_id', profile.hotel_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setReservations((data as ReservationDetails[]) || []);
  };

  // Fetch data tamu hanya untuk Select
  const fetchGuestsForSelect = async () => {
    if (!profile?.hotel_id) return;
    const { data, error } = await supabase
      .from('guests')
      .select('id, full_name, email') // Hanya select kolom yang dibutuhkan
      .eq('hotel_id', profile.hotel_id)
      .order('full_name', { ascending: true });

    if (error) throw error;
    // Set state dengan data yang sudah sesuai tipe GuestOption[]
    setGuestOptionsData((data as GuestOption[]) || []);
  };

  const fetchAvailableRooms = async () => {
     if (!profile?.hotel_id) return;
     const { data, error } = await supabase
        .from('rooms')
        .select(`*, room_type:room_types(*)`)
        .eq('hotel_id', profile.hotel_id)
        .eq('status', 'available')
        .order('room_number', { ascending: true });

     if (error) throw error;
     setAvailableRooms((data as RoomWithDetails[]) || []);
  };

  // --- Price Calculation ---
   useEffect(() => {
    const { check_in_date, check_out_date, room_id } = form.values;

    // Pastikan nilai adalah objek Date yang valid sebelum perbandingan
    const checkIn = check_in_date ? new Date(check_in_date) : null;
    const checkOut = check_out_date ? new Date(check_out_date) : null;
    
    if (checkIn && checkOut && checkOut > checkIn && room_id) {
      const selectedRoom = availableRooms.find(room => room.id === room_id);
      if (selectedRoom?.room_type?.price_per_night) {
        
        // Hitung selisih hari (pastikan menghitung malam, bukan hari)
        const durationInNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

        if (durationInNights > 0) {
            const price = durationInNights * selectedRoom.room_type.price_per_night;
            setCalculatedPrice(price);
            form.setFieldValue('total_price', price);
        } else {
             setCalculatedPrice(null);
             form.setFieldValue('total_price', 0);
        }
      } else {
         setCalculatedPrice(null);
         form.setFieldValue('total_price', 0);
      }
    } else {
      setCalculatedPrice(null);
      form.setFieldValue('total_price', 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.check_in_date, form.values.check_out_date, form.values.room_id, availableRooms]);


  // --- Submit Handler ---
  const handleSubmit = async (values: typeof form.values) => {
    if (!profile?.hotel_id) return;

    let targetGuestId = values.guest_id;

    try {
        setLoading(true);

      // 1. Handle Guest: Create new guest if needed
      if (guestSelectionMode === 'new') {
        const { data: newGuest, error: guestError } = await supabase
          .from('guests')
          .insert({
            hotel_id: profile.hotel_id,
            full_name: values.new_guest_name,
            email: values.new_guest_email,
            phone_number: values.new_guest_phone || null,
          })
          .select('id')
          .single();

        if (guestError) {
            if (guestError?.code === '23505') { // Asumsi ada unique constraint di (hotel_id, email)
                 throw new Error('Email tamu baru sudah terdaftar di hotel ini.');
            }
            throw guestError;
        }
        targetGuestId = newGuest.id;
        await fetchGuestsForSelect(); // Refresh guest list
      }

      if (!targetGuestId) {
          throw new Error("Guest ID tidak valid.");
      }

      // 2. Prepare Reservation Data
      // *** PERBAIKAN: Hapus fungsi formatDate. ***
      // Kirim objek Date langsung ke Supabase.
      const reservationData = {
        hotel_id: profile.hotel_id,
        guest_id: targetGuestId,
        room_id: values.room_id,
        check_in_date: values.check_in_date, // Kirim Date object
        check_out_date: values.check_out_date, // Kirim Date object
        total_price: calculatedPrice ?? 0,
        payment_status: values.payment_status,
      };

      // 3. Insert or Update Reservation
      if (editingReservation) {
        // Update
        const { error } = await supabase
          .from('reservations')
          .update(reservationData)
          .eq('id', editingReservation.id);
        if (error) throw error;
        notifications.show({
          title: 'Sukses',
          message: 'Reservasi berhasil diperbarui',
          color: 'green',
        });
      } else {
        // Insert
        const { error } = await supabase
          .from('reservations')
          .insert(reservationData);
        if (error) throw error;
        notifications.show({
          title: 'Sukses',
          message: 'Reservasi baru berhasil dibuat',
          color: 'green',
        });
      }

      handleCloseModal();
      await fetchReservations(); // Refresh reservation list

    } catch (error: any) {
        console.error("Error saving reservation:", error);
      notifications.show({
        title: 'Error Penyimpanan',
        message: error?.message || 'Gagal menyimpan reservasi.',
        color: 'red',
      });
    } finally {
        setLoading(false);
    }
  };

 const handleEdit = (reservation: ReservationDetails) => {
    setEditingReservation(reservation);
    setGuestSelectionMode('select');
    // Tambahkan 'T00:00:00' untuk memastikan new Date() mem-parsing string 'YYYY-MM-DD'
    // sebagai tanggal lokal, bukan UTC, yang bisa menyebabkan bug 1 hari.
    const checkInDate = reservation.check_in_date ? new Date(reservation.check_in_date + 'T00:00:00') : null;
    const checkOutDate = reservation.check_out_date ? new Date(reservation.check_out_date + 'T00:00:00') : null;

    form.setValues({
      guest_id: reservation.guest_id,
      room_id: reservation.room_id,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      total_price: reservation.total_price,
      payment_status: reservation.payment_status,
      new_guest_name: '',
      new_guest_email: '',
      new_guest_phone: '',
    });
    setCalculatedPrice(reservation.total_price);
    setModalOpened(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      notifications.show({
        title: 'Sukses',
        message: 'Reservasi berhasil dihapus',
        color: 'green',
      });
      handleCloseDeleteModal();
      await fetchReservations();
    } catch (error: any) {
        console.error("Error deleting reservation:", error);
      notifications.show({
        title: 'Error Penghapusan',
        message: error?.message || 'Gagal menghapus reservasi.',
        color: 'red',
      });
    } finally {
        setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpened(false);
    setEditingReservation(null);
    setGuestSelectionMode('select');
    setCalculatedPrice(null);
    form.reset();
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpened(false);
    setDeleteTarget(null);
  };

  // --- Options for Select Inputs ---
  // Gunakan guestOptionsData yang sudah sesuai tipenya
  const guestOptions = useMemo(() => guestOptionsData.map((g) => ({
    value: g.id,
    label: `${g.full_name} (${g.email})`,
  })), [guestOptionsData]);

  const roomOptions = useMemo(() => availableRooms.map((r) => ({
      value: r.id,
      label: `Kamar ${r.room_number} (${r.room_type?.name || 'Tipe Tidak Diketahui'}) - Rp ${r.room_type?.price_per_night?.toLocaleString('id-ID') ?? 'N/A'}/malam`,
    })), [availableRooms]);

  const paymentStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'green';
      case 'pending': return 'orange';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };


  if (loading && reservations.length === 0) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 140px)' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  // --- PERBAIKAN LOGIKA minDate ---
  // Kita buat variabel di sini agar lebih bersih
  const checkInDateValue = form.values.check_in_date;
  const minCheckoutDate = 
      // Cek apakah itu instance Date DAN bukan "Invalid Date"
      (checkInDateValue instanceof Date && !isNaN(checkInDateValue.getTime()))
      // Jika valid, atur minDate ke H+1
      ? new Date(checkInDateValue.getTime() + 86400000) 
      // Jika tidak valid (atau null), atur minDate ke besok
      : new Date(Date.now() + 86400000);


  return (
    // Gunakan DatesProvider untuk DatePickerInput
    <DatesProvider settings={{ locale: 'id', firstDayOfWeek: 1, weekendDays: [0] }}>
        <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        {/* Header Gradient */}
        <div
            style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '2rem 0',
            marginBottom: '2rem',
            }}
        >
            <Container size="lg">
                <Group justify="space-between" align="center">
                    <div>
                        <Group mb="xs">
                            <ActionIcon
                            variant="transparent"
                            color="white"
                            onClick={() => router.push('/admin/dashboard')}
                            aria-label="Kembali ke Dashboard Admin"
                            >
                            <IconArrowLeft size={20} />
                            </ActionIcon>
                            <Title order={1} c="white">
                                Manajemen Reservasi
                            </Title>
                        </Group>
                        <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>
                            Kelola reservasi hotel Anda
                        </Text>
                    </div>
                     <Button
                        leftSection={<IconPlus size={18} />}
                        onClick={() => {
                            setEditingReservation(null);
                            setGuestSelectionMode('select');
                            form.reset();
                            setCalculatedPrice(null);
                            setModalOpened(true);
                        }}
                        variant="white"
                        color="teal"
                    >
                        Buat Reservasi
                    </Button>
                </Group>
            </Container>
        </div>

        <Container size="lg" pb="xl">
            <Stack gap="lg">
            {reservations.length === 0 && !loading ? (
                <Paper shadow="sm" p="xl" radius="md" withBorder>
                <Box ta="center">
                    <Text c="dimmed" mb="md">
                    Belum ada reservasi. Klik tombol 'Buat Reservasi' di atas.
                    </Text>
                </Box>
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
                    {reservations.map((res) => (
                        <Table.Tr key={res.id}>
                        <Table.Td fw={500}>{res.guest?.full_name || 'N/A'}</Table.Td>
                        <Table.Td>{res.guest?.email || 'N/A'}</Table.Td>
                        <Table.Td>{res.room?.room_number || 'N/A'}</Table.Td>
                        <Table.Td>{res.room?.room_type?.name || 'N/A'}</Table.Td>
                        {/* Tambahkan 'T00:00:00' untuk parsing tanggal lokal yang aman */}
                        <Table.Td>{res.check_in_date ? new Date(res.check_in_date + 'T00:00:00').toLocaleDateString('id-ID') : 'N/A'}</Table.Td>
                        <Table.Td>{res.check_out_date ? new Date(res.check_out_date + 'T00:00:00').toLocaleDateString('id-ID') : 'N/A'}</Table.Td>
                        <Table.Td>Rp {res.total_price.toLocaleString('id-ID')}</Table.Td>
                        <Table.Td>
                            <Badge color={getPaymentStatusColor(res.payment_status)} variant="light">
                            {res.payment_status.charAt(0).toUpperCase() + res.payment_status.slice(1)}
                            </Badge>
                        </Table.Td>
                        <Table.Td>
                            <Group gap="xs" justify="center">
                            <ActionIcon
                                variant="light" color="blue"
                                onClick={() => handleEdit(res)}
                                aria-label={`Edit reservasi ${res.guest?.full_name}`}
                            >
                                <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                                variant="light" color="red"
                                onClick={() => {
                                setDeleteTarget(res);
                                setDeleteModalOpened(true);
                                }}
                                aria-label={`Hapus reservasi ${res.guest?.full_name}`}
                            >
                                <IconTrash size={16} />
                            </ActionIcon>
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

        {/* Modal Add/Edit Reservation */}
        <Modal
            opened={modalOpened}
            onClose={handleCloseModal}
            title={editingReservation ? 'Edit Reservasi' : 'Buat Reservasi Baru'}
            centered
            size="lg"
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
                {/* Guest Selection */}
                <Group grow>
                     <Button
                        variant={guestSelectionMode === 'select' ? 'filled' : 'outline'}
                        onClick={() => setGuestSelectionMode('select')}
                        color="teal"
                     >
                        Pilih Tamu Lama
                     </Button>
                      <Button
                        variant={guestSelectionMode === 'new' ? 'filled' : 'outline'}
                        onClick={() => setGuestSelectionMode('new')}
                        color="teal"
                      >
                        Input Tamu Baru
                      </Button>
                </Group>

                {guestSelectionMode === 'select' && (
                <Select
                    label="Pilih Tamu"
                    placeholder="Cari atau pilih tamu..."
                    data={guestOptions} // Gunakan data yang sudah di-map
                    searchable
                    required={guestSelectionMode === 'select'}
                    nothingFoundMessage="Tamu tidak ditemukan"
                    {...form.getInputProps('guest_id')}
                />
                )}

                {guestSelectionMode === 'new' && (
                <>
                    <TextInput
                    label="Nama Tamu Baru"
                    placeholder="Masukkan nama lengkap"
                    required={guestSelectionMode === 'new'}
                    leftSection={<IconUser size={18} stroke={1.5} />}
                    {...form.getInputProps('new_guest_name')}
                    />
                    <TextInput
                    label="Email Tamu Baru"
                    placeholder="email@tamu.com"
                    required={guestSelectionMode === 'new'}
                    leftSection={<IconMail size={18} stroke={1.5} />}
                    {...form.getInputProps('new_guest_email')}
                    />
                     <TextInput
                        label="Nomor Telepon Tamu Baru (Opsional)"
                        placeholder="0812..."
                        leftSection={<IconPhone size={18} stroke={1.5} />}
                        {...form.getInputProps('new_guest_phone')}
                    />
                </>
                )}

                 {/* Room Selection */}
                 <Select
                    label="Pilih Kamar (Hanya yang Tersedia)"
                    placeholder="Pilih kamar..."
                    data={roomOptions}
                    searchable
                    required
                    nothingFoundMessage="Tidak ada kamar tersedia"
                    leftSection={<IconBed size={18} stroke={1.5} />}
                    {...form.getInputProps('room_id')}
                />

                 {/* Date Selection */}
                <Group grow>
                    <DatePickerInput
                        label="Tanggal Check-in"
                        placeholder="Pilih tanggal"
                        required
                        valueFormat="DD MMMM YYYY" // Format tanggal Indonesia
                        leftSection={<IconCalendar size={18} stroke={1.5} />}
                        minDate={new Date()} // Prevent past dates
                        {...form.getInputProps('check_in_date')}
                        />
                    <DatePickerInput
                        label="Tanggal Check-out"
                        placeholder="Pilih tanggal"
                        required
                        valueFormat="DD MMMM YYYY" // Format tanggal Indonesia
                        leftSection={<IconCalendar size={18} stroke={1.5} />}
                        // *** PERBAIKAN: Gunakan variabel minCheckoutDate yang sudah divalidasi ***
                        minDate={minCheckoutDate}
                        {...form.getInputProps('check_out_date')}
                    />
                </Group>

                {/* Calculated Price Display */}
                <Paper withBorder p="xs" radius="sm" bg="gray.0">
                    <Group justify="space-between">
                        <Text fw={500} size="sm">Estimasi Total Harga:</Text>
                        <Text fw={700} size="lg" c="teal">
                             {calculatedPrice !== null ? `Rp ${calculatedPrice.toLocaleString('id-ID')}` : 'Pilih kamar & tanggal'}
                        </Text>
                    </Group>
                     {/* Input tersembunyi untuk menyimpan nilai total_price */}
                     <NumberInput
                        style={{ display: 'none' }} // Sembunyikan input ini
                        {...form.getInputProps('total_price')}
                        readOnly // Hanya untuk menyimpan nilai
                     />
                </Paper>

                {/* Payment Status */}
                 <Select
                    label="Status Pembayaran"
                    placeholder="Pilih status"
                    data={paymentStatusOptions}
                    required
                    leftSection={<IconCash size={18} stroke={1.5} />}
                    {...form.getInputProps('payment_status')}
                />

                <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={handleCloseModal}>
                    Batal
                </Button>
                {/* Disable tombol simpan jika harga belum terhitung atau 0 */}
                <Button type="submit" loading={loading} disabled={calculatedPrice === null || calculatedPrice <= 0}>
                    {editingReservation ? 'Update Reservasi' : 'Simpan Reservasi'}
                </Button>
                </Group>
            </Stack>
            </form>
        </Modal>

        {/* Modal Delete Confirmation */}
        <Modal
            opened={deleteModalOpened}
            onClose={handleCloseDeleteModal}
            title="Konfirmasi Hapus Reservasi"
            centered
            size="sm"
        >
            <Stack gap="md">
            <Text size="sm">
                Apakah Anda yakin ingin menghapus reservasi untuk tamu{' '}
                <strong>{deleteTarget?.guest?.full_name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </Text>
            <Group justify="flex-end">
                <Button
                variant="default"
                onClick={handleCloseDeleteModal}
                >
                Batal
                </Button>
                <Button color="red" onClick={handleDelete} loading={loading}>
                Hapus Reservasi
                </Button>
            </Group>
            </Stack>
        </Modal>
        </div>
    </DatesProvider>
  );
}