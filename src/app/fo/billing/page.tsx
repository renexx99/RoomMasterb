// src/app/fo/billing/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
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
  TextInput,
  Modal,
  Button,
  Avatar,
  Box,
  Table,
  Divider,
  NumberInput,
  Select,
  SegmentedControl,
  Grid,
  Card,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconSearch,
  IconUser,
  IconBed,
  IconFileInvoice,
  IconPlus,
  IconCash,
  IconReceipt,
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
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

// Tipe data untuk item folio (Simulasi)
interface FolioItem {
  id: string;
  description: string;
  amount: number;
}

function BillingFolioContent() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Menyimpan daftar tamu yang sedang in-house
  const [
    inHouseReservations,
    setInHouseReservations,
  ] = useState<ReservationDetails[]>([]);

  // State untuk Modal Folio
  const [folioModalOpened, setFolioModalOpened] = useState(false);
  const [
    selectedReservation,
    setSelectedReservation,
  ] = useState<ReservationDetails | null>(null);
  const [modalView, setModalView] = useState<'folio' | 'charge' | 'payment'>(
    'folio'
  );

  // State untuk simulasi item folio
  const [
    mockFolioItems,
    setMockFolioItems,
  ] = useState<FolioItem[]>([]);

  const assignedHotelId = profile?.roles?.find(
    (r) => r.hotel_id && r.role_name === 'Front Office'
  )?.hotel_id;

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!authLoading && assignedHotelId) {
      fetchInHouseReservations();
    } else if (!authLoading && !assignedHotelId) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, assignedHotelId]);

  // Ambil data tamu yang sedang menginap
  const fetchInHouseReservations = async () => {
    if (!assignedHotelId) return;
    setLoading(true);
    try {
      const commonSelect = `
        *,
        guest:guests(id, full_name, email),
        room:rooms(id, room_number, room_type:room_types(id, name, price_per_night))
      `;

      // Ambil reservasi yang aktif hari ini
      const { data, error } = await supabase
        .from('reservations')
        .select(commonSelect)
        .eq('hotel_id', assignedHotelId)
        .lte('check_in_date', today)
        .gte('check_out_date', today)
        .neq('payment_status', 'cancelled')
        .order('check_in_date', { ascending: true });

      if (error) throw error;
      setInHouseReservations((data as ReservationDetails[]) || []);
    } catch (error: any) {
      console.error('Error fetching in-house reservations:', error);
      notifications.show({
        title: 'Error',
        message:
          error?.message || 'Gagal memuat data reservasi yang sedang aktif.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter tamu in-house berdasarkan pencarian
  const filteredReservations = useMemo(() => {
    if (!searchTerm) return inHouseReservations;
    const lowerSearch = searchTerm.toLowerCase();
    return inHouseReservations.filter(
      (res) =>
        res.guest.full_name.toLowerCase().includes(lowerSearch) ||
        res.room.room_number.toLowerCase().includes(lowerSearch) ||
        res.guest.email.toLowerCase().includes(lowerSearch)
    );
  }, [inHouseReservations, searchTerm]);

  // --- Handlers Modal ---
  const handleOpenFolioModal = (res: ReservationDetails) => {
    setSelectedReservation(res);
    // (Simulasi) Reset/Fetch item folio untuk tamu ini
    setMockFolioItems([
      { id: 'l1', description: 'Laundry Service', amount: 75000 },
      { id: 'm1', description: 'Minibar - Cola', amount: 25000 },
    ]);
    setModalView('folio'); // Selalu mulai dari tab 'folio'
    setFolioModalOpened(true);
  };

  const handleCloseFolioModal = () => {
    setFolioModalOpened(false);
    setSelectedReservation(null);
    setMockFolioItems([]);
    setModalView('folio');
  };

  // --- Forms ---
  const chargeForm = useForm({
    initialValues: { description: '', amount: 0 },
    validate: {
      description: (val) => (val ? null : 'Deskripsi harus diisi'),
      amount: (val) => (val > 0 ? null : 'Jumlah harus lebih besar dari 0'),
    },
  });

  const paymentForm = useForm({
    initialValues: { method: 'Cash', amount: 0, notes: '' },
    validate: {
      method: (val) => (val ? null : 'Metode harus dipilih'),
      amount: (val) => (val > 0 ? null : 'Jumlah harus lebih besar dari 0'),
    },
  });

  // --- Aksi Folio (Simulasi & MVP) ---
  const handleAddCharge = (values: typeof chargeForm.values) => {
    // (Simulasi) Tambahkan ke state
    setMockFolioItems((currentItems) => [
      ...currentItems,
      {
        id: `demo_${Math.random()}`,
        description: values.description,
        amount: values.amount,
      },
    ]);
    notifications.show({
      title: 'Biaya Ditambahkan (Demo)',
      message: `${values.description} (Rp ${values.amount.toLocaleString(
        'id-ID'
      )}) ditambahkan ke folio.`,
      color: 'teal',
    });
    // Di aplikasi nyata, Anda akan insert ke tabel 'folio_items'
    // dan mungkin update 'total_price' di 'reservations'
    chargeForm.reset();
    setModalView('folio'); // Kembali ke tampilan folio
  };

  const handleReceivePayment = async (
    values: typeof paymentForm.values
  ) => {
    if (!selectedReservation) return;
    setLoading(true);
    try {
      // (Aksi MVP Nyata) Update status pembayaran reservasi
      const { error } = await supabase
        .from('reservations')
        .update({ payment_status: 'paid' })
        .eq('id', selectedReservation.id);

      if (error) throw error;

      notifications.show({
        title: 'Pembayaran Diterima (MVP)',
        message: `Pembayaran ${
          values.method
        } Rp ${values.amount.toLocaleString(
          'id-ID'
        )} dicatat. Status reservasi diubah menjadi PAID.`,
        color: 'green',
      });
      // Di aplikasi nyata, Anda akan insert ke tabel 'payments'
      // dan memperbarui sisa tagihan.
      paymentForm.reset();
      handleCloseFolioModal();
      await fetchInHouseReservations(); // Refresh daftar
    } catch (error: any) {
      notifications.show({
        title: 'Error Pembayaran',
        message: error.message || 'Gagal mencatat pembayaran.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Kalkulasi Total Tagihan (Simulasi)
  const baseRoomCharge = selectedReservation?.total_price || 0;
  const extraChargesTotal = mockFolioItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const totalFolioBalance = baseRoomCharge + extraChargesTotal;

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
                Billing & Folio Tamu
              </Title>
            </Group>
            <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>
              Kelola tagihan tamu yang sedang menginap (in-house).
            </Text>
          </div>
        </Container>
      </div>

      {/* Konten Utama */}
      <Container size="lg" pb="xl">
        <Stack gap="xl">
          {/* Search Bar */}
          <TextInput
            placeholder="Cari tamu berdasarkan nama atau nomor kamar..."
            leftSection={<IconSearch size={16} />}
            size="md"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            disabled={loading}
          />

          {/* Daftar Tamu In-House */}
          <Paper shadow="sm" p="lg" radius="md" withBorder>
            <Title order={3} mb="lg">
              Tamu In-House ({filteredReservations.length})
            </Title>
            {loading && (
              <Center py="xl">
                <Loader />
              </Center>
            )}
            {!loading && filteredReservations.length === 0 && (
              <Center py="xl">
                <Text c="dimmed">
                  {searchTerm
                    ? 'Tidak ada tamu in-house yang cocok.'
                    : 'Tidak ada tamu in-house saat ini.'}
                </Text>
              </Center>
            )}
            {!loading && filteredReservations.length > 0 && (
              <Stack gap="md">
                {filteredReservations.map((res) => (
                  <Card key={res.id} shadow="xs" radius="md" withBorder>
                    <Grid align="center">
                      <Grid.Col span={{ base: 12, sm: 5 }}>
                        <Group>
                          <Avatar color="teal" size="md" radius="xl">
                            <IconUser size={18} />
                          </Avatar>
                          <Box>
                            <Text fw={600}>{res.guest.full_name}</Text>
                            <Text c="dimmed" size="sm">
                              Kamar {res.room.room_number}
                            </Text>
                          </Box>
                        </Group>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Text size="sm">
                          Check-in:{' '}
                          {new Date(
                            res.check_in_date + 'T00:00:00'
                          ).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </Text>
                        <Text size="sm">
                          Check-out:{' '}
                          {new Date(
                            res.check_out_date + 'T00:00:00'
                          ).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 3 }}>
                        <Button
                          fullWidth
                          variant="light"
                          color="teal"
                          leftSection={<IconFileInvoice size={16} />}
                          onClick={() => handleOpenFolioModal(res)}
                        >
                          Lihat Folio
                        </Button>
                      </Grid.Col>
                    </Grid>
                  </Card>
                ))}
              </Stack>
            )}
          </Paper>
        </Stack>
      </Container>

      {/* Modal Folio (MVP) */}
      <Modal
        opened={folioModalOpened}
        onClose={handleCloseFolioModal}
        title={`Folio Tamu: ${selectedReservation?.guest.full_name || ''} (Kamar ${
          selectedReservation?.room.room_number || ''
        })`}
        centered
        size="xl" // Ukuran besar untuk menampung tab
      >
        <SegmentedControl
          fullWidth
          color="teal"
          value={modalView}
          onChange={(val) =>
            setModalView(val as 'folio' | 'charge' | 'payment')
          }
          data={[
            { label: 'Rincian Folio', value: 'folio' },
            { label: 'Tambah Biaya', value: 'charge' },
            { label: 'Terima Pembayaran', value: 'payment' },
          ]}
          mb="lg"
        />

        {/* Tampilan Rincian Folio */}
        {modalView === 'folio' && selectedReservation && (
          <Stack>
            <Table striped verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Deskripsi</Table.Th>
                  <Table.Th ta="right">Jumlah (Rp)</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td fw={500}>Biaya Kamar</Table.Td>
                  <Table.Td ta="right" fw={500}>
                    {baseRoomCharge.toLocaleString('id-ID')}
                  </Table.Td>
                </Table.Tr>
                {mockFolioItems.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>{item.description}</Table.Td>
                    <Table.Td ta="right">
                      {item.amount.toLocaleString('id-ID')}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              <Table.Tfoot>
                <Table.Tr>
                  <Table.Th>
                    <Title order={4}>Total Tagihan</Title>
                  </Table.Th>
                  <Table.Th ta="right">
                    <Title order={4} c="teal">
                      Rp {totalFolioBalance.toLocaleString('id-ID')}
                    </Title>
                  </Table.Th>
                </Table.Tr>
              </Table.Tfoot>
            </Table>
            <Text c="dimmed" size="xs" ta="center" mt="md">
              (Fitur Rincian Biaya Tambahan dan Pembayaran masih simulasi)
            </Text>
          </Stack>
        )}

        {/* Tampilan Tambah Biaya */}
        {modalView === 'charge' && (
          <form onSubmit={chargeForm.onSubmit(handleAddCharge)}>
            <Stack>
              <Title order={4}>Tambah Biaya Tambahan</Title>
              <TextInput
                label="Deskripsi Biaya"
                placeholder="Contoh: Minibar - 2x Cola"
                required
                leftSection={<IconReceipt size={18} />}
                {...chargeForm.getInputProps('description')}
              />
              <NumberInput
                label="Jumlah (Rp)"
                placeholder="50000"
                required
                min={0}
                thousandSeparator="."
                decimalSeparator=","
                hideControls
                leftSection={<IconCash size={18} />}
                {...chargeForm.getInputProps('amount')}
              />
              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={handleCloseFolioModal}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  color="teal"
                  leftSection={<IconPlus size={18} />}
                >
                  Tambahkan Biaya
                </Button>
              </Group>
            </Stack>
          </form>
        )}

        {/* Tampilan Terima Pembayaran */}
        {modalView === 'payment' && (
          <form onSubmit={paymentForm.onSubmit(handleReceivePayment)}>
            <Stack>
              <Title order={4}>Terima Pembayaran</Title>
              <Text>
                Total Tagihan Saat Ini (Simulasi):{' '}
                <Text component="span" fw={700} c="teal" size="lg">
                  Rp {totalFolioBalance.toLocaleString('id-ID')}
                </Text>
              </Text>
              <Select
                label="Metode Pembayaran"
                data={['Cash', 'Credit Card', 'Bank Transfer']}
                required
                {...paymentForm.getInputProps('method')}
              />
              <NumberInput
                label="Jumlah Pembayaran (Rp)"
                placeholder="Masukkan jumlah yang dibayar"
                required
                min={0}
                thousandSeparator="."
                decimalSeparator=","
                hideControls
                leftSection={<IconCash size={18} />}
                {...paymentForm.getInputProps('amount')}
              />
              <TextInput
                label="Catatan (Opsional)"
                placeholder="No. Ref, dll..."
                {...paymentForm.getInputProps('notes')}
              />
              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={handleCloseFolioModal}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  color="green"
                  loading={loading}
                  leftSection={<IconCash size={18} />}
                >
                  Terima Pembayaran (MVP)
                </Button>
              </Group>
              <Text c="dimmed" size="xs" mt="sm">
                Aksi MVP: Ini akan mengubah status reservasi menjadi 'Paid'
                tetapi belum mengurangi total tagihan (karena simulasi).
              </Text>
            </Stack>
          </form>
        )}
      </Modal>
    </div>
  );
}

// Bungkus dengan ProtectedRoute
export default function BillingPage() {
  return (
    <ProtectedRoute requiredRoleName="Front Office">
      <BillingFolioContent />
    </ProtectedRoute>
  );
}